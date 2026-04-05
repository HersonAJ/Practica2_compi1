/* ==========================================
   LEXER DINÁMICO (versión simplificada)
   Práctica 2 - Compiladores 1

   Convierte las definiciones del bloque Lex
   del AST a expresiones regulares de JS
   y las usa para tokenizar cadenas de entrada.
   ========================================== */

// =============================================
// Paso 1: Resolver referencias entre terminales
// Si $_Decimal usa ($_Punto), reemplazar por
// la definición real de $_Punto
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
            const ref = terminales[nodo.valor];
            if (!ref) return nodo;
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
            return resolverNodo(nodo.expresion, terminales);

        case 'string':
        case 'rango':
            return JSON.parse(JSON.stringify(nodo));

        default:
            return nodo;
    }
}

// =============================================
// Paso 2: Convertir árbol de expresión a string
// de expresión regular de JavaScript
// =============================================
function arbolARegex(nodo) {
    if (!nodo || typeof nodo !== 'object') return '';

    switch (nodo.tipo) {
        case 'string':
            // Escapar caracteres especiales de regex
            return escaparRegex(nodo.valor);

        case 'rango':
            if (nodo.valor === '0-9') return '[0-9]';
            if (nodo.valor === 'aA-zZ') return '[a-zA-Z]';
            return '';

        case 'concatenacion':
            return arbolARegex(nodo.izq) + arbolARegex(nodo.der);

        case 'kleene':
            return '(?:' + arbolARegex(nodo.expresion) + ')*';

        case 'positiva':
            return '(?:' + arbolARegex(nodo.expresion) + ')+';

        case 'opcional':
            return '(?:' + arbolARegex(nodo.expresion) + ')?';

        case 'grupo':
            return '(?:' + arbolARegex(nodo.expresion) + ')';

        case 'referencia':
            // Si llegó acá es que no se resolvió (error semántico)
            return '';

        default:
            return '';
    }
}

// Escapar caracteres especiales para regex de JS
function escaparRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =============================================
// Paso 3: Construir todas las RegExp
// Una por cada terminal definido en el bloque Lex
// =============================================
function construirRegexTerminales(terminales) {
    const resueltos = resolverReferencias(terminales);
    const regexps = {};

    for (const [nombre, expresion] of Object.entries(resueltos)) {
        const patron = arbolARegex(expresion);
        // ^ ancla al inicio de la posición actual
        regexps[nombre] = new RegExp('^(?:' + patron + ')');
    }

    return regexps;
}

// =============================================
// Paso 4: Tokenizar una cadena de entrada
// Usa longest match: prueba todas las regex
// y elige el match más largo
// =============================================
function tokenizar(texto, terminales) {
    const regexps = construirRegexTerminales(terminales);
    const ordenTerminales = Object.keys(terminales);
    const tokens = [];
    const errores = [];
    let pos = 0;

    while (pos < texto.length) {
        // Saltar espacios, tabs, saltos de línea
        if (/\s/.test(texto[pos])) {
            pos++;
            continue;
        }

        const restante = texto.substring(pos);
        let mejorLongitud = 0;
        let mejorNombre = null;

        // Probar cada regex buscando el match más largo
        for (const nombre of ordenTerminales) {
            const regex = regexps[nombre];
            const match = restante.match(regex);

            if (match && match[0].length > mejorLongitud) {
                mejorLongitud = match[0].length;
                mejorNombre = nombre;
            }
        }

        if (mejorNombre) {
            tokens.push({
                tipo: mejorNombre,
                valor: texto.substring(pos, pos + mejorLongitud),
                posicion: pos
            });
            pos += mejorLongitud;
        } else {
            errores.push({
                tipo: 'lexico',
                mensaje: `Carácter no reconocido "${texto[pos]}" en posición ${pos}`
            });
            pos++;
        }
    }

    return { tokens, errores };
}

module.exports = { tokenizar, construirRegexTerminales };