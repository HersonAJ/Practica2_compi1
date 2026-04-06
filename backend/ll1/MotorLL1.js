//genera la tabla usando los primeros y siguientes de cada produccion y detecta colisiones 

const CalculadorPrimero = require('./CalculadorPrimero');
const CalculadorSiguiente = require('./CalculadorSiguiente');
const ConstructorTablaM = require('./ConstructorTablaM');
 
class MotorLL1 {
    constructor(ast) {
        this.noTerminales = [...new Set(ast.noTerminales)];
        this.terminales = ast.terminales;
        this.producciones = ast.producciones;
        this.simboloInicial = ast.simboloInicial;
 
        this.primero = {};
        this.siguiente = {};
        this.tabla = {};
        this.colisiones = [];
        this.esLL1 = false;
    }
 
    construir() {
        // Paso 1: PRIMERO
        const calcPrimero = new CalculadorPrimero(this.producciones, this.noTerminales);
        this.primero = calcPrimero.calcular();
 
        // Paso 2: SIGUIENTE
        const calcSiguiente = new CalculadorSiguiente(
            this.producciones, this.noTerminales, this.simboloInicial, this.primero
        );
        this.siguiente = calcSiguiente.calcular();
 
        // Paso 3: TABLA M
        const constructorTabla = new ConstructorTablaM(
            this.producciones, this.noTerminales, this.terminales, this.primero, this.siguiente
        );
        const resultado = constructorTabla.construir();
        this.tabla = resultado.tabla;
        this.colisiones = resultado.colisiones;
        this.esLL1 = this.colisiones.length === 0;
 
        return this;
    }
 
    imprimirResultados() {
        console.log("\n--- PRIMERO ---");
        for (const [nt, conj] of Object.entries(this.primero)) {
            console.log(`  PRIMERO(${nt}) = { ${[...conj].join(', ')} }`);
        }
 
        console.log("\n--- SIGUIENTE ---");
        for (const [nt, conj] of Object.entries(this.siguiente)) {
            console.log(`  SIGUIENTE(${nt}) = { ${[...conj].join(', ')} }`);
        }
 
        console.log("\n--- TABLA M ---");
        const todosTerminales = [...Object.keys(this.terminales), '$'];
 
        let header = ''.padEnd(15);
        for (const t of todosTerminales) header += t.padEnd(25);
        console.log(header);
 
        for (const [nt, fila] of Object.entries(this.tabla)) {
            let linea = nt.padEnd(15);
            for (const t of todosTerminales) {
                if (fila[t]) {
                    linea += (nt + ' → ' + fila[t].join(' ')).padEnd(25);
                } else {
                    linea += ''.padEnd(25);
                }
            }
            console.log(linea);
        }
 
        if (this.colisiones.length > 0) {
            console.log("\n--- COLISIONES ---");
            for (const c of this.colisiones) {
                console.log(`  ${c.toString()}`);
            }
        } else {
            console.log("\nLa gramática ES LL(1) ✓");
        }
    }
}
 
module.exports = MotorLL1;