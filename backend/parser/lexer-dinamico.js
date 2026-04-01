/* ==========================================
   LEXER DINÁMICO - MÉTODO DEL ÁRBOL
   Práctica 2 - Compiladores 1

   Convierte las definiciones del bloque Lex
   del AST en AFDs usando el método directo
   (árbol de expresión → AFD).
   ========================================== */

// =============================================
// PASO 1: Resolver referencias entre terminales
// Si $_Decimal usa ($_Punto), reemplazamos esa
// referencia por el árbol real de $_Punto.
// =============================================
function resolverReferencias(terminales) {
    const resueltos = {};

    for (const [nombre, expresion] of Object.entries(terminales)) {
        resueltos[nombre] = resolverNodo(expresion, terminales);
    }

    return resueltos;
}

function resolverNodo(nodo, terminales) {
    if (!nodo || typeof nodo !== 'object') return nodo;

    switch (nodo.tipo) {
        case 'referencia':
            // Reemplazar por el árbol del terminal referenciado
            const ref = terminales[nodo.valor];
            if (!ref) return nodo; // referencia no encontrada (ya validado en semántico)
            return resolverNodo(JSON.parse(JSON.stringify(ref)), terminales);

        case 'concatenacion':
            return {
                tipo: 'concatenacion',
                izq: resolverNodo(nodo.izq, terminales),
                der: resolverNodo(nodo.der, terminales)
            };

        case 'kleene':
        case 'positiva':
        case 'opcional':
            return {
                tipo: nodo.tipo,
                expresion: resolverNodo(nodo.expresion, terminales)
            };

        case 'grupo':
            // Desenvolver el grupo, ya no necesitamos los paréntesis
            return resolverNodo(nodo.expresion, terminales);

        case 'string':
        case 'rango':
            return JSON.parse(JSON.stringify(nodo));

        default:
            return nodo;
    }
}

// =============================================
// PASO 2: Expandir strings multi-carácter
// 'FIN' → concat('F', concat('I', 'N'))
// También desenvuelve grupos
// =============================================
function expandirStrings(nodo) {
    if (!nodo || typeof nodo !== 'object') return nodo;

    switch (nodo.tipo) {
        case 'string':
            if (nodo.valor.length === 1) {
                // Carácter simple: se convierte en nodo char
                return { tipo: 'char', valor: nodo.valor };
            }
            // Multi-carácter: convertir a cadena de concatenaciones
            // 'FIN' → concat('F', concat('I', 'N'))
            const chars = nodo.valor.split('');
            let resultado = { tipo: 'char', valor: chars[0] };
            for (let i = 1; i < chars.length; i++) {
                resultado = {
                    tipo: 'concatenacion',
                    izq: resultado,
                    der: { tipo: 'char', valor: chars[i] }
                };
            }
            return resultado;

        case 'concatenacion':
            return {
                tipo: 'concatenacion',
                izq: expandirStrings(nodo.izq),
                der: expandirStrings(nodo.der)
            };

        case 'kleene':
        case 'positiva':
        case 'opcional':
            return {
                tipo: nodo.tipo,
                expresion: expandirStrings(nodo.expresion)
            };

        case 'grupo':
            // Desenvolver grupo y seguir expandiendo
            return expandirStrings(nodo.expresion);

        case 'rango':
            return nodo; // los rangos quedan tal cual

        default:
            return nodo;
    }
}

// =============================================
// PASO 3: Expandir con símbolo de fin #
// Concatena un nodo especial # al final
// =============================================
function expandirConFin(arbol) {
    return {
        tipo: 'concatenacion',
        izq: arbol,
        der: { tipo: 'fin', valor: '#' }
    };
}

