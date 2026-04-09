import { Component, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WisonService } from '../wison-service';
import { RespuestaCompilar, ErrorWison } from '../models/wison.models';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-editor-wison',
  imports: [FormsModule, Modal],
  templateUrl: './editor-wison.html',
  styleUrl: './editor-wison.css',
})
export class EditorWison implements AfterViewInit {

  @Output() compilacionExitosa = new EventEmitter<void>();

  @ViewChild('editorRef') editorRef!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('lineasRef') lineasRef!: ElementRef<HTMLDivElement>;

  mostrarModalTabla: boolean = false;
  mostrarModalPrimSig: boolean = false;

  codigo: string = '';
  nombreAnalizador: string = '';
  resultado: RespuestaCompilar | null = null;
  errores: ErrorWison[] = [];
  compilando: boolean = false;
  numerosLinea: number[] = [1];
  lineasConError: Set<number> = new Set();

  mostrarPrimero: boolean = false;
  mostrarSiguiente: boolean = false;
  mostrarTablaM: boolean = false;

  constructor(private wisonService: WisonService) {}

  ngAfterViewInit() {
    this.actualizarLineas();
  }

  actualizarLineas() {
    const totalLineas = this.codigo.split('\n').length;
    this.numerosLinea = Array.from({ length: totalLineas }, (_, i) => i + 1);
  }

  sincronizarScroll(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    if (this.lineasRef) {
      this.lineasRef.nativeElement.scrollTop = textarea.scrollTop;
    }
  }

  esLineaConError(linea: number): boolean {
    return this.lineasConError.has(linea);
  }

  compilar() {
    if (!this.codigo.trim()) return;

    const nombre = this.nombreAnalizador.trim() || 'analizador_' + Date.now();
    this.compilando = true;
    this.errores = [];
    this.resultado = null;
    this.lineasConError = new Set();

    this.wisonService.compilar(this.codigo, nombre).subscribe({
      next: (res) => {
        this.compilando = false;
        this.resultado = res;

        if (res.exito) {
          this.errores = [];
          this.lineasConError = new Set();
          this.compilacionExitosa.emit();
        } else {
          this.errores = res.errores || res.colisiones || [];
          for (const err of this.errores) {
            const match = err.mensaje.match(/línea (\d+)/);
            if (match) {
              this.lineasConError.add(parseInt(match[1]));
            }
          }
        }
      },
      error: () => {
        this.compilando = false;
        this.errores = [{ tipo: 'general', mensaje: 'Error de conexión con el servidor.' }];
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
      this.actualizarLineas();
    };

    reader.readAsText(archivo);
  }

  limpiar() {
    this.codigo = '';
    this.nombreAnalizador = '';
    this.resultado = null;
    this.errores = [];
    this.lineasConError = new Set();
    this.actualizarLineas();
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

  extraerLinea(mensaje: string): string {
    const match = mensaje.match(/línea (\d+)/);
    return match ? match[1] : '-';
  }

  getTipoClase(tipo: string): string {
    switch (tipo) {
      case 'lexico': return 'tipo-lexico';
      case 'sintactico': return 'tipo-sintactico';
      case 'semantico': return 'tipo-semantico';
      default: return 'tipo-general';
    }
  }
}