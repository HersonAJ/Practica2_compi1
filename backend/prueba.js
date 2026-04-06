const parser = require('./wison-parser/wison');
const AnalizadorSemantico = require('./semantico/AnalizadorSemantico');
const Tokenizador = require('./lexer/Tokenizador');
const MotorLL1 = require('./ll1/MotorLL1');
const ParserDescendente = require('./parser-descendente/ParserDescendente');

const entrada = `
Wison ¿
Lex {:
    Terminal $_A   <- 'a' ;
    Terminal $_Mas <- '+' ;
    Terminal $_FIN <- 'FIN' ;
:}
Syntax {{:
    No_Terminal %_S ;
    No_Terminal %_E ;
    No_Terminal %_Ep ;
    Initial_Sim %_S ;
    %_S  <= %_E $_FIN ;
    %_E  <= $_A %_Ep ;
    %_Ep <= $_Mas $_A %_Ep | ;
:}}
?Wison
`;

// Paso 1: Parsear Wison
console.log("=== PASO 1: Parsear Wison ===");
const ast = parser.parse(entrada);
console.log("OK");

// Paso 2: Semantico
console.log("\n=== PASO 2: Semántico ===");
const semantico = new AnalizadorSemantico(ast);
const resSem = semantico.analizar();
console.log("Válido:", resSem.valido);

// Paso 3: Motor LL(1)
console.log("\n=== PASO 3: Motor LL(1) ===");
const motor = new MotorLL1(ast);
motor.construir();
motor.imprimirResultados();

// Paso 4: Tokenizar y parsear
if (motor.esLL1) {
    const tokenizador = new Tokenizador(ast.terminales);
    const miParser = new ParserDescendente(motor.tabla, ast.simboloInicial);

    // Cadena aceptada
    console.log("\n=== PASO 4: Parsear 'a+a+aFIN' ===");
    const { tokens } = tokenizador.tokenizar('a+a+aFIN');
    console.log("Tokens:", tokens.map(t => t.tipo).join(', '));

    const resultado = miParser.analizar(tokens);
    console.log("Aceptada:", resultado.aceptada);
    if (resultado.aceptada) {
        ParserDescendente.mostrarArbol(resultado.arbol);
    }

    // Cadena rechazada
    console.log("\n=== Parsear 'a+FIN' (error) ===");
    const { tokens: tokens2 } = tokenizador.tokenizar('a+FIN');
    const resultado2 = miParser.analizar(tokens2);
    console.log("Aceptada:", resultado2.aceptada);
    for (const err of resultado2.errores) {
        console.log(`  ${err.toString()}`);
    }
}