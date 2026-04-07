import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { WisonService } from '../wison-service';
import { Analizador } from '../models/wison.models';

@Component({
  selector: 'app-lista-analizadores',
  imports: [],
  templateUrl: './lista-analizadores.html',
  styleUrl: './lista-analizadores.css',
})
export class ListaAnalizadores  implements OnInit {
  analizadores: Analizador[] = [];
  seleccionado: string | null = null;

  @Output() analizadorSeleccionado = new EventEmitter<Analizador>();

  constructor(private wisonService: WisonService) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.wisonService.obtenerAnalizadores().subscribe({
      next: (res) => {
        this.analizadores = res.analizadores;
      },
      error: () => {
        this.analizadores = [];
      }
    });
  }

  seleccionar(analizador: Analizador) {
    this.seleccionado = analizador.nombre;
    this.analizadorSeleccionado.emit(analizador);
  }

  eliminar(nombre: string, event: Event) {
    event.stopPropagation();
    this.wisonService.eliminarAnalizador(nombre).subscribe({
      next: () => {
        if (this.seleccionado === nombre) {
          this.seleccionado = null;
        }
        this.cargar();
      }
    });
  }
}
