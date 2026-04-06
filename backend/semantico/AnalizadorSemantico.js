const ErrorWison = require('../errores/ErrorWison');
 
class AnalizadorSemantico {
    constructor(ast) {
        this.ast = ast;
        this.errores = [];
        this.noTerminalesVistos = new Set();
        this.terminalesDeclarados = new Set();
    }
 
    analizar() {
        this.errores = [];
        this.noTerminalesVistos = new Set();
        this.terminalesDeclarados = new Set(Object.keys(this.ast.terminales));
 
        this.verificarNoTerminalesDuplicados();
        this.verificarSimboloInicial();
        this.verificarSimboloInicialDeclarado();
        this.verificarNTEnProducciones();
        this.verificarTerminalesEnProducciones();
        this.verificarReferenciasLex();
        this.verificarNTSinProducciones();
 
        return {
            errores: this.errores,
            valido: this.errores.length === 0
        };
    }
 
    verificarNoTerminalesDuplicados() {
        for (const nt of this.ast.noTerminales) {
            if (this.noTerminalesVistos.has(nt)) {
                this.errores.push(new ErrorWison(
                    'semantico',
                    `No terminal "${nt}" declarado más de una vez.`
                ));
            }
            this.noTerminalesVistos.add(nt);
        }
    }
 
    verificarSimboloInicial() {
        if (!this.ast.simboloInicial) {
            this.errores.push(new ErrorWison(
                'semantico',
                'No se definió un símbolo inicial con Initial_Sim.'
            ));
        }
    }
 
    verificarSimboloInicialDeclarado() {
        if (this.ast.simboloInicial && !this.noTerminalesVistos.has(this.ast.simboloInicial)) {
            this.errores.push(new ErrorWison(
                'semantico',
                `El símbolo inicial "${this.ast.simboloInicial}" no fue declarado como No_Terminal.`
            ));
        }
    }
 
    verificarNTEnProducciones() {
        // Lado izquierdo
        for (const nombreNT of Object.keys(this.ast.producciones)) {
            if (!this.noTerminalesVistos.has(nombreNT)) {
                this.errores.push(new ErrorWison(
                    'semantico',
                    `No terminal "${nombreNT}" usado en producción pero no fue declarado con No_Terminal.`
                ));
            }
        }
 
        // Lado derecho (cuerpo)
        for (const [nombreNT, alternativas] of Object.entries(this.ast.producciones)) {
            for (const alternativa of alternativas) {
                for (const simbolo of alternativa) {
                    if (typeof simbolo === 'string' && simbolo.startsWith('%_') && !this.noTerminalesVistos.has(simbolo)) {
                        this.errores.push(new ErrorWison(
                            'semantico',
                            `No terminal "${simbolo}" usado en producción de "${nombreNT}" pero no fue declarado con No_Terminal.`
                        ));
                    }
                }
            }
        }
    }
 
    verificarTerminalesEnProducciones() {
        for (const [nombreNT, alternativas] of Object.entries(this.ast.producciones)) {
            for (const alternativa of alternativas) {
                for (const simbolo of alternativa) {
                    if (typeof simbolo === 'string' && simbolo.startsWith('$_') && !this.terminalesDeclarados.has(simbolo)) {
                        this.errores.push(new ErrorWison(
                            'semantico',
                            `Terminal "${simbolo}" usado en producción de "${nombreNT}" pero no fue declarado en el bloque Lex.`
                        ));
                    }
                }
            }
        }
    }
 
    verificarReferenciasLex() {
        for (const [nombre, expresion] of Object.entries(this.ast.terminales)) {
            this.buscarReferenciasInvalidas(nombre, expresion);
        }
    }
 
    buscarReferenciasInvalidas(nombreTerminal, nodo) {
        if (!nodo || typeof nodo !== 'object') return;
 
        switch (nodo.tipo) {
            case 'referencia':
                if (!this.terminalesDeclarados.has(nodo.valor)) {
                    this.errores.push(new ErrorWison(
                        'semantico',
                        `Terminal "${nombreTerminal}" referencia a "${nodo.valor}" que no fue declarado en el bloque Lex.`
                    ));
                }
                break;
            case 'concatenacion':
                this.buscarReferenciasInvalidas(nombreTerminal, nodo.izq);
                this.buscarReferenciasInvalidas(nombreTerminal, nodo.der);
                break;
            case 'kleene':
            case 'positiva':
            case 'opcional':
            case 'grupo':
                this.buscarReferenciasInvalidas(nombreTerminal, nodo.expresion);
                break;
        }
    }
 
    verificarNTSinProducciones() {
        for (const nt of this.ast.noTerminales) {
            if (!this.ast.producciones[nt] || this.ast.producciones[nt].length === 0) {
                this.errores.push(new ErrorWison(
                    'semantico',
                    `No terminal "${nt}" fue declarado pero no tiene ninguna producción definida.`
                ));
            }
        }
    }
}
 
module.exports = AnalizadorSemantico;