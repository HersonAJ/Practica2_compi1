import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WisonService } from '../wison-service';
import { RespuestaCompilar, ErrorWison } from '../models/wison.models';
import { flush } from '@angular/core/testing';

@Component({
  selector: 'app-editor-wison',
  imports: [FormsModule],
  templateUrl: './editor-wison.html',
  styleUrl: './editor-wison.css',
})
export class EditorWison {

  @Output() compilacionExitosa = new EventEmitter<void>();
  
  codigo: string = '';
  nombreAnalizador: string = '';
  resultado: RespuestaCompilar | null = null;
  errores: ErrorWison[] = [];
  compilando: boolean = false;

  constructor(private wisonService: WisonService) {}

  compilar() {
    if (!this.codigo.trim()) return ;

    const nombre = this.nombreAnalizador.trim() || 'analizador_ ' + Date.now();
    this.compilando = true;
    this.errores = [];
    this.resultado = null;

    this.wisonService.compilar(this.codigo, nombre).subscribe({
      next: (res) => {
        this. compilando = false;
        this.resultado = res;

        if (res.exito) {
          this.compilacionExitosa.emit();
        }

        if (!res.exito) {
          this.errores = res.errores || res.colisiones || [];
        }
      }, 
      error: (err) => {
        this.compilando = false;
        this.errores = [{ tipo: 'general', mensaje: 'Error de conexion con el servidor. '}];
      }
    });
  }

  cargarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const archivo = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      this.codigo = reader.result as string;
    };

    reader.readAsText(archivo);
  }

  limpiar() {
    this.codigo = '';
    this.nombreAnalizador = '';
    this.resultado = null;
    this.errores = [];
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getCeldaTabla(nt: string, terminal: string): string {
    if (this.resultado?.tabla[nt]?.[terminal]) {
      return nt + ' → ' + this.resultado.tabla[nt][terminal].join(' ');
    }
    return '';
  }
}
