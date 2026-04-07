import { Component, signal, viewChild, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ListaAnalizadores } from './lista-analizadores/lista-analizadores';
import { AnalizadorCadena } from './analizador-cadena/analizador-cadena';
import { Analizador } from './models/wison.models';
import { EditorWison } from './editor-wison/editor-wison';

@Component({
  selector: 'app-root',
  imports: [ EditorWison, ListaAnalizadores, AnalizadorCadena],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  analizadorActivo: Analizador |  null = null;

  @ViewChild(ListaAnalizadores) listaComp!: ListaAnalizadores;

  onAnalizadorSeleccionado(analizador: Analizador) {
    this.analizadorActivo = analizador;
  }

  onCompilacionExitosa() {
    this.listaComp.cargar();
  }
}
