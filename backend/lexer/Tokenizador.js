//recibe una cadena de texto y la convierte en una lista de tokens usando las regex generadas por ConstructorRegex aplica el longest match

const ConstructorRegex = require('./ConstructorRegex');
const ErrorWison = require('../errores/ErrorWison');
 
class Tokenizador {
    constructor(terminales) {
        const constructor = new ConstructorRegex(terminales);
        this.regexps = constructor.construirTodas();
        this.ordenTerminales = Object.keys(terminales);
    }
 
    tokenizar(texto) {
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
 
            // Probar cada regex buscando el match mas largo
            for (const nombre of this.ordenTerminales) {
                const regex = this.regexps[nombre];
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