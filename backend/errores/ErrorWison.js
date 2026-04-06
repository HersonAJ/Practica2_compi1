class ErrorWison {
    
    constructor(tipo, mensaje, linea = null) {
        this.tipo = tipo;
        this.mensaje = mensaje;
        this.linea = linea;
    }

    toString() {
        const ubicacion = this.linea ? ` (linea ${this.linea})` : '';
        return `[${this.tipo}]${ubicacion} ${this.mensaje}`;
    }
}

module.exports = ErrorWison;