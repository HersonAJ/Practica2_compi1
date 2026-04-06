// para cada terminal en PRIMERO agregar por transicion, la produccion al simbolo 
const CalculadorPrimero = require('../CalculadorPrimero');
const ErrorWison = require('../errores/ErrorWison');
 
class ConstructorTablaM {
    constructor(producciones, noTerminales, terminales, primero, siguiente) {
        this.producciones = producciones;
        this.noTerminales = noTerminales;
        this.terminales = terminales;
        this.primero = primero;
        this.siguiente = siguiente;
        this.tabla = {};
        this.colisiones = [];
    }
 
    construir() {
        // Inicializar tabla vacia
        for (const nt of this.noTerminales) {
            this.tabla[nt] = {};
        }
 
        // Llenar la tabla
        for (const [nt, alternativas] of Object.entries(this.producciones)) {
            for (const alternativa of alternativas) {
                const primeroAlfa = CalculadorPrimero.primeroDeSecuencia(alternativa, this.primero);
 
                // Regla 1: para cada terminal en PRIMERO(α)
                for (const terminal of primeroAlfa) {
                    if (terminal !== 'ε') {
                        this.agregarCelda(nt, terminal, alternativa);
                    }
                }
 
                // Regla 2: si ε esta en PRIMERO(α)
                if (primeroAlfa.has('ε')) {
                    for (const terminal of this.siguiente[nt]) {
                        this.agregarCelda(nt, terminal, alternativa);
                    }
                }
            }
        }
 
        return {
            tabla: this.tabla,
            colisiones: this.colisiones
        };
    }
 
    agregarCelda(nt, terminal, alternativa) {
        const produccionStr = alternativa.join(' ');
 
        if (this.tabla[nt][terminal]) {
            const existente = this.tabla[nt][terminal].join(' ');
            if (existente !== produccionStr) {
                this.colisiones.push(new ErrorWison(
                    'semantico',
                    `Colision en tabla M[${nt}, ${terminal}]: "${nt} → ${existente}" y "${nt} → ${produccionStr}". La gramatica no es LL(1).`
                ));
            }
        } else {
            this.tabla[nt][terminal] = alternativa;
        }
    }
}
 
module.exports = ConstructorTablaM;