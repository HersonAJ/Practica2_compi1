import { Routes } from '@angular/router';
import { EditorWison } from './editor-wison/editor-wison';
import { ListaAnalizadores } from './lista-analizadores/lista-analizadores';
import { AnalizadorCadena } from './analizador-cadena/analizador-cadena';

export const routes: Routes = [

    {path: '', component: EditorWison},
    {path: 'analizadores', component: ListaAnalizadores},
    {path: 'analizar-cadena', component: AnalizadorCadena},
];
