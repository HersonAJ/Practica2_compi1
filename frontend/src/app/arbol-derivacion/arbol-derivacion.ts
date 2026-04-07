import { Component, Input, SimpleChanges, OnChanges, ElementRef, ViewChild } from '@angular/core';
import { NodoArbol } from '../models/wison.models';
import {Viz} from '@viz-js/viz';
import { instance } from '@viz-js/viz';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-arbol-derivacion',
  imports: [],
  templateUrl: './arbol-derivacion.html',
  styleUrl: './arbol-derivacion.css',
})
export class ArbolDerivacion {

 @Input() arbol: NodoArbol | null = null;

  svgContent: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['arbol'] && this.arbol) {
      this.generarGrafico();
    }
  }

  async generarGrafico() {
    if (!this.arbol) return;

    const dot = this.arbolADot(this.arbol);

    try {
      const viz = await instance();
      const svgString = viz.renderString(dot, { format: 'svg', engine: 'dot' });
      this.svgContent = this.sanitizer.bypassSecurityTrustHtml(svgString);
    } catch (e) {
      console.error('Error al generar gráfico:', e);
      this.svgContent = this.sanitizer.bypassSecurityTrustHtml('<p>Error al generar el árbol</p>');
    }
  }

  arbolADot(raiz: NodoArbol): string {
    let contador = 0;
    const lineas: string[] = [];

    lineas.push('digraph ArbolDerivacion {');
    lineas.push('  rankdir=TB;');
    lineas.push('  node [fontname="Courier New", fontsize=12];');
    lineas.push('  edge [color="#7f8c8d"];');

    const generarNodos = (nodo: NodoArbol, idPadre: string | null): string => {
      const id = `n${contador++}`;

      if (nodo.valor === 'ε') {
        lineas.push(`  ${id} [label="ε", shape=plaintext, fontcolor="#95a5a6"];`);
      } else if (nodo.esTerminal) {
        const valorEscapado = nodo.valor ? nodo.valor.replace(/"/g, '\\"') : '';
        lineas.push(`  ${id} [label="'${valorEscapado}'", shape=box, style=filled, fillcolor="#d5f5e3", color="#27ae60"];`);
      } else {
        lineas.push(`  ${id} [label="${nodo.nombre}", shape=ellipse, style=filled, fillcolor="#d6eaf8", color="#3498db"];`);
      }

      if (idPadre) {
        lineas.push(`  ${idPadre} -> ${id};`);
      }

      for (const hijo of nodo.hijos) {
        generarNodos(hijo, id);
      }

      return id;
    };

    generarNodos(raiz, null);
    lineas.push('}');

    return lineas.join('\n');
  }
}