// =============================================
// PASO 4: Numerar hojas
// Asigna un número secuencial a cada hoja
// y guarda la info en el Map de hojas
// =============================================
function numerarHojas(nodo, contador, hojas) {
    if (!nodo || typeof nodo !== 'object') return;

    switch (nodo.tipo) {
        case 'char':
        case 'rango':
        case 'fin':
            // Es una hoja: asignar número
            nodo.numero = contador.valor;
            hojas.set(contador.valor, { tipo: nodo.tipo, valor: nodo.valor });
            contador.valor++;
            break;

        case 'concatenacion':
            numerarHojas(nodo.izq, contador, hojas);
            numerarHojas(nodo.der, contador, hojas);
            break;

        case 'kleene':
        case 'positiva':
        case 'opcional':
            numerarHojas(nodo.expresion, contador, hojas);
            break;

        default:
            break;
    }
}

// =============================================
// PASO 5: anulable, primerapos, ultimapos
// Funciones recursivas según la tabla del curso
// =============================================
function anulable(nodo) {
    switch (nodo.tipo) {
        case 'char':
        case 'rango':
        case 'fin':
            // Una hoja con símbolo nunca es anulable
            return false;

        case 'kleene':
        case 'opcional':
            // a* y a? siempre son anulables
            return true;

        case 'positiva':
            // a+ NO es anulable (requiere al menos una vez)
            return false;

        case 'concatenacion':
            // c1.c2 es anulable solo si ambos lo son
            return anulable(nodo.izq) && anulable(nodo.der);

        default:
            return false;
    }
}

function primerapos(nodo) {
    switch (nodo.tipo) {
        case 'char':
        case 'rango':
        case 'fin':
            // Hoja: primerapos es su propio número
            return new Set([nodo.numero]);

        case 'kleene':
        case 'positiva':
        case 'opcional':
            // Operadores unarios: primerapos de su hijo
            return primerapos(nodo.expresion);

        case 'concatenacion':
            // Si c1 es anulable: primerapos(c1) U primerapos(c2)
            // Si no: solo primerapos(c1)
            if (anulable(nodo.izq)) {
                return union(primerapos(nodo.izq), primerapos(nodo.der));
            }
            return primerapos(nodo.izq);

        default:
            return new Set();
    }
}

function ultimapos(nodo) {
    switch (nodo.tipo) {
        case 'char':
        case 'rango':
        case 'fin':
            // Hoja: ultimapos es su propio número
            return new Set([nodo.numero]);

        case 'kleene':
        case 'positiva':
        case 'opcional':
            // Operadores unarios: ultimapos de su hijo
            return ultimapos(nodo.expresion);

        case 'concatenacion':
            // Si c2 es anulable: ultimapos(c1) U ultimapos(c2)
            // Si no: solo ultimapos(c2)
            if (anulable(nodo.der)) {
                return union(ultimapos(nodo.izq), ultimapos(nodo.der));
            }
            return ultimapos(nodo.der);

        default:
            return new Set();
    }
}

// =============================================
// PASO 6: Calcular siguientepos
// Recorre el árbol buscando nodos concat y
// kleene/positiva para llenar la tabla
// =============================================
function calcularSiguientepos(nodo, siguientepos) {
    if (!nodo || typeof nodo !== 'object') return;

    switch (nodo.tipo) {
        case 'concatenacion':
            // Para concat c1.c2:
            // Todo en primerapos(c2) se agrega a siguientepos
            // de cada elemento en ultimapos(c1)
            const ultC1 = ultimapos(nodo.izq);
            const primC2 = primerapos(nodo.der);
            for (const i of ultC1) {
                if (!siguientepos.has(i)) siguientepos.set(i, new Set());
                for (const j of primC2) {
                    siguientepos.get(i).add(j);
                }
            }
            // Recurrir en hijos
            calcularSiguientepos(nodo.izq, siguientepos);
            calcularSiguientepos(nodo.der, siguientepos);
            break;

        case 'kleene':
        case 'positiva':
            // Para c1* o c1+:
            // Todo en primerapos(c1) se agrega a siguientepos
            // de cada elemento en ultimapos(c1)
            const ult = ultimapos(nodo.expresion);
            const prim = primerapos(nodo.expresion);
            for (const i of ult) {
                if (!siguientepos.has(i)) siguientepos.set(i, new Set());
                for (const j of prim) {
                    siguientepos.get(i).add(j);
                }
            }
            // Recurrir en hijo
            calcularSiguientepos(nodo.expresion, siguientepos);
            break;

        case 'opcional':
            // a? no genera loop, solo recurrir en hijo
            calcularSiguientepos(nodo.expresion, siguientepos);
            break;

        default:
            break;
    }
}

