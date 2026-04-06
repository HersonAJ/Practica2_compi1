//convierte el arbol de expresion de un terminal a una espresion regular de js 

const ResolverReferencias = require('./ResolverReferencias');

class ConstructorRegex {
    constructor(terminales) {
        this.terminales = terminales;
    }

    construirTodas() {
        const resolver = new ResolverReferencias(this.terminales);
        const resueltos = resolver.resolver();
        const regexps = {};

        for (const [nombre, expresion] of Object.entries(resueltos)) {
            const patron = this.arbolARegex(expresion);
            regexps[nombre] = new RegExp('^(?:' + patron + ')');
        }
        return regexps;
    }

    arbolARegex(nodo) {
        if (!nodo || typeof nodo !== 'object') return '';

        switch(nodo.tipo) {
            case 'string':
                return this.escaparRegex(nodo.valor);

                        case 'rango':
                if (nodo.valor === '0-9') return '[0-9]';
                if (nodo.valor === 'aA-zZ') return '[a-zA-Z]';
                return '';
 
            case 'concatenacion':
                return this.arbolARegex(nodo.izq) + this.arbolARegex(nodo.der);
 
            case 'kleene':
                return '(?:' + this.arbolARegex(nodo.expresion) + ')*';
 
            case 'positiva':
                return '(?:' + this.arbolARegex(nodo.expresion) + ')+';
 
            case 'opcional':
                return '(?:' + this.arbolARegex(nodo.expresion) + ')?';
 
            case 'grupo':
                return '(?:' + this.arbolARegex(nodo.expresion) + ')';
 
            case 'referencia':
                return '';
 
            default:
                return '';
        }
    }

    escaparRegex(texto) {
        return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

module.exports = ConstructorRegex;