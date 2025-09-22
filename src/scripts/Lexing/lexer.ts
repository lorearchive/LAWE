import LexerContext from "./context"
import type { TokenHandler } from "./Handlers/handlers"
import type { CalloutType } from "./Handlers/PseudoHTMLHandler";
import { FootnoteHandler, FormattingHandler, HeadingHandler, ImageHandler, LinkHandler, MiscHandler, TextHandler, WhitespaceHandler } from "./Handlers/handlers";
import PseudoHTMLHandler from "./Handlers/PseudoHTMLHandler";
import TripleParenthesesHandler from "./Handlers/tripleParenHandler";

export enum TokenType {
    TEXT = 'TEXT',

    BOLD_OPEN = "BOLD_OPEN",
    BOLD_CLOSE = "BOLD_CLOSE",
    ITALIC_OPEN = "ITALIC_OPEN",
    ITALIC_CLOSE = "ITALIC_CLOSE",
    UNDERLINE_OPEN = "UNDERLINE_OPEN",
    UNDERLINE_CLOSE = "UNDERLINE_CLOSE",
    HEADING_OPEN = "HEADING_OPEN",
    HEADING_CLOSE = "HEADING_CLOSE",

    HORIZ_RULE = "HORIZ_RULE",
    LINEBREAK = "LINEBREAK",
    NEWLINE = "NEWLINE",
    WHITESPACE = "WHITESPACE",

    CALLOUT_OPEN = "CALLOUT_OPEN",
    CALLOUT_CLOSE = "CALLOUT_CLOSE",

    SUB_OPEN = "SUB_OPEN",
    SUB_CLOSE = "SUB_CLOSE",
    SUP_OPEN = "SUP_OPEN",
    SUP_CLOSE = "SUP_CLOSE",

    TABLE_OPEN = "TABLE_OPEN",
    TABLE_CLOSE = "TABLE_CLOSE",
    THEAD_OPEN = "THEAD_OPEN",
    THEAD_CLOSE = "THEAD_CLOSE",
    TBODY_OPEN = "TBODY_OPEN",
    TBODY_CLOSE = "TBODY_CLOSE",
    TFOOT_OPEN = "TFOOT_OPEN",
    TFOOT_CLOSE = "TFOOT_CLOSE",
    TR_OPEN = "TR_OPEN",
    TR_CLOSE = "TR_CLOSE",
    TD_OPEN = "TD_OPEN",
    TD_CLOSE = "TD_CLOSE",
    TH_OPEN = "TH_OPEN",
    TH_CLOSE = "TH_CLOSE",

    IMAGE_OPEN = "IMAGE_OPEN",
    IMAGE_PIPE = "IMAGE_PIPE", // Separator of image file path and caption. {{/file/to/path|caption here!}}
    IMAGE_CLOSE = "IMAGE_CLOSE",

    LINK_OPEN = "LINK_OPEN",
    LINK_CLOSE = "LINK_CLOSE",
    LINK_PIPE = "LINK_PIPE",
    FOOTNOTE_OPEN = "FOOTNOTE_OPEN",
    FOOTNOTE_CLOSE = "FOOTNOTE_CLOSE",
    CITATION_NEEDED = "CITATION_NEEDED", // CITATION_NEEDED and TRIPLE_PARENTHESES are considered as different tokens
    TRIPLE_PARENTHESES = "TRIPLE_PARENTHESES",

    BLOCKQUOTE_OPEN = "BLOCKQUOTE_OPEN",
    BLOCKQUOTE_CLOSE = "BLOCKQUOTE_CLOSE",
    AFFILI = "AFFILI",


    EOF = "EOF"
}

export interface Token {
    type: TokenType;
    value: string;
    position: { line: number; col: number };
    attributes?: Record<string, string>;
    calloutType?: CalloutType;
    calloutTitle?: string;
}



export default class Lexer {
    private handlers: TokenHandler[] = [];

    constructor() {
        this.registerDefaultHandlers();
    }

    private registerDefaultHandlers(): void {
        this.handlers = [
            new FormattingHandler(),
            new HeadingHandler(),
            new WhitespaceHandler(),
            new TextHandler(),
            new PseudoHTMLHandler(),
            new ImageHandler(),
            new MiscHandler(),
            new LinkHandler(),
            new FootnoteHandler(),
            new TripleParenthesesHandler()
        ];

        // Sort by priority (highest first)
        this.handlers.sort((a, b) => b.priority - a.priority);
    }

    public registerHandler(handler: TokenHandler): void {
        this.handlers.push(handler);
        this.handlers.sort((a, b) => b.priority - a.priority);
    }

    public tokenise(input: string): Token[] {
        const context = new LexerContext(input);
        const tokens: Token[] = []
        const tokenStack: TokenType[] = []

        while (!context.isEOF()) {
            let handled = false;

            for (const handler of this.handlers) {
                if (handler.canHandle(context)) {
                    if (handler.handle(context, tokens, tokenStack)) {
                        handled = true;
                        break;
                    }
                }
            }

            if (!handled) {
                // This should never happen with TextHandler as fallback
                throw new Error(`LAWE PP: Unhandled character at position ${context.position}: '${context.peek()}'`);
            }
        }

        tokens.push(context.createToken(TokenType.EOF, ''))
        return tokens
    }
}