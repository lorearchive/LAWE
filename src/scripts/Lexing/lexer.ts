import LexerContext from "./context"
import type { TokenHandler } from "./Handlers/handlers"
import type { CalloutType } from "./Handlers/PseudoHTMLHandler";
import { FormattingHandler, HeadingHandler, MiscHandler, TextHandler, WhitespaceHandler } from "./Handlers/handlers";
import { PseudoHTMLHandler } from "./Handlers/PseudoHTMLHandler";

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

    EOF = "EOF"
}

export interface Token {
    type: TokenType;
    value: string;
    position: { line: number; col: number };
    calloutType?: CalloutType;
    calloutTitle?: string;
}



// lexer/main.ts
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
            new MiscHandler()
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