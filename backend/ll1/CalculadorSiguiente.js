//calcular siguientes
const CalculadorPrimero = require('./CalculadorPrimero');
 
class CalculadorSiguiente {
    constructor(producciones, noTerminales, simboloInicial, primero) {
        this.producciones = producciones;
        this.noTerminales = noTerminales;
        this.simboloInicial = simboloInicial;
        this.primero = primero;
        this.siguiente = {};
    }
 
    calcular() {
        // Inicializar conjuntos vacios
        for (const nt of this.noTerminales) {
            this.siguiente[nt] = new Set();
        }
 
        // Regla 1: $ al simbolo inicial
        this.siguiente[this.simboloInicial].add('$');
 
        // Iterar hasta punto fijo
        let cambio = true;
        while (cambio) {
            cambio = false;
 
            for (const [nt, alternativas] of Object.entries(this.producciones)) {
                for (const alternativa of alternativas) {
                    if (alternativa.length === 1 && alternativa[0] === 'ε') continue;
                    
                    const hubo = this.procesarAlternativa(nt, alternativa);
                    if (hubo) cambio = true;
                }
            }
        }
 
        return this.siguiente;
    }
 
    procesarAlternativa(nt, alternativa) {
        let huboCambio = false;
 
        for (let i = 0; i < alternativa.length; i++) {
            const B = alternativa[i];
 
            // Solo no terminales
            if (this.esTerminal(B) || B === 'ε') continue;
            if (!this.siguiente[B]) continue;
 
            const antes = this.siguiente[B].size;
            const beta = alternativa.slice(i + 1);
 
            if (beta.length > 0) {
                // Regla 2: agregar PRIMERO(β) sin ε
                const primeroBeta = CalculadorPrimero.primeroDeSecuencia(beta, this.primero);
 
                for (const p of primeroBeta) {
                    if (p !== 'ε') this.siguiente[B].add(p);
                }
 
                // Regla 3: si β puede ser ε
                if (primeroBeta.has('ε')) {
                    for (const s of this.siguiente[nt]) {
                        this.siguiente[B].add(s);
                    }
                }
            } else {
                // B al final: Regla 3
                for (const s of this.siguiente[nt]) {
                    this.siguiente[B].add(s);
                }
            }
 
            if (this.siguiente[B].size > antes) huboCambio = true;
        }
 
        return huboCambio;
    }
 
    esTerminal(simbolo) {
        return simbolo.startsWith('$_');
    }
}
 
module.exports = CalculadorSiguiente;