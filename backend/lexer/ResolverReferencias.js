//cuando un termina hace referencia a otro , remplaza la referancia con la definicion real del terminal
class ResolverReferencias {

    constructor(terminales) {
        this.terminales = terminales;
    }

    resolver() {
        const resuletos = {};

        for (const [nombre, expresion] of Object.entries(this.terminales)) {
            resuletos[nombre] = this.resolverNodo(expresion);
        }

        return resuletos;
    }

    resolverNodo(nodo) {
        if (!nodo || typeof nodo !== 'object') return nodo;

        switch(nodo.tipo) {
            case 'referencia':
                const ref = this.terminales[nodo.valor];
                if (!ref) return nodo;
                return this.resolverNodo(JSON.parse(JSON.stringify(ref)));

            case 'concatenacion':
                return {
                    tipo: 'concatenacion',
                    izq: this.resolverNodo(nodo.izq),
                    der: this.resolverNodo(nodo.der)
                };

            case 'kleene':
            case 'positiva':
            case 'opcional':
                return {
                    tipo: nodo.tipo,
                    expresion: this.resolverNodo(nodo.expresion)
                };

            case 'grupo':
                return this.resolverNodo(nodo.expresion);

            case 'string':
            case 'rango':
                return JSON.parse(JSON.stringify(nodo));

            default:
                return nodo;
        }
    }
}

module.exports = ResolverReferencias;