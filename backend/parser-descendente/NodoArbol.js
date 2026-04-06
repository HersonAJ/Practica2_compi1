//nodo para el arbol de derivasion, cada nodo puede ser terminal o no terminal 
//si es terminal tiene un valor 

class NodoArbol {
    constructor(nombre, esTerminal) {
        this.nombre = nombre;
        this.esTerminal = esTerminal;
        this.valor = null;
        this.hijos = [];
    }
 
    agregarHijo(hijo) {
        this.hijos.push(hijo);
    }
}
 
module.exports = NodoArbol;