// =============================================
// PASO 7: Construir AFD a partir del árbol
// Usa siguientepos para generar la tabla de
// transiciones del AFD
// =============================================
function construirAFD(arbol, hojas) {
    // Calcular siguientepos
    const siguientepos = new Map();
    calcularSiguientepos(arbol, siguientepos);

    // Estado inicial = primerapos(raíz)
    const estadoInicial = primerapos(arbol);

    // Encontrar el número de la hoja #
    let numFin = null;
    for (const [num, hoja] of hojas) {
        if (hoja.tipo === 'fin') {
            numFin = num;
            break;
        }
    }

    // Obtener todos los símbolos de entrada únicos (sin #)
    // Usamos JSON.stringify para comparar objetos como claves
    const simbolosSet = new Set();
    for (const [num, hoja] of hojas) {
        if (hoja.tipo !== 'fin') {
            simbolosSet.add(JSON.stringify({ tipo: hoja.tipo, valor: hoja.valor }));
        }
    }

    // Algoritmo de construcción del AFD
    // Cada estado del AFD es un Set de posiciones (números de hojas)
    const estadosD = [];       // Array de Sets
    const transiciones = [];   // Array de objetos: { simboloStr: indiceEstado }
    const estadosFinales = new Set();

    // Agregar estado inicial
    estadosD.push(estadoInicial);

    if (estadoInicial.has(numFin)) {
        estadosFinales.add(0);
    }

    // Cola de estados sin marcar
    const sinMarcar = [0];

    while (sinMarcar.length > 0) {
        const indiceT = sinMarcar.pop();
        const T = estadosD[indiceT];

        if (!transiciones[indiceT]) transiciones[indiceT] = {};

        // Por cada símbolo de entrada
        for (const simboloStr of simbolosSet) {
            const simbolo = JSON.parse(simboloStr);

            // N = posiciones en T que correspondan a este símbolo
            // U = unión de siguientepos de cada posición en N
            const U = new Set();
            for (const pos of T) {
                const hoja = hojas.get(pos);
                if (hoja && hoja.tipo === simbolo.tipo && hoja.valor === simbolo.valor) {
                    const sig = siguientepos.get(pos);
                    if (sig) {
                        for (const s of sig) U.add(s);
                    }
                }
            }

            // Si U es vacío, no hay transición con este símbolo
            if (U.size === 0) continue;

            // Buscar si U ya existe en estadosD
            let indiceU = -1;
            for (let i = 0; i < estadosD.length; i++) {
                if (setsIguales(estadosD[i], U)) {
                    indiceU = i;
                    break;
                }
            }

            // Si no existe, agregar como nuevo estado
            if (indiceU === -1) {
                indiceU = estadosD.length;
                estadosD.push(U);
                sinMarcar.push(indiceU);

                // Si U contiene la posición de #, es estado final
                if (U.has(numFin)) {
                    estadosFinales.add(indiceU);
                }
            }

            // Registrar transición
            transiciones[indiceT][simboloStr] = indiceU;
        }
    }

    return {
        estadoInicial: 0,
        estadosFinales,
        transiciones,
        simbolos: [...simbolosSet].map(s => JSON.parse(s))
    };
}

// =============================================
// PASO 8: Construir AFD para cada terminal
// Junta todos los pasos anteriores
// =============================================
function construirTodosAFDs(terminales) {
    const resueltos = resolverReferencias(terminales);
    const afds = {};

    for (const [nombre, expresion] of Object.entries(resueltos)) {
        // Expandir strings ('FIN' → concat de chars)
        let arbol = expandirStrings(expresion);

        // Agregar símbolo de fin #
        arbol = expandirConFin(arbol);

        // Numerar hojas
        const contador = { valor: 1 };
        const hojas = new Map();
        numerarHojas(arbol, contador, hojas);

        // Construir AFD
        const afd = construirAFD(arbol, hojas);
        afd.nombre = nombre;
        afd.hojas = hojas;

        afds[nombre] = afd;
    }

    return afds;
}

