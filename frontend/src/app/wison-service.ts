import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RespuestaCompilar, RespuestaAnalizar, Analizador } from './models/wison.models';

@Injectable({
  providedIn: 'root',
})
export class WisonService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  compilar(codigo: string, nombre: string): Observable<RespuestaCompilar> {
    return this.http.post<RespuestaCompilar>(`${this.apiUrl}/compilar`, {codigo, nombre});
  }
  
  analizar(nombre: string, cadena: string): Observable<RespuestaAnalizar> {
    return this.http.post<RespuestaAnalizar>(`${this.apiUrl}/analizar`, { nombre, cadena });
  }

  obtenerAnalizadores(): Observable<{ analizadores: Analizador[] }> {
    return this.http.get<{ analizadores: Analizador[] }>(`${this.apiUrl}/analizadores`);
  }

  eliminarAnalizador(nombre: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/analizadores/${nombre}`);
  }
}
