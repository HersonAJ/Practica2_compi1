const fs = require('fs');
const path = require('path');

class Persistencia {
    constructor() {
        this.rutaArchivo = path.join(__dirname, 'analizadores.json');
    }

    cargar() {
        try {
            if (fs.existsSync(this.rutaArchivo)) {
                const contenido = fs.readFileSync(this.rutaArchivo, 'utf-8');
                return JSON.parse(contenido);
            }
        } catch (e) {
            console.error('Error al cargar analizadores: ', e.message);
        }
        return {};
    }

    guardar(analizadores) {
        try {
            const datos = {};
            for (const [nombre, analizador] of Object.entries(analizadores)) {
                datos[nombre] = {
                    nombre: analizador.nombre,
                    ast: analizador.ast
                };
            }
            fs.writeFileSync(this.rutaArchivo, JSON.stringify(datos, null, 2), 'utf-8');
        } catch (e) {
            console.error('Error al guardar analizadores: ', e.message);
        }
    }
 }

 module.exports = Persistencia;