// =============================================
// PASO 9: Tokenizar una cadena de entrada
// Recorre el texto usando los AFDs generados
// Aplica longest match (el match más largo gana)
// =============================================
function tokenizar(texto, afds, terminalesOrden) {
    const tokens = [];
    const errores = [];
    let pos = 0;

    while (pos < texto.length) {
        // Saltar separadores (espacios, tabs, saltos de línea)
        if (/\s/.test(texto[pos])) {
            pos++;
            continue;
        }

        let mejorLongitud = 0;
        let mejorNombre = null;
        let mejorMatch = null;

        // Probar cada AFD buscando el match más largo
        for (const nombre of terminalesOrden) {
            const afd = afds[nombre];
            const longitud = simularAFD(afd, texto, pos);

            if (longitud > mejorLongitud) {
                mejorLongitud = longitud;
                mejorNombre = nombre;
                mejorMatch = texto.substring(pos, pos + longitud);
            }
        }

        if (mejorMatch) {
            tokens.push({
                tipo: mejorNombre,
                valor: mejorMatch,
                posicion: pos
            });
            pos += mejorLongitud;
        } else {
            errores.push({
                tipo: 'lexico',
                mensaje: `Carácter no reconocido "${texto[pos]}" en posición ${pos}`
            });
            pos++; // avanzar para no quedarse en loop
        }
    }

    return { tokens, errores };
}

// =============================================
// Simular un AFD sobre un texto desde una posición
// Retorna la longitud del match más largo
// (0 si no matchea nada)
// =============================================
function simularAFD(afd, texto, posInicial) {
    let estadoActual = afd.estadoInicial;
    let mejorLongitud = 0;
    let pos = posInicial;

    // Si el estado inicial ya es final, hay match de longitud 0
    if (afd.estadosFinales.has(estadoActual)) {
        mejorLongitud = 0;
    }

    while (pos < texto.length) {
        const char = texto[pos];
        const trans = afd.transiciones[estadoActual];

        if (!trans) break; // no hay transiciones desde este estado

        // Buscar transición que acepte este carácter
        let siguienteEstado = null;

        for (const [simboloStr, destino] of Object.entries(trans)) {
            const simbolo = JSON.parse(simboloStr);

            if (coincide(simbolo, char)) {
                siguienteEstado = destino;
                break;
            }
        }

        if (siguienteEstado === null) break; // no hay transición válida

        estadoActual = siguienteEstado;
        pos++;

        // Si llegamos a un estado final, guardar como mejor match
        if (afd.estadosFinales.has(estadoActual)) {
            mejorLongitud = pos - posInicial;
        }
    }

    return mejorLongitud;
}

// =============================================
// Verificar si un carácter coincide con un símbolo
// =============================================
function coincide(simbolo, char) {
    switch (simbolo.tipo) {
        case 'char':
            return simbolo.valor === char;

        case 'rango':
            if (simbolo.valor === '0-9') {
                return char >= '0' && char <= '9';
            }
            if (simbolo.valor === 'aA-zZ') {
                return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
            }
            return false;

        default:
            return false;
    }
}

// =============================================
// FUNCIONES AUXILIARES
// =============================================

// Unión de dos Sets
function union(setA, setB) {
    const resultado = new Set(setA);
    for (const elem of setB) resultado.add(elem);
    return resultado;
}

// Comparar si dos Sets son iguales
function setsIguales(setA, setB) {
    if (setA.size !== setB.size) return false;
    for (const elem of setA) {
        if (!setB.has(elem)) return false;
    }
    return true;
}

module.exports = {
    resolverReferencias,
    expandirStrings,
    expandirConFin,
    numerarHojas,
    anulable,
    primerapos,
    ultimapos,
    calcularSiguientepos,
    construirAFD,
    construirTodosAFDs,
    tokenizar
};