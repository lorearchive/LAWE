import Lexer  from '../scripts/Lexing/lexer';
import Parser from '../scripts/Parsing/parser';
import Renderer from '../scripts/Rendering/renderer';

const lexer = new Lexer()
const parser = new Parser()
const renderer = new Renderer()

export default function inlineRenderer(raw: string): string {
    raw = raw.replace(/^\s*\n/gm, '');

    const tokens = lexer.tokenise(raw)
    const ast = parser.parse(tokens)
    const html = renderer.render(ast)


    return html
}