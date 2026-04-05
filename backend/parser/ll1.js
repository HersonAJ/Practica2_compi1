/* ==========================================
   MOTOR LL(1)
   Práctica 2 - Compiladores 1

   Recibe las producciones del AST y calcula:
   - PRIMERO (First)
   - SIGUIENTE (Follow)
   - Tabla M (tabla de análisis sintáctico)
   - Detecta colisiones
   ========================================== */

// =============================================
// PRIMERO (FIRST)
//
// Reglas (de la presentación del curso):
// 1. Si X es terminal → PRIMERO(X) = {X}
// 2. Si X → Y1 Y2 ... Yk:
//    - Agregar PRIMERO(Y1) sin ε
//    - Si Y1 puede ser ε, agregar PRIMERO(Y2) sin ε
//    - Si todos pueden ser ε, agregar ε
// 3. Si X → ε → agregar ε a PRIMERO(X)
// =============================================
function calcularPrimero(producciones, noTerminales, terminales) {
    const primero = {};

    // Inicializar conjuntos vacíos para cada no terminal
    for (const nt of noTerminales) {
        primero[nt] = new Set();
    }

    // Iterar hasta que no haya cambios (punto fijo)
    let cambio = true;
    while (cambio) {
        cambio = false;

        for (const [nt, alternativas] of Object.entries(producciones)) {
            for (const alternativa of alternativas) {
                const antes = primero[nt].size;

                // Si la alternativa es épsilon
                if (alternativa.length === 1 && alternativa[0] === 'ε') {
                    primero[nt].add('ε');
                } else {
                    // Recorrer símbolos de la alternativa
                    let todosAnulables = true;

                    for (let i = 0; i < alternativa.length; i++) {
                        const simbolo = alternativa[i];

                        if (esTerminal(simbolo, terminales)) {
                            // Regla 1: si es terminal, agregar y parar
                            primero[nt].add(simbolo);
                            todosAnulables = false;
                            break;
                        } else {
                            // Es no terminal: agregar su PRIMERO sin ε
                            const primeroSimbolo = primero[simbolo];
                            if (primeroSimbolo) {
                                for (const p of primeroSimbolo) {
                                    if (p !== 'ε') primero[nt].add(p);
                                }

                                // Si este no terminal NO puede ser ε, parar
                                if (!primeroSimbolo.has('ε')) {
                                    todosAnulables = false;
                                    break;
                                }
                            } else {
                                todosAnulables = false;
                                break;
                            }
                        }
                    }

                    // Si todos los símbolos pueden ser ε, agregar ε
                    if (todosAnulables) {
                        primero[nt].add('ε');
                    }
                }

                if (primero[nt].size > antes) cambio = true;
            }
        }
    }

    return primero;
}

// =============================================
// Calcular PRIMERO de una secuencia de símbolos
// (se usa para calcular PRIMERO del cuerpo de
// una producción al construir la tabla M)
// =============================================
function primeroDeSecuencia(secuencia, primero, terminales) {
    const resultado = new Set();

    if (secuencia.length === 1 && secuencia[0] === 'ε') {
        resultado.add('ε');
        return resultado;
    }

    let todosAnulables = true;

    for (let i = 0; i < secuencia.length; i++) {
        const simbolo = secuencia[i];

        if (esTerminal(simbolo, terminales)) {
            resultado.add(simbolo);
            todosAnulables = false;
            break;
        } else {
            const primeroSimbolo = primero[simbolo];
            if (primeroSimbolo) {
                for (const p of primeroSimbolo) {
                    if (p !== 'ε') resultado.add(p);
                }
                if (!primeroSimbolo.has('ε')) {
                    todosAnulables = false;
                    break;
                }
            } else {
                todosAnulables = false;
                break;
            }
        }
    }

    if (todosAnulables) {
        resultado.add('ε');
    }

    return resultado;
}

// =============================================
// SIGUIENTE (FOLLOW)
//
// Reglas (de la presentación del curso):
// 1. Agregar $ a SIGUIENTE(S0) (símbolo inicial)
// 2. Si A → αBβ, agregar PRIMERO(β) sin ε
//    a SIGUIENTE(B)
// 3. Si A → αB, o A → αBβ donde β puede ser ε,
//    agregar SIGUIENTE(A) a SIGUIENTE(B)
// =============================================
function calcularSiguiente(producciones, noTerminales, terminales, simboloInicial, primero) {
    const siguiente = {};

    // Inicializar conjuntos vacíos
    for (const nt of noTerminales) {
        siguiente[nt] = new Set();
    }

    // Regla 1: agregar $ al símbolo inicial
    siguiente[simboloInicial].add('$');

    // Iterar hasta punto fijo
    let cambio = true;
    while (cambio) {
        cambio = false;

        for (const [nt, alternativas] of Object.entries(producciones)) {
            for (const alternativa of alternativas) {
                if (alternativa.length === 1 && alternativa[0] === 'ε') continue;

                for (let i = 0; i < alternativa.length; i++) {
                    const B = alternativa[i];

                    // Solo nos interesan los no terminales
                    if (esTerminal(B, terminales) || B === 'ε') continue;
                    if (!siguiente[B]) continue;

                    const antes = siguiente[B].size;

                    // β es todo lo que sigue después de B
                    const beta = alternativa.slice(i + 1);

                    if (beta.length > 0) {
                        // Regla 2: agregar PRIMERO(β) sin ε a SIGUIENTE(B)
                        const primeroBeta = primeroDeSecuencia(beta, primero, terminales);

                        for (const p of primeroBeta) {
                            if (p !== 'ε') siguiente[B].add(p);
                        }

                        // Regla 3: si β puede ser ε, agregar SIGUIENTE(A) a SIGUIENTE(B)
                        if (primeroBeta.has('ε')) {
                            for (const s of siguiente[nt]) {
                                siguiente[B].add(s);
                            }
                        }
                    } else {
                        // B está al final: Regla 3
                        // Agregar SIGUIENTE(A) a SIGUIENTE(B)
                        for (const s of siguiente[nt]) {
                            siguiente[B].add(s);
                        }
                    }

                    if (siguiente[B].size > antes) cambio = true;
                }
            }
        }
    }

    return siguiente;
}

