/* ==========================================
   PARSER DESCENDENTE RECURSIVO LL(1)
   Práctica 2 - Compiladores 1

   Usa la tabla M generada por ll1.js para
   analizar una secuencia de tokens y generar
   el árbol de derivación.

   Equivalente al pseudocódigo del curso:
   E(), Ep(), T(), F(), consumir(), getToken()
   ========================================== */

// =============================================
// Clase NodoArbol: cada nodo del árbol de
// derivación. Puede ser terminal o no terminal.
// =============================================
class NodoArbol {
    constructor(nombre, esTerminal) {
        this.nombre = nombre;           // nombre del símbolo (%_S, $_A, etc.)
        this.esTerminal = esTerminal;   // true si es terminal
        this.valor = null;              // valor del token (solo para terminales)
        this.hijos = [];                // hijos en el árbol
    }

    agregarHijo(hijo) {
        this.hijos.push(hijo);
    }
}

// =============================================
// Clase ParserLL1: ejecuta el análisis
// descendente recursivo usando la tabla M
// =============================================
class ParserLL1 {
    constructor(tablaM, simboloInicial, terminales) {
        this.tablaM = tablaM;              // tabla M de ll1.js
        this.simboloInicial = simboloInicial;
        this.terminales = terminales;       // set de nombres de terminales
        this.tokens = [];                   // lista de tokens del lexer
        this.posicion = 0;                  // posición actual en la lista
        this.errores = [];                  // errores encontrados
        this.tokenActual = null;            // token actual (equivalente a 'token' en el pseudocódigo)
    }

    // =============================================
    // Método principal: analizar una lista de tokens
    // Retorna el árbol de derivación o errores
    // =============================================
    analizar(tokens) {
        this.tokens = tokens;
        this.posicion = 0;
        this.errores = [];

        // getToken() inicial — obtener el primer token
        this.avanzar();

        // Llamar a la función del símbolo inicial
        const arbol = this.procesarNoTerminal(this.simboloInicial);

        // Verificar que se consumió toda la entrada
        if (this.tokenActual !== null) {
            this.errores.push({
                tipo: 'sintactico',
                mensaje: `Se esperaba fin de cadena pero se encontró "${this.tokenActual.tipo}" con valor "${this.tokenActual.valor}".`
            });
        }

        return {
            arbol,
            errores: this.errores,
            aceptada: this.errores.length === 0
        };
    }

    // =============================================
    // avanzar(): equivalente a getToken()
    // Obtiene el siguiente token de la lista
    // =============================================
    avanzar() {
        if (this.posicion < this.tokens.length) {
            this.tokenActual = this.tokens[this.posicion];
            this.posicion++;
        } else {
            this.tokenActual = null; // fin de cadena
        }
    }

    // =============================================
    // consumir(): verifica que el token actual sea
    // el esperado y avanza al siguiente
    // =============================================
    consumir(tipoEsperado) {
        if (this.tokenActual && this.tokenActual.tipo === tipoEsperado) {
            const nodo = new NodoArbol(tipoEsperado, true);
            nodo.valor = this.tokenActual.valor;
            this.avanzar();
            return nodo;
        } else {
            const encontrado = this.tokenActual
                ? `"${this.tokenActual.tipo}" con valor "${this.tokenActual.valor}"`
                : 'fin de cadena';
            this.errores.push({
                tipo: 'sintactico',
                mensaje: `Se esperaba "${tipoEsperado}" pero se encontró ${encontrado}.`
            });
            return null;
        }
    }

    // =============================================
    // procesarNoTerminal(): equivalente a E(), Ep(),
    // T(), F() del pseudocódigo.
    //
    // Consulta la tabla M con el no terminal actual
    // y el token actual para decidir qué producción
    // aplicar. Luego procesa cada símbolo del cuerpo.
    // =============================================
    procesarNoTerminal(noTerminal) {
        const nodo = new NodoArbol(noTerminal, false);

        // Determinar qué terminal estamos viendo
        // Si ya no hay tokens, estamos en $
        const terminalActual = this.tokenActual ? this.tokenActual.tipo : '$';

        // Consultar la tabla M[noTerminal, terminalActual]
        const fila = this.tablaM[noTerminal];
        if (!fila) {
            this.errores.push({
                tipo: 'sintactico',
                mensaje: `No terminal "${noTerminal}" no tiene entrada en la tabla M.`
            });
            return nodo;
        }

        const produccion = fila[terminalActual];
        if (!produccion) {
            // No hay producción para esta combinación → error
            const esperados = Object.keys(fila).join(', ');
            this.errores.push({
                tipo: 'sintactico',
                mensaje: `Error en "${noTerminal}": se encontró "${terminalActual}" pero se esperaba uno de: ${esperados}.`
            });
            return nodo;
        }

        // Procesar cada símbolo del cuerpo de la producción
        for (const simbolo of produccion) {
            // Si es épsilon, agregar nodo hoja ε y no hacer nada más
            if (simbolo === 'ε') {
                const hojaEpsilon = new NodoArbol('ε', true);
                hojaEpsilon.valor = 'ε';
                nodo.agregarHijo(hojaEpsilon);
                continue;
            }

            // Si es terminal → consumir
            if (simbolo.startsWith('$_')) {
                const hijoTerminal = this.consumir(simbolo);
                if (hijoTerminal) {
                    nodo.agregarHijo(hijoTerminal);
                } else {
                    // Error al consumir, ya se reportó
                    return nodo;
                }
            }
            // Si es no terminal → llamada recursiva
            else if (simbolo.startsWith('%_')) {
                const hijoNoTerminal = this.procesarNoTerminal(simbolo);
                nodo.agregarHijo(hijoNoTerminal);

                // Si hubo errores, detenerse
                if (this.errores.length > 0) return nodo;
            }
        }

        return nodo;
    }
}

// =============================================
// Función auxiliar para imprimir el árbol
// de derivación en consola de forma legible
// =============================================
function imprimirArbol(nodo, prefijo, esUltimo) {
    if (!nodo) return;

    // Elegir el conector visual
    const conector = esUltimo ? '└── ' : '├── ';
    const extension = esUltimo ? '    ' : '│   ';

    // Mostrar el nodo
    if (nodo.esTerminal) {
        if (nodo.valor === 'ε') {
            console.log(prefijo + conector + 'ε');
        } else {
            console.log(prefijo + conector + `${nodo.nombre} : "${nodo.valor}"`);
        }
    } else {
        console.log(prefijo + conector + nodo.nombre);
    }

    // Mostrar hijos recursivamente
    for (let i = 0; i < nodo.hijos.length; i++) {
        const esUltimoHijo = i === nodo.hijos.length - 1;
        imprimirArbol(nodo.hijos[i], prefijo + extension, esUltimoHijo);
    }
}

// Función wrapper para imprimir desde la raíz
function mostrarArbol(nodo) {
    if (!nodo) {
        console.log("(árbol vacío)");
        return;
    }

    if (nodo.esTerminal) {
        console.log(`${nodo.nombre} : "${nodo.valor}"`);
    } else {
        console.log(nodo.nombre);
    }

    for (let i = 0; i < nodo.hijos.length; i++) {
        const esUltimo = i === nodo.hijos.length - 1;
        imprimirArbol(nodo.hijos[i], '', esUltimo);
    }
}

module.exports = { ParserLL1, NodoArbol, mostrarArbol };