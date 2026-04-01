// prueba.js - Test del lexer dinámico
const parser = require('./wison');
const { analizarSemantica } = require('./semantico');
const { construirTodosAFDs, tokenizar } = require('./lexer-dinamico');

// Test 2: Rangos y operadores
console.log("\n=== TEST 2: Rangos y operadores ===");
const entrada2 = `
Wison ¿
Lex {:
    Terminal $_Num    <- [0-9]+ ;
    Terminal $_Letra  <- [aA-zZ] ;
    Terminal $_Mas    <- '+' ;
:}
Syntax {{:
    No_Terminal %_S ;
    Initial_Sim %_S ;
    %_S <= $_Num $_Mas $_Num ;
:}}
?Wison
`;

const ast2 = parser.parse(entrada2);
const afds2 = construirTodosAFDs(ast2.terminales);
const orden2 = Object.keys(ast2.terminales);

console.log("Tokenizando '123+456':");
const res2 = tokenizar('123+456', afds2, orden2);
for (const tok of res2.tokens) {
    console.log(`  [${tok.tipo}] "${tok.valor}" (pos ${tok.posicion})`);
}

console.log("\nTokenizando '9+a':");
const res3 = tokenizar('9+a', afds2, orden2);
for (const tok of res3.tokens) {
    console.log(`  [${tok.tipo}] "${tok.valor}" (pos ${tok.posicion})`);
}
for (const err of res3.errores) {
    console.log(`  ERROR: ${err.mensaje}`);
}