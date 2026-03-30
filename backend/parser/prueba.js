// prueba.js - Test del parser + semántico
const parser = require('./wison');
const { analizarSemantica } = require('./semantico');

// =============================================
// TEST 2: Entrada con errores semánticos
// =============================================
console.log("\n=== TEST 2: Entrada con errores ===");
const entradaConErrores = `
Wison ¿
Lex {:
    Terminal $_A   <- 'a' ;
:}
Syntax {{:
    No_Terminal %_S ;
    No_Terminal %_S ;
    %_S  <= %_E $_B ;
    %_E  <= $_A $_NOEXISTE ;
:}}
?Wison
`;


console.log("=== TEST 2: Entrada inválida ===");

let ast1;
try {
    ast1 = parser.parse(entradaConErrores);
    console.log("Parseo OK");
    console.log(JSON.stringify(ast1, null, 2));
} catch (e) {
    console.error("Error en PARSER:", e.message);
}

if (ast1) {
    try {
        const resultado1 = analizarSemantica(ast1);
        console.log("Válido:", resultado1.valido);
        console.log("Errores:", resultado1.errores);
    } catch (e) {
        console.error("Error en SEMANTICO:", e.message);
    }
}