// =============================================
// TABLA M (Tabla de Análisis Sintáctico)
//
// Reglas (de la presentación del curso):
// Para cada producción A → α:
// 1. Para cada terminal 'a' en PRIMERO(α),
//    agregar A → α en M[A, 'a']
// 2. Si ε está en PRIMERO(α), agregar A → α
//    en M[A, b] para cada b en SIGUIENTE(A)
// =============================================
function construirTablaM(producciones, noTerminales, terminales, primero, siguiente) {
    const tabla = {};
    const colisiones = [];

    // Obtener lista de todos los terminales + $
    const todosTerminales = Object.keys(terminales);
    todosTerminales.push('$');

    // Inicializar tabla vacía
    for (const nt of noTerminales) {
        tabla[nt] = {};
    }

    // Llenar la tabla
    for (const [nt, alternativas] of Object.entries(producciones)) {
        for (const alternativa of alternativas) {
            // Calcular PRIMERO de esta alternativa
            const primeroAlfa = primeroDeSecuencia(alternativa, primero, terminales);

            // Regla 1: para cada terminal en PRIMERO(α)
            for (const terminal of primeroAlfa) {
                if (terminal !== 'ε') {
                    agregarATabla(tabla, colisiones, nt, terminal, alternativa);
                }
            }

            // Regla 2: si ε está en PRIMERO(α)
            if (primeroAlfa.has('ε')) {
                for (const terminal of siguiente[nt]) {
                    agregarATabla(tabla, colisiones, nt, terminal, alternativa);
                }
            }
        }
    }

    return { tabla, colisiones };
}

// =============================================
// Agregar producción a la tabla M
// Si ya hay una producción en esa celda,
// es una colisión → gramática no es LL(1)
// =============================================
function agregarATabla(tabla, colisiones, nt, terminal, alternativa) {
    const produccionStr = alternativa.join(' ');

    if (tabla[nt][terminal]) {
        // Ya hay algo en esta celda → colisión
        const existente = tabla[nt][terminal].join(' ');
        if (existente !== produccionStr) {
            colisiones.push({
                tipo: 'semantico',
                mensaje: `Colisión en tabla M[${nt}, ${terminal}]: "${nt} → ${existente}" y "${nt} → ${produccionStr}". La gramática no es LL(1).`
            });
        }
    } else {
        tabla[nt][terminal] = alternativa;
    }
}

// =============================================
// FUNCIÓN PRINCIPAL
// Recibe el AST y ejecuta todo el proceso LL(1)
// =============================================
function construirLL1(ast) {
    const noTerminales = [...new Set(ast.noTerminales)]; // sin duplicados
    const terminales = ast.terminales;
    const producciones = ast.producciones;
    const simboloInicial = ast.simboloInicial;

    // Paso 1: Calcular PRIMERO
    const primero = calcularPrimero(producciones, noTerminales, terminales);

    // Paso 2: Calcular SIGUIENTE
    const siguiente = calcularSiguiente(producciones, noTerminales, terminales, simboloInicial, primero);

    // Paso 3: Construir tabla M y detectar colisiones
    const { tabla, colisiones } = construirTablaM(producciones, noTerminales, terminales, primero, siguiente);

    return {
        primero,
        siguiente,
        tabla,
        colisiones,
        esLL1: colisiones.length === 0
    };
}

// =============================================
// UTILIDADES
// =============================================

// Un símbolo es terminal si empieza con $_
function esTerminal(simbolo, terminales) {
    return simbolo.startsWith('$_');
}

// Para imprimir la tabla bonita en consola
function imprimirTabla(resultado, terminales) {
    console.log("\n--- PRIMERO ---");
    for (const [nt, conj] of Object.entries(resultado.primero)) {
        console.log(`  PRIMERO(${nt}) = { ${[...conj].join(', ')} }`);
    }

    console.log("\n--- SIGUIENTE ---");
    for (const [nt, conj] of Object.entries(resultado.siguiente)) {
        console.log(`  SIGUIENTE(${nt}) = { ${[...conj].join(', ')} }`);
    }

    console.log("\n--- TABLA M ---");
    const todosTerminales = [...Object.keys(terminales), '$'];

    // Encabezado
    let header = ''.padEnd(15);
    for (const t of todosTerminales) header += t.padEnd(25);
    console.log(header);

    // Filas
    for (const [nt, fila] of Object.entries(resultado.tabla)) {
        let linea = nt.padEnd(15);
        for (const t of todosTerminales) {
            if (fila[t]) {
                linea += (nt + ' → ' + fila[t].join(' ')).padEnd(25);
            } else {
                linea += ''.padEnd(25);
            }
        }
        console.log(linea);
    }

    if (resultado.colisiones.length > 0) {
        console.log("\n--- COLISIONES ---");
        for (const c of resultado.colisiones) {
            console.log(`  ${c.mensaje}`);
        }
    } else {
        console.log("\nLa gramática ES LL(1) ✓");
    }
}

module.exports = { construirLL1, imprimirTabla };