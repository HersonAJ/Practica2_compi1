//calculador de primeros para la tabla 
//si X es terminal se encuentra su produccion de terminales 

class CalculadorPrimero {
    constructor(producciones, noTerminales) {
        this.producciones = producciones;
        this.noTerminales = noTerminales;
        this.primero = {};
    }
 
    calcular() {
        // Inicializar conjuntos vacios
        for (const nt of this.noTerminales) {
            this.primero[nt] = new Set();
        }
 
        // Iterar hasta punto fijo (sin cambios)
        let cambio = true;
        while (cambio) {
            cambio = false;
 
            for (const [nt, alternativas] of Object.entries(this.producciones)) {
                for (const alternativa of alternativas) {
                    const antes = this.primero[nt].size;
                    this.procesarAlternativa(nt, alternativa);
                    if (this.primero[nt].size > antes) cambio = true;
                }
            }
        }
 
        return this.primero;
    }
 
    procesarAlternativa(nt, alternativa) {
        // Si es epsilon
        if (alternativa.length === 1 && alternativa[0] === 'ε') {
            this.primero[nt].add('ε');
            return;
        }
 
        // Recorrer simbolos
        let todosAnulables = true;
 
        for (const simbolo of alternativa) {
            if (this.esTerminal(simbolo)) {
                this.primero[nt].add(simbolo);
                todosAnulables = false;
                break;
            }
 
            // Es no terminal: agregar su PRIMERO sin ε
            const primeroSimbolo = this.primero[simbolo];
            if (primeroSimbolo) {
                for (const p of primeroSimbolo) {
                    if (p !== 'ε') this.primero[nt].add(p);
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
 
        if (todosAnulables) {
            this.primero[nt].add('ε');
        }
    }
 
    esTerminal(simbolo) {
        return simbolo.startsWith('$_');
    }
 
    // Calcular PRIMERO de una secuencia de simbolos
    // (usado por ConstructorTablaM)
    static primeroDeSecuencia(secuencia, primero) {
        const resultado = new Set();
 
        if (secuencia.length === 1 && secuencia[0] === 'ε') {
            resultado.add('ε');
            return resultado;
        }
 
        let todosAnulables = true;
 
        for (const simbolo of secuencia) {
            if (simbolo.startsWith('$_')) {
                resultado.add(simbolo);
                todosAnulables = false;
                break;
            }
 
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
 
        if (todosAnulables) resultado.add('ε');
        return resultado;
    }
}
 
module.exports = CalculadorPrimero;