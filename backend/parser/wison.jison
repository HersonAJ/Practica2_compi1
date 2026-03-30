//seccion lexica
%lex

%%

//macros y expresiones regualares

\s+                             /*ignorar los espacios, tabulaciones y saltos de linea*/
"#"[^\n]*                       /* comentario de linea desde # hasta el fin de linea*/
\/\*\*[\s\S]*?\*\/              /* comentario de bloque desde  /*   hasta */


//delimitadores de la estructura por gerarquia 

"{{:"                               return 'ABRE_SYNTAX'; 
":}}"                               return 'CIERRA_SYNTAX';
"{:"                                return 'ABRE_LEX';
":}"                                return 'CIERRA_LEX';
\?Wison                             return 'CIERRA_WISON';
"¿"                                 return 'ABRE_WISON';

//PALABRAS RESERVADAS
"Wison"                             return 'WISON';
"Lex"                               return 'LEX';
"Syntax"                            return 'SYNTAX';
"Terminal"                          return 'TERMINAL'
"No_Terminal"                       return 'NO_TERMINAL';
"Initial_Sim"                       return 'INITIAL_SIM';

//Operadores
"<-"                                return 'FLECHA_LEX';
"<="                                return 'FLECHA_PROD';
";"                                 return 'PUNTO_COMA';
"|"                                 return 'PIPE';
"("                                 return 'PAREN_IZQ';
")"                                 return 'PAREN_DER';
"*"                                 return 'ASTERISCO';
"+"                                 return 'MAS_OP';
"?"                                 return 'INTERROGACION';

//rangos especiales 
\[aA\-zZ\]                          return 'RANGO_AZ';
\[0\-9\]                            return 'RANGO_09';

//literales entre comillas simples
\'[^']+\'                           yytext = yytext.slice(1, -1); return 'STRING';

//identificador con prefijo
\$_[a-zA-Z_][a-zA-Z0-9_]*           return 'DOLLAR_ID';
\%_[a-zA-Z_][a-zA-Z0-9_]*           return 'PERCENT_ID';

<<EOF>>                             return 'EOF';

.                                   {   console.error('Error  lexico: caracter no reconocido " ' + yytext +  ' " en linea ' + yylineno); }

/lex

//seccion parser
%start programa 

%%

// estructura principal de wison

programa
        : WISON ABRE_WISON bloque_lex bloque_syntax CIERRA_WISON EOF
        {
            $$ = {
                terminales: $3,
                noTerminales: $4.noTerminales,
                simboloInicial: $4.simboloInicial,
                producciones: $4.producciones
            };
            return $$;
        }
    ;

//bloque lex
bloque_lex 
        : LEX ABRE_LEX lista_terminales CIERRA_LEX
        {   $$ = $3; }
        ;

lista_terminales
        : lista_terminales declaracion_terminal
            {   $1[$2.nombre] = $2.expresion; $$ = $1; }
        | declaracion_terminal
            {   $$ = {}; $$[$1.nombre] = $1.expresion; }
        ;

//terminal $_NOMBRE <- EXPRESION ;
declaracion_terminal
        : TERMINAL DOLLAR_ID FLECHA_LEX expresion_lex PUNTO_COMA
            {   $$ = {  nombre: $2, expresion: $4 }; }
        ;

//expresiones del bloque lex
//concatenacion impliciada dos partes juntas se concatenan
expresion_lex
        : expresion_lex parte_lex
            {   $$ = {  tipo: 'concatenacion', izq: $1, der: $2 }; }
        | parte_lex
            {   $$ = $1; }
        ;

//operadores unarios
parte_lex
        : atomo_lex ASTERISCO
            { $$ = { tipo: 'kleene', expresion: $1 }; }
        | atomo_lex MAS_OP
            { $$ = { tipo: 'positiva', expresion: $1 }; }
        | atomo_lex INTERROGACION
            { $$ = { tipo: 'opcional', expresion: $1 }; }
        | atomo_lex
            { $$ = $1; }
        ;

//elementos base de una expresion
atomo_lex
        : STRING
            { $$ = {tipo: 'string', valor: $1 }; }
        | RANGO_AZ
            { $$ = {tipo: 'rango', valor: 'aA-zZ'}; }
        | RANGO_09
            { $$ = {tipo: 'rango', valor: '0-9'}; }
        | DOLLAR_ID
            { $$ = {tipo: 'referencia', valor: $1 }; }
        | PAREN_IZQ expresion_lex PAREN_DER
            { $$ = {tipo: 'grupo', expresion: $2 }; }
        ;

//bloque syntax: syntax {{:..........:}}
bloque_syntax
        : SYNTAX ABRE_SYNTAX contenido_syntax CIERRA_SYNTAX
            { $$ = $3; }
        ;

//contenido del bloque syntax
contenido_syntax
    : contenido_syntax declaracion_nt
        { $1.noTerminales.push($2); $$ = $1; } //agrega el no terminal encontrado al arreglo actual
    | contenido_syntax declaracion_inicial
        { $1.simboloInicial = $2; $$ = $1; }
    | contenido_syntax produccion
        {
            if (!$1.producciones[$2.nombre]) $1.producciones[$2.nombre] = [];
            $1.producciones[$2.nombre] = $1.producciones[$2.nombre].concat($2.alternativas);
            $$ = $1;
        }
    | declaracion_nt
        { $$ = { noTerminales: [$1], simboloInicial: null, producciones: {} }; }
    | declaracion_inicial
        { $$ = { noTerminales: [], simboloInicial: $1, producciones: {} }; }
    | produccion
        {
            $$ = { noTerminales: [], simboloInicial: null, producciones: {} };
            $$.producciones[$1.nombre] = $1.alternativas;
        }
    ;

// No_Terminal %_Nombre ;
declaracion_nt
            : NO_TERMINAL PERCENT_ID PUNTO_COMA
                { $$ = $2; }
            ;

// Initial_Sim %_Nombre ;
declaracion_inicial
                : INITIAL_SIM PERCENT_ID PUNTO_COMA
                { $$ = $2; }
            ;


/* %_Nombre <= cuerpo ; */
produccion
    : PERCENT_ID FLECHA_PROD cuerpo_produccion PUNTO_COMA
        { $$ = { nombre: $1, alternativas: $3 }; }
    ;

/* Cuerpo con alternativas separadas por | */
cuerpo_produccion
    : cuerpo_produccion PIPE alternativa
        { $1.push($3); $$ = $1; }
    | alternativa
        { $$ = [$1]; }
    ;

/* Una alternativa: lista de símbolos o vacía (épsilon) */
alternativa
    : lista_simbolos
        { $$ = $1; }
    |
        { $$ = ['ε']; }
    ;

/* Secuencia de símbolos terminales y no terminales */
lista_simbolos
    : lista_simbolos simbolo
        { $1.push($2); $$ = $1; }
    | simbolo
        { $$ = [$1]; }
    ;

/* Un símbolo puede ser terminal o no terminal */
simbolo
    : PERCENT_ID
        { $$ = $1; }
    | DOLLAR_ID
        { $$ = $1; }
    ;