import type { Token } from "./lexer";
import { TokenType } from "./lexer";
import type { CalloutType } from "./Handlers/PseudoHTMLHandler";

export default class LexerContext {
    constructor(
        public input: string,
        public position: number = 0,
        public line: number = 1,
        public col: number = 1
    ) {}

    isEOF(): boolean {
        return this.position >= this.input.length;
    }

    peek(lookahead: number = 0): string {
        if (this.position + lookahead >= this.input.length) {
            return '';
        }
        return this.input[this.position + lookahead];
    }

    advance(count: number = 1): string {
        const char = this.peek();
        this.position += count;

        if (char === "\n") {
            this.line++;
            this.col = 1;
        } else {
            this.col += count;
        }
        return char;
    }

    matchString(str: string): boolean {
        for (let i = 0; i < str.length; i++) {
            if (this.peek(i) !== str[i]) {
                return false;
            }
        }
        return true;
    }

    createToken( type: TokenType, value: string, calloutType?: CalloutType, calloutTitle?: string, imgExternal?: string ): Token {
    return {
        type,
        value,
        position: { line: this.line, col: this.col - value.length },
        ...(calloutType && calloutTitle && { calloutType, calloutTitle }),
        ...(imgExternal && { imgExternal })
    }
}

}