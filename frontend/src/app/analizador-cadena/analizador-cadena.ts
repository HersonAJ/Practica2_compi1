import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WisonService } from '../wison-service';
import { Analizador, RespuestaAnalizar, NodoArbol, Token, ErrorWison } from '../models/wison.models';
import { ArbolDerivacion } from '../arbol-derivacion/arbol-derivacion';

@Component({
  selector: 'app-analizador-cadena',
  imports: [FormsModule, CommonModule, ArbolDerivacion],
  templateUrl: './analizador-cadena.html',
  styleUrl: './analizador-cadena.css',
})
export class AnalizadorCadena {

  @Input() analizador: Analizador | null = null;

  cadena: string = '';
  analizando: boolean = false;
  tokens: Token[] = [];
  arbol: NodoArbol | null = null;
  errores: ErrorWison[] = [];
  aceptada: boolean | null = null;

  constructor(private wisonService: WisonService) {}

  analizar() {
    if (!this.analizador || this.cadena === '') return;

    this.analizando = true;
    this.tokens = [];
    this.arbol = null;
    this.errores = [];
    this.aceptada = null;

    this.wisonService.analizar(this.analizador.nombre, this.cadena).subscribe({
      next: (res) => {
        this.analizando = false;
        this.tokens = res.tokens;
        this.arbol = res.arbol;
        this.errores = res.errores;
        this.aceptada = res.exito;
      },
      error: () => {
        this.analizando = false;
        this.errores = [{tipo: 'general', mensaje: 'Error de conexion con el servidor. '}];
      }
    });
  }

  limpiar() {
    this.cadena = '';
    this.tokens = [];
    this.arbol = null;
    this.errores = [];
    this.aceptada = null;
  }
}
