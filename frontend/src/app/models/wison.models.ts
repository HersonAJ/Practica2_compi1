export interface ErrorWison {
  tipo: string;
  mensaje: string;
  linea?: number;
}

export interface RespuestaCompilar {
  exito: boolean;
  nombre: string;
  ast: {
    terminales: string[];
    noTerminales: string[];
    simboloInicial: string;
    producciones: { [key: string]: string[][] };
  };
  primero: { [key: string]: string[] };
  siguiente: { [key: string]: string[] };
  tabla: { [key: string]: { [key: string]: string[] } };
  colisiones: ErrorWison[];
  esLL1: boolean;
  errores?: ErrorWison[];
}

export interface NodoArbol {
  nombre: string;
  esTerminal: boolean;
  valor: string | null;
  hijos: NodoArbol[];
}

export interface Token {
  tipo: string;
  valor: string;
  posicion: number;
}

export interface RespuestaAnalizar {
  exito: boolean;
  tokens: Token[];
  arbol: NodoArbol | null;
  errores: ErrorWison[];
}

export interface Analizador {
  nombre: string;
  simboloInicial: string;
  noTerminales: string[];
  terminales: string[];
}