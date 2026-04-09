import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {

  @Input() titulo: string = '';
  @Input() visible: boolean = false;
  @Output() cerrar = new EventEmitter<void>();

  onCerrar() {
    this.cerrar.emit();
  }

  onFondoClick(event: Event) {
    // Cerrar solo si se hizo click en el fondo, no en el contenido
    if (event.target === event.currentTarget) {
      this.onCerrar();
    }
  }
}
