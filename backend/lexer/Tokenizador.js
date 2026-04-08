const ConstructorRegex = require('./ConstructorRegex');
const ErrorWison = require('../errores/ErrorWison');

class Tokenizador {
    constructor(terminales) {
        const constructor = new ConstructorRegex(terminales);
        this.regexps = constructor.construirTodas();
        this.ordenTerminales = Object.keys(terminales);

        // Calcular prioridad de cada terminal
        // 3 = literal (string puro, ej: 'int', '+')
        // 2 = patrón compuesto (concatenación, operadores, ej: [aA-zZ][aA-zZ]*)
        // 1 = patrón simple (rango solo, ej: [aA-zZ], [0-9])
        this.prioridades = {};
        for (const [nombre, expresion] of Object.entries(terminales)) {
            this.prioridades[nombre] = this.calcularPrioridad(expresion);
        }
    }

calcularPrioridad(nodo) {
        if (!nodo || typeof nodo !== 'object') return 1;

        switch (nodo.tipo) {
            case 'string':
                return 3;
            case 'concatenacion':
                return 2;
            case 'kleene':
            case 'positiva':
            case 'opcional':
                // Heredar prioridad del hijo (no sube por tener operador)
                return this.calcularPrioridad(nodo.expresion);
            case 'grupo':
                return this.calcularPrioridad(nodo.expresion);
            case 'rango':
                return 1;
            case 'referencia':
                return 2;
            default:
                return 1;
        }
    }

    tokenizar(texto) {
        const tokens = [];
        const errores = [];
        let pos = 0;

        while (pos < texto.length) {
            if (/\s/.test(texto[pos])) {
                pos++;
                continue;
            }

            const restante = texto.substring(pos);
            let mejorLongitud = 0;
            let mejorNombre = null;
            let mejorPrioridad = 0;

            for (const nombre of this.ordenTerminales) {
                const regex = this.regexps[nombre];
                const match = restante.match(regex);

                if (match && match[0].length > 0) {
                    const longitud = match[0].length;
                    const prioridad = this.prioridades[nombre];

                    // Gana si:
                    // 1. Es más largo
                    // 2. Misma longitud pero mayor prioridad (literal > compuesto > simple)
                    if (longitud > mejorLongitud || (longitud === mejorLongitud && prioridad > mejorPrioridad)) {
                        mejorLongitud = longitud;
                        mejorNombre = nombre;
                        mejorPrioridad = prioridad;
                    }
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
                errores.push(new ErrorWison(
                    'lexico',
                    `Carácter no reconocido "${texto[pos]}" en posición ${pos}`
                ));
                pos++;
            }
        }

        return { tokens, errores };
    }
}

module.exports = Tokenizador;