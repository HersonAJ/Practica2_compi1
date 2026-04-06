//usa la tabla para analizar los tokens y generar el arbol de derivasion 

const NodoArbol = require('./NodoArbol');
const ErrorWison = require('../errores/ErrorWison');
 
class ParserDescendente {
    constructor(tablaM, simboloInicial) {
        this.tablaM = tablaM;
        this.simboloInicial = simboloInicial;
        this.tokens = [];
        this.posicion = 0;
        this.errores = [];
        this.tokenActual = null;
    }
 
    // Metodo principal: recibe tokens, retorna arbol
    analizar(tokens) {
        this.tokens = tokens;
        this.posicion = 0;
        this.errores = [];
 
        // getToken() inicial
        this.avanzar();
 
        // Llamar al simbolo inicial
        const arbol = this.procesarNoTerminal(this.simboloInicial);
 
        // Verificar fin de cadena
        if (this.tokenActual !== null) {
            this.errores.push(new ErrorWison(
                'sintactico',
                `Se esperaba fin de cadena pero se encontró "${this.tokenActual.tipo}" con valor "${this.tokenActual.valor}".`
            ));
        }
 
        return {
            arbol,
            errores: this.errores,
            aceptada: this.errores.length === 0
        };
    }
 
    // getToken(): obtiene el siguiente token
    avanzar() {
        if (this.posicion < this.tokens.length) {
            this.tokenActual = this.tokens[this.posicion];
            this.posicion++;
        } else {
            this.tokenActual = null;
        }
    }
 
    // consumir(): verifica token esperado y avanza
    consumir(tipoEsperado) {
        if (this.tokenActual && this.tokenActual.tipo === tipoEsperado) {
            const nodo = new NodoArbol(tipoEsperado, true);
            nodo.valor = this.tokenActual.valor;
            this.avanzar();
            return nodo;
        }
 
        const encontrado = this.tokenActual
            ? `"${this.tokenActual.tipo}" con valor "${this.tokenActual.valor}"`
            : 'fin de cadena';
        this.errores.push(new ErrorWison(
            'sintactico',
            `Se esperaba "${tipoEsperado}" pero se encontró ${encontrado}.`
        ));
        return null;
    }
 
    procesarNoTerminal(noTerminal) {
        const nodo = new NodoArbol(noTerminal, false);
        const terminalActual = this.tokenActual ? this.tokenActual.tipo : '$';
 
        // Consultar tabla M[noTerminal, terminalActual]
        const fila = this.tablaM[noTerminal];
        if (!fila) {
            this.errores.push(new ErrorWison(
                'sintactico',
                `No terminal "${noTerminal}" no tiene entrada en la tabla M.`
            ));
            return nodo;
        }
 
        const produccion = fila[terminalActual];
        if (!produccion) {
            const esperados = Object.keys(fila).join(', ');
            this.errores.push(new ErrorWison(
                'sintactico',
                `Error en "${noTerminal}": se encontró "${terminalActual}" pero se esperaba uno de: ${esperados}.`
            ));
            return nodo;
        }
 
        // Procesar cada simbolo del cuerpo
        for (const simbolo of produccion) {
            if (simbolo === 'ε') {
                const hojaEpsilon = new NodoArbol('ε', true);
                hojaEpsilon.valor = 'ε';
                nodo.agregarHijo(hojaEpsilon);
                continue;
            }
 
            if (simbolo.startsWith('$_')) {
                // Terminal -> consumir
                const hijo = this.consumir(simbolo);
                if (hijo) {
                    nodo.agregarHijo(hijo);
                } else {
                    return nodo;
                }
            } else if (simbolo.startsWith('%_')) {
                // No terminal -> llamada recursiva
                const hijo = this.procesarNoTerminal(simbolo);
                nodo.agregarHijo(hijo);
                if (this.errores.length > 0) return nodo;
            }
        }
 
        return nodo;
    }
 
    // Imprimir arbol en consola
    static mostrarArbol(nodo, prefijo = '', esUltimo = true, esRaiz = true) {
        if (!nodo) return;
 
        if (esRaiz) {
            console.log(nodo.esTerminal ? `${nodo.nombre} : "${nodo.valor}"` : nodo.nombre);
        } else {
            const conector = esUltimo ? '└── ' : '├── ';
            if (nodo.esTerminal) {
                const texto = nodo.valor === 'ε' ? 'ε' : `${nodo.nombre} : "${nodo.valor}"`;
                console.log(prefijo + conector + texto);
            } else {
                console.log(prefijo + conector + nodo.nombre);
            }
        }
 
        const nuevoPrefijo = esRaiz ? '' : prefijo + (esUltimo ? '    ' : '│   ');
        for (let i = 0; i < nodo.hijos.length; i++) {
            const esUltimoHijo = i === nodo.hijos.length - 1;
            ParserDescendente.mostrarArbol(nodo.hijos[i], nuevoPrefijo, esUltimoHijo, false);
        }
    }
}
 
module.exports = ParserDescendente;