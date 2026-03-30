function analizarSemantica(ast) {
    const errores = [];

    //1. verificacion de terminales duplicados
    
    //2. verificar no terminales duplicados 
    const noTerminalesVistos = new Set();
    for (const nt of ast.noTerminales) {
        if (noTerminalesVistos.has(nt)) {
            errores.push({
                tipo: 'semantico' ,
                mensaje: `No terminal "${nt}" declarado más de una vez.`
            });
        }
        noTerminalesVistos.add(nt)
    }

    //3. verificar que exista el simbolo inicial
    if (!ast.simboloInicial) {
        errores.push({
            tipo: 'semantico',
            mensaje: 'No se definio un simbolo inicial con Initial_Sim.'
        });
    }

    //.4 verificar que el simbolo inicial este declarado como no terminal
    if (ast.simboloInicial && !noTerminalesVistos.has(ast.simboloInicial)) {
        errores.push({
            tipo: 'semantico',
            mensaje: `El símbolo inicial "${ast.simboloInicial}" no fue declarado como No_Terminal.`
        });
    }

    //5. verificar que los noTerminales usados en producciones esten declarados como no terminales
    for (const nombreNT of Object.keys(ast.producciones)) {
        if (!noTerminalesVistos.has(nombreNT)) {
            errores.push({
                tipo: 'semantico',
                mensaje: `No terminal "${nombreNT}" usado en producción pero no fue declarado con No_Terminal.`
            });
        }
    }

    for (const [nombreNT, alternativas] of Object.entries(ast.producciones)) {
        for (const alternativa of alternativas) {
            for (const simbolo of alternativa) {
                //los no terminales siempre tienen que empezar con %_
                if (typeof simbolo === 'string' && simbolo.startsWith('%_') && !noTerminalesVistos.has(simbolo)) {
                    errores.push({
                        tipo: 'semantico',
                        mensaje: `No terminal "${simbolo}" usado en producción de "${nombreNT}" pero no fue declarado con No_Terminal.`
                    });
                }
            }
        }
    }

    //6. verificar que los terminales usados en producciones existan en el bloque lex
    const terminalesDeclarados = new Set(Object.keys(ast.terminales));

    for (const [nombreNT, alternativas] of Object.entries(ast.producciones)) {
        for (const alternativa of alternativas) {
            for (const simbolo of alternativa) {
                //los terminales empiezan con $_
                if (typeof simbolo === 'string' && simbolo.startsWith('$_') && !terminalesDeclarados.has(simbolo)) {
                    errores.push({
                        tipo: 'semantico',
                        mensaje: `Terminal "${simbolo}" usado en producción de "${nombreNT}" pero no fue declarado en el bloque Lex.`
                    });
                }
            }
        }
    }

    //7. verificar referencias en expresiones lex -> cuando un terminal referencia a otro con $_
    for (const [nombre, expresion] of Object.entries(ast.terminales)) {
        const referenciasNoDeclaradas = verificarReferenciasLex(expresion, terminalesDeclarados);
        for (const ref of referenciasNoDeclaradas) {
            errores.push({
                tipo: 'semantico',
                mensaje: `Terminal "${nombre}" referencia a "${ref}" que no fue declarado en el bloque Lex.`
            });
        }
    }

    //8. verificar que todos los No terminales declarados tengan al menos una produccion
    for (const nt of ast.noTerminales) {
        if (!ast.producciones[nt] || ast.producciones[nt].length === 0) {
            errores.push({
                tipo: 'semantico',
                mensaje: `No terminal "${nt}" fue declarado pero no tiene ninguna producción definida.`
            });
        }
    }

    return {
        errores,
        valido: errores.length === 0
    };
}

    //funcion auxiliar para recorrido del arbol
        function verificarReferenciasLex(nodo, terminalesDeclarados) {
            const noDeclaradas = [];
        
            if (!nodo || typeof nodo !== 'object') {
                return noDeclaradas;
            }
        
            switch (nodo.tipo) {
                case 'referencia':
                    // El nodo referencia a otro terminal por nombre
                    if (!terminalesDeclarados.has(nodo.valor)) {
                        noDeclaradas.push(nodo.valor);
                    }
                    break;
        
                case 'concatenacion':
                    // Tiene hijo izquierdo y derecho
                    noDeclaradas.push(...verificarReferenciasLex(nodo.izq, terminalesDeclarados));
                    noDeclaradas.push(...verificarReferenciasLex(nodo.der, terminalesDeclarados));
                    break;
        
                case 'kleene':
                case 'positiva':
                case 'opcional':
                    // Tiene una sub-expresión
                    noDeclaradas.push(...verificarReferenciasLex(nodo.expresion, terminalesDeclarados));
                    break;
        
                case 'grupo':
                    // Tiene una sub-expresión dentro de paréntesis
                    noDeclaradas.push(...verificarReferenciasLex(nodo.expresion, terminalesDeclarados));
                    break;
        
                case 'string':
                case 'rango':
                    // Son hojas, no tienen referencias
                    break;
        
                default:
                    break;
            }
        
            return noDeclaradas;
        }
    

module.exports = { analizarSemantica };