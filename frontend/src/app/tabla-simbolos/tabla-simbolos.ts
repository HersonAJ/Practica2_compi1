import { Component, Input } from '@angular/core';
import { RespuestaCompilar } from '../models/wison.models';
import { SignalNode } from '@angular/core/primitives/signals';

interface SimboloFila {
  nombre: string;
  tipo: string;
  categoria: string;
  definicion: string;
}

@Component({
  selector: 'app-tabla-simbolos',
  imports: [],
  templateUrl: './tabla-simbolos.html',
  styleUrl: './tabla-simbolos.css',
})
export class TablaSimbolos {

  @Input() resultado: RespuestaCompilar | null = null;

  get simbolos(): SimboloFila[] {
    if (!this.resultado) return [];
    const filas: SimboloFila[] = [];

    // Terminales
    for (const t of this.resultado.ast.terminales) {
      filas.push({
        nombre: t,
        tipo: 'Terminal',
        categoria: 'Léxico',
        definicion: 'Definido en bloque Lex'
      });
    }

    // No terminales
    for (const nt of this.resultado.ast.noTerminales) {
      const esInicial = nt === this.resultado.ast.simboloInicial;
      const prods = this.resultado.ast.producciones[nt];
      let def = '';
      if (prods) {
        def = prods.map((alt: string[]) => alt.join(' ')).join(' | ');
      }
      filas.push({
        nombre: nt,
        tipo: esInicial ? 'No Terminal (Inicial)' : 'No Terminal',
        categoria: 'Sintáctico',
        definicion: nt + ' → ' + def
      });
    }

    return filas;
  }

}
