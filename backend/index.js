//metodos post api/compilar  -> parsea wison, valida y construye el LL1
//metodo past api/analizar -> tokeniza cadenas y ejecuta parser ll1


const express = require('express');
const cors = require('cors');
const Persistencia = require('./Persistencia')
const persistencia = new Persistencia();
const parser = require('./wison-parser/wison');
const AnalizadorSemantico = require('./semantico/AnalizadorSemantico');
const Tokenizador = require('./lexer/Tokenizador');
const MotorLL1 = require('./ll1/MotorLL1');
const ParserDescendente = require('./parser-descendente/ParserDescendente');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Almacen de analizadores creados
// Cargar analizadores guardados y reconstruir motores LL(1)
const analizadoresGuardados = persistencia.cargar();
const analizadores = {};

for (const [nombre, datos] of Object.entries(analizadoresGuardados)) {
    try {
        const motor = new MotorLL1(datos.ast);
        motor.construir();
        if (motor.esLL1) {
            analizadores[nombre] = {
                nombre: datos.nombre,
                ast: datos.ast,
                motor
            };
        }
    } catch (e) {
        console.error(`Error al reconstruir analizador "${nombre}":`, e.message);
    }
}

console.log(`${Object.keys(analizadores).length} analizador(es) cargado(s) desde disco.`);

//api post/compilar
// Respuesta: { exito, ast, primero, siguiente, tabla, colisiones, errores }
// =============================================
app.post('/api/compilar', (req, res) => {
    const { codigo, nombre } = req.body;

    if (!codigo) {
        return res.status(400).json({
            exito: false,
            errores: [{ tipo: 'general', mensaje: 'No se envió código Wison.' }]
        });
    }

    const nombreAnalizador = nombre || `analizador_${Date.now()}`;
    const errores = [];

    // Paso 1: Parsear Wison con Jison
    let ast;
    try {
        ast = parser.parse(codigo);
    } catch (e) {
        return res.json({
            exito: false,
            errores: [{ tipo: 'sintactico', mensaje: `Error de parseo: ${e.message}` }]
        });
    }

        const erroresParser = [
        ...(ast.erroresLexicos || []),
        ...(ast.erroresSintacticos || [])
    ];

    // Paso 2: Analisis semantico
    const semantico = new AnalizadorSemantico(ast);
    const resSem = semantico.analizar();

        // Juntar todos los errores
    const todosErrores = [
        ...erroresParser,
        ...resSem.errores.map(e => ({ tipo: e.tipo, mensaje: e.mensaje }))
    ];

  // Paso 3: Construir motor LL(1)
    const motor = new MotorLL1(ast);
    motor.construir();

    const primero = {};
    for (const [nt, conj] of Object.entries(motor.primero)) {
        primero[nt] = [...conj];
    }

    const siguiente = {};
    for (const [nt, conj] of Object.entries(motor.siguiente)) {
        siguiente[nt] = [...conj];
    }

    const tabla = {};
    for (const [nt, fila] of Object.entries(motor.tabla)) {
        tabla[nt] = {};
        for (const [terminal, produccion] of Object.entries(fila)) {
            tabla[nt][terminal] = produccion;
        }
    }

    // Agregar colisiones a los errores
    const colisionesArr = motor.colisiones.map(c => ({ tipo: c.tipo, mensaje: c.mensaje }));
    todosErrores.push(...colisionesArr);

    // Solo guardar si no hay errores de ningún tipo
    const exitoTotal = todosErrores.length === 0 && motor.esLL1;

    if (exitoTotal) {
        analizadores[nombreAnalizador] = {
            nombre: nombreAnalizador,
            ast,
            motor
        };
        persistencia.guardar(analizadores);
    }

    res.json({
        exito: exitoTotal,
        nombre: nombreAnalizador,
        ast: {
            terminales: Object.keys(ast.terminales),
            noTerminales: ast.noTerminales,
            simboloInicial: ast.simboloInicial,
            producciones: ast.producciones
        },
        primero,
        siguiente,
        tabla,
        colisiones: colisionesArr,
        esLL1: motor.esLL1,
        errores: todosErrores
    });
});

// POST /api/analizar
// Body: { nombre: "miAnalizador", cadena: "a+a+aFIN" }
// Respuesta: { exito, tokens, arbol, errores }
app.post('/api/analizar', (req, res) => {
    const { nombre, cadena } = req.body;

    if (!nombre || !analizadores[nombre]) {
        return res.status(400).json({
            exito: false,
            errores: [{ tipo: 'general', mensaje: `Analizador "${nombre}" no encontrado.` }]
        });
    }

    if (cadena === undefined || cadena === null) {
        return res.status(400).json({
            exito: false,
            errores: [{ tipo: 'general', mensaje: 'No se envió cadena a analizar.' }]
        });
    }

    const analizador = analizadores[nombre];
    const { ast, motor } = analizador;

    // Paso 1: Tokenizar la cadena
    const tokenizador = new Tokenizador(ast.terminales);
    const { tokens, errores: erroresLex } = tokenizador.tokenizar(cadena);

    if (erroresLex.length > 0) {
        return res.json({
            exito: false,
            tokens: tokens.map(t => ({ tipo: t.tipo, valor: t.valor, posicion: t.posicion })),
            arbol: null,
            errores: erroresLex.map(e => ({ tipo: e.tipo, mensaje: e.mensaje }))
        });
    }

    // Paso 2: Parser descendente recursivo
    const miParser = new ParserDescendente(motor.tabla, ast.simboloInicial);
    const resultado = miParser.analizar(tokens);

    // Convertir arbol a objeto plano para JSON
    const arbolPlano = resultado.arbol ? arbolAJSON(resultado.arbol) : null;

    res.json({
        exito: resultado.aceptada,
        tokens: tokens.map(t => ({ tipo: t.tipo, valor: t.valor, posicion: t.posicion })),
        arbol: arbolPlano,
        errores: resultado.errores.map(e => ({ tipo: e.tipo, mensaje: e.mensaje }))
    });
});

// GET /api/analizadores
// Retorna la lista de analizadores creados
app.get('/api/analizadores', (req, res) => {
    const lista = Object.values(analizadores).map(a => ({
        nombre: a.nombre,
        simboloInicial: a.ast.simboloInicial,
        noTerminales: a.ast.noTerminales,
        terminales: Object.keys(a.ast.terminales)
    }));

    res.json({ analizadores: lista });
});

// DELETE /api/analizadores/:nombre
// Elimina un analizador de la lista
app.delete('/api/analizadores/:nombre', (req, res) => {
    const { nombre } = req.params;

    if (analizadores[nombre]) {
        delete analizadores[nombre];
        persistencia.guardar(analizadores);
        res.json({ exito: true, mensaje: `Analizador "${nombre}" eliminado.` });
    } else {
        res.status(404).json({ exito: false, mensaje: `Analizador "${nombre}" no encontrado.` });
    }
});

// Funcion auxiliar: convertir NodoArbol a JSON
function arbolAJSON(nodo) {
    if (!nodo) return null;

    const obj = {
        nombre: nodo.nombre,
        esTerminal: nodo.esTerminal,
        valor: nodo.valor,
        hijos: []
    };

    for (const hijo of nodo.hijos) {
        obj.hijos.push(arbolAJSON(hijo));
    }

    return obj;
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor Wison corriendo en http://localhost:${PORT}`);
});