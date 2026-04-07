import { Routes } from '@angular/router';
import { EditorWison } from './editor-wison/editor-wison';
import { ListaAnalizadores } from './lista-analizadores/lista-analizadores';

export const routes: Routes = [

    {path: '', component: EditorWison},
    {path: 'analizadores', component: ListaAnalizadores},
];
