%{
    var erroresLexicos = [];
    var erroresSintacticos = [];
%}

%lex
%%

\s+                                   /* ignorar espacios, tabs, saltos de linea */
"#"[^\n]*                             /* comentario de linea */
\/\*\*[\s\S]*?\*\/                    /* comentario de bloque */

"{{:"                                 return 'ABRE_SYNTAX';
":}}"                                 return 'CIERRA_SYNTAX';
"{:"                                  return 'ABRE_LEX';
":}"                                  return 'CIERRA_LEX';
\?Wison                               return 'CIERRA_WISON';
"¿"                                   return 'ABRE_WISON';

"Wison"                               return 'WISON';
"Lex"                                 return 'LEX';
"Syntax"                              return 'SYNTAX';
"Terminal"                            return 'TERMINAL';
"No_Terminal"                         return 'NO_TERMINAL';
"Initial_Sim"                         return 'INITIAL_SIM';

"<-"                                  return 'FLECHA_LEX';
"<="                                  return 'FLECHA_PROD';
";"                                   return 'PUNTO_COMA';
"|"                                   return 'PIPE';
"("                                   return 'PAREN_IZQ';
")"                                   return 'PAREN_DER';
"*"                                   return 'ASTERISCO';
"+"                                   return 'MAS_OP';
"?"                                   return 'INTERROGACION';

\[aA\-zZ\]                            return 'RANGO_AZ';
\[0\-9\]                              return 'RANGO_09';

\'[^']+\'                             yytext = yytext.slice(1,-1); return 'STRING';

\$_[a-zA-Z_][a-zA-Z0-9_]*            return 'DOLLAR_ID';
\%_[a-zA-Z_][a-zA-Z0-9_]*            return 'PERCENT_ID';

<<EOF>>                               return 'EOF';

.                                     {
                                          var linea = yylineno + 1;
                                          var ultimoError = erroresLexicos[erroresLexicos.length - 1];
                                          if (ultimoError && ultimoError._linea === linea && ultimoError._acumulando) {
                                              ultimoError._texto += yytext;
                                              ultimoError.mensaje = 'Texto no reconocido "' + ultimoError._texto + '" en linea ' + linea;
                                          } else {
                                              erroresLexicos.push({
                                                  tipo: 'lexico',
                                                  mensaje: 'Texto no reconocido "' + yytext + '" en linea ' + linea,
                                                  _texto: yytext,
                                                  _linea: linea,
                                                  _acumulando: true
                                              });
                                          }
                                      }

/lex

%start programa

%%

/* 
   ESTRUCTURA PRINCIPAL
   Wison ¿ ... ?Wison
 */
programa
    : WISON ABRE_WISON bloque_lexico bloque_sintactico CIERRA_WISON EOF
        {
            $$ = {
                terminales: $3,
                noTerminales: $4.noTerminales,
                simboloInicial: $4.simboloInicial,
                producciones: $4.producciones,
                erroresLexicos: erroresLexicos,
                erroresSintacticos: erroresSintacticos
            };
            erroresLexicos = [];
            erroresSintacticos = [];
            return $$;
        }
    | WISON ABRE_WISON bloque_lexico bloque_sintactico error EOF
        {
            erroresSintacticos.push({
                tipo: 'sintactico',
                mensaje: 'Se esperaba "?Wison" para cerrar la estructura Wison.'
            });
            $$ = {
                terminales: $3,
                noTerminales: $4.noTerminales,
                simboloInicial: $4.simboloInicial,
                producciones: $4.producciones,
                erroresLexicos: erroresLexicos,
                erroresSintacticos: erroresSintacticos
            };
            erroresLexicos = [];
            erroresSintacticos = [];
            return $$;
        }
    ;

/* 
   BLOQUE LEXICO: Lex {: ... :}
   Contiene las declaraciones de terminales
*/
bloque_lexico
    : LEX ABRE_LEX lista_declaraciones_terminales CIERRA_LEX
        { $$ = $3; }
    | LEX ABRE_LEX CIERRA_LEX
        { $$ = {}; }
    ;

lista_declaraciones_terminales
    : lista_declaraciones_terminales declaracion_terminal
        {
            if ($2) { $1[$2.nombre] = $2.expresion; }
            $$ = $1;
        }
    | declaracion_terminal
        {
            $$ = {};
            if ($1) { $$[$1.nombre] = $1.expresion; }
        }
    ;

/* Terminal $_NOMBRE <- EXPRESION ; */
declaracion_terminal
    : TERMINAL DOLLAR_ID FLECHA_LEX expresion_regular PUNTO_COMA
        { $$ = { nombre: $2, expresion: $4 }; }
    | TERMINAL error PUNTO_COMA
        {
            erroresSintacticos.push({
                tipo: 'sintactico',
                mensaje: 'Se esperaba un identificador de terminal ($_nombre) y una expresion despues de "Terminal" en linea ' + @1.first_line + '.'
            });
            $$ = null;
        }
    ;

/*
   EXPRESIONES REGULARES DEL BLOQUE LEX
   Definen los patrones de cada terminal
*/

/* Concatenacion implicita: dos elementos juntos se concatenan */
expresion_regular
    : expresion_regular elemento_con_operador
        { $$ = { tipo: 'concatenacion', izq: $1, der: $2 }; }
    | elemento_con_operador
        { $$ = $1; }
    ;

