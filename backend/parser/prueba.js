// prueba.js - Test flujo completo con lexer simplificado
const parser = require('./wison');
const { analizarSemantica } = require('./semantico');
const { tokenizar } = require('./lexer-dinamico');
const { construirLL1, imprimirTabla } = require('./ll1');
const { ParserLL1, mostrarArbol } = require('./parser-ll1');

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
const ast = parser.parse(entrada);
console.log("Parseo OK");

// Paso 2: Semántico
const sem = analizarSemantica(ast);
console.log("Semántico:", sem.valido);

// Paso 3: LL(1)
const ll1 = construirLL1(ast);
imprimirTabla(ll1, ast.terminales);

// Paso 4: Tokenizar y parsear
if (ll1.esLL1) {
    const miParser = new ParserLL1(ll1.tabla, ast.simboloInicial, ast.terminales);

    console.log("\n=== Parsear 'a+a+aFIN' ===");
    const { tokens } = tokenizar('a+a+aFIN', ast.terminales);
    console.log("Tokens:", tokens.map(t => t.tipo).join(', '));

    const resultado = miParser.analizar(tokens);
    console.log("Aceptada:", resultado.aceptada);
    if (resultado.aceptada) {
        mostrarArbol(resultado.arbol);
    }
}