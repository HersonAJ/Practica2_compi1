// prueba.js - Test del parser de Wison
const parser = require('./wison');

const entrada = `
Wison ¿
Lex {:
    /** Esto es un comentario de bloque */
    # Terminales simples
    Terminal $_Una_A    <- 'a' ;
    Terminal $_Mas      <- '+' ;
    Terminal $_Punto    <- '.' ;
    Terminal $_P_Ab     <- '(' ;
    Terminal $_P_Ce     <- ')' ;
    Terminal $_FIN      <- 'FIN' ;

    # Rangos
    Terminal $_Letra    <- [aA-zZ] ;
    Terminal $_NUMERO   <- [0-9] ;

    # Operadores unarios
    Terminal $_NUMEROS   <- [0-9]* ;
    Terminal $_NUMEROS_2 <- [0-9]+ ;
    Terminal $_NUMEROS_3 <- [0-9]? ;

    # Terminal combinado con concatenación y referencias
    Terminal $_Decimal  <- ([0-9]*)($_Punto)($_NUMEROS_2) ;
:}
Syntax {{:
    No_Terminal %_Prod_A ;
    No_Terminal %_Prod_B ;
    No_Terminal %_Prod_C ;
    No_Terminal %_S ;

    Initial_Sim %_S ;

    %_S      <= %_Prod_A $_FIN ;
    %_Prod_A <= $_P_Ab %_Prod_B $_P_Ce ;
    %_Prod_B <= %_Prod_B %_Prod_C | %_Prod_C ;
    %_Prod_C <= $_Una_A $_Mas $_Una_A ;
:}}
?Wison
`;

try {
    const ast = parser.parse(entrada);
    console.log("=== AST GENERADO ===");
    console.log(JSON.stringify(ast, null, 2));
} catch (e) {
    console.error("Error al parsear:", e.message);
}