/* Elemento con operador unario: *, +, ? */
elemento_con_operador
    : elemento_base ASTERISCO
        { $$ = { tipo: 'kleene', expresion: $1 }; }
    | elemento_base MAS_OP
        { $$ = { tipo: 'positiva', expresion: $1 }; }
    | elemento_base INTERROGACION
        { $$ = { tipo: 'opcional', expresion: $1 }; }
    | elemento_base
        { $$ = $1; }
    ;

/* Elementos base: string, rango, referencia a otro terminal, grupo entre parentesis */
elemento_base
    : STRING
        { $$ = { tipo: 'string', valor: $1 }; }
    | RANGO_AZ
        { $$ = { tipo: 'rango', valor: 'aA-zZ' }; }
    | RANGO_09
        { $$ = { tipo: 'rango', valor: '0-9' }; }
    | DOLLAR_ID
        { $$ = { tipo: 'referencia', valor: $1 }; }
    | PAREN_IZQ expresion_regular PAREN_DER
        { $$ = { tipo: 'grupo', expresion: $2 }; }
    ;

/*
   BLOQUE SINTACTICO: Syntax {{: ... :}}
   Contiene no terminales, simbolo inicial
   y producciones
*/
bloque_sintactico
    : SYNTAX ABRE_SYNTAX contenido_bloque_sintactico CIERRA_SYNTAX
        { $$ = $3; }
    | SYNTAX ABRE_SYNTAX CIERRA_SYNTAX
        { $$ = { noTerminales: [], simboloInicial: null, producciones: {} }; }
    ;

contenido_bloque_sintactico
    : contenido_bloque_sintactico elemento_sintactico
        {
            if ($2) {
                if ($2.tipo === 'no_terminal') $1.noTerminales.push($2.valor);
                else if ($2.tipo === 'simbolo_inicial') $1.simboloInicial = $2.valor;
                else if ($2.tipo === 'produccion') {
                    if (!$1.producciones[$2.nombre]) $1.producciones[$2.nombre] = [];
                    $1.producciones[$2.nombre] = $1.producciones[$2.nombre].concat($2.alternativas);
                }
            }
            $$ = $1;
        }
    | elemento_sintactico
        {
            $$ = { noTerminales: [], simboloInicial: null, producciones: {} };
            if ($1) {
                if ($1.tipo === 'no_terminal') $$.noTerminales.push($1.valor);
                else if ($1.tipo === 'simbolo_inicial') $$.simboloInicial = $1.valor;
                else if ($1.tipo === 'produccion') {
                    $$.producciones[$1.nombre] = $1.alternativas;
                }
            }
        }
    ;

/* Cada elemento del bloque sintactico puede ser: declaracion de NT, simbolo inicial o produccion */
elemento_sintactico
    : declaracion_no_terminal
        { $$ = $1 ? { tipo: 'no_terminal', valor: $1 } : null; }
    | declaracion_simbolo_inicial
        { $$ = $1 ? { tipo: 'simbolo_inicial', valor: $1 } : null; }
    | produccion
        { $$ = $1 ? { tipo: 'produccion', nombre: $1.nombre, alternativas: $1.alternativas } : null; }
    ;

/* No_Terminal %_Nombre ; */
declaracion_no_terminal
    : NO_TERMINAL PERCENT_ID PUNTO_COMA
        { $$ = $2; }
    | NO_TERMINAL error PUNTO_COMA
        {
            erroresSintacticos.push({
                tipo: 'sintactico',
                mensaje: 'Se esperaba un identificador de no terminal (%_nombre) despues de "No_Terminal" en linea ' + @1.first_line + '.'
            });
            $$ = null;
        }
    ;

/* Initial_Sim %_Nombre ; */
declaracion_simbolo_inicial
    : INITIAL_SIM PERCENT_ID PUNTO_COMA
        { $$ = $2; }
    | INITIAL_SIM error PUNTO_COMA
        {
            erroresSintacticos.push({
                tipo: 'sintactico',
                mensaje: 'Se esperaba un identificador de no terminal (%_nombre) despues de "Initial_Sim" en linea ' + @1.first_line + '.'
            });
            $$ = null;
        }
    ;

/*
   PRODUCCIONES
   %_Nombre <= cuerpo | alternativa ;
*/
produccion
    : PERCENT_ID FLECHA_PROD cuerpo_produccion PUNTO_COMA
        { $$ = { nombre: $1, alternativas: $3 }; }
    | PERCENT_ID error PUNTO_COMA
        {
            erroresSintacticos.push({
                tipo: 'sintactico',
                mensaje: 'Se esperaba "<=" seguido de una produccion valida para "' + $1 + '" en linea ' + @1.first_line + '.'
            });
            $$ = null;
        }
    ;

/* Cuerpo con alternativas separadas por | */
cuerpo_produccion
    : cuerpo_produccion PIPE alternativa
        { $1.push($3); $$ = $1; }
    | alternativa
        { $$ = [$1]; }
    ;

/* Una alternativa: lista de simbolos o vacia (epsilon) */
alternativa
    : lista_simbolos
        { $$ = $1; }
    |
        { $$ = ['ε']; }
    ;

/* Secuencia de simbolos terminales y no terminales */
lista_simbolos
    : lista_simbolos simbolo
        { $1.push($2); $$ = $1; }
    | simbolo
        { $$ = [$1]; }
    ;

/* Un simbolo puede ser terminal ($_ ) o no terminal (%_ ) */
simbolo
    : PERCENT_ID
        { $$ = $1; }
    | DOLLAR_ID
        { $$ = $1; }
    ;