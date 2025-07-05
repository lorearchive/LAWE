import { TokenType } from "../lexer";
import type { Token } from "../lexer";
import LexerContext from "../context";

export interface TokenHandler {
    canHandle(context: LexerContext): boolean;
    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean;
    priority: number; // Higher number = higher priority
}



export abstract class BaseTokenHandler implements TokenHandler {
    abstract priority: number;
    abstract canHandle(context: LexerContext): boolean;
    abstract handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean;

    protected findLastUnclosedOpenTag(tokenStack: TokenType[], openTag: TokenType, closeTag: TokenType): number {
        let closeCount = 0;
        for (let i = tokenStack.length - 1; i >= 0; i--) {
            if (tokenStack[i] === closeTag) {
                closeCount++;
            } else if (tokenStack[i] === openTag) {
                if (closeCount === 0) {
                    return i;
                }
                closeCount--;
            }
        }
        return -1;
    }
}

export class FormattingHandler extends BaseTokenHandler {
    priority = 100;

    private patterns = [
        { chars: '**', open: TokenType.BOLD_OPEN, close: TokenType.BOLD_CLOSE },
        { chars: '//', open: TokenType.ITALIC_OPEN, close: TokenType.ITALIC_CLOSE },
        { chars: '__', open: TokenType.UNDERLINE_OPEN, close: TokenType.UNDERLINE_CLOSE }
    ];

    canHandle(context: LexerContext): boolean {
        return this.patterns.some(pattern => 
            context.peek() === pattern.chars[0] && 
            context.peek(1) === pattern.chars[1]
        );
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        const pattern = this.patterns.find(p => 
            context.peek() === p.chars[0] && context.peek(1) === p.chars[1]
        );

        if (!pattern) return false;

        context.advance(2);

        const type = this.findLastUnclosedOpenTag(tokenStack, pattern.open, pattern.close) === -1
            ? pattern.open
            : pattern.close;

        tokens.push(context.createToken(type, pattern.chars));

        if (type === pattern.open) {
            tokenStack.push(pattern.open);
        } else {
            tokenStack.pop();
        }

        return true;
    }
}

export class HeadingHandler extends BaseTokenHandler {
    priority = 90;

    canHandle(context: LexerContext): boolean {
        // Check for heading open (at start of line)
        const atStartOfLine = context.position === 0 || context.input[context.position - 1] === "\n";
        if (atStartOfLine && context.peek() === "=") {
            return true;
        }

        // Check for heading close (if we have open heading)
        return context.peek() === "=";
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        const atStartOfLine = context.position === 0 || context.input[context.position - 1] === "\n";

        if (atStartOfLine && context.peek() === "=") {
            return this.handleHeadingOpen(context, tokens, tokenStack);
        } else if (context.peek() === "=" && tokenStack.includes(TokenType.HEADING_OPEN)) {
            return this.handleHeadingClose(context, tokens, tokenStack);
        }

        return false;
    }

    private handleHeadingOpen(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        let level = 0;
        while (context.peek() === "=") {
            level++;
            context.advance();
        }

        const delim = "=".repeat(level);
        tokens.push(context.createToken(TokenType.HEADING_OPEN, delim));
        tokenStack.push(TokenType.HEADING_OPEN);
        return true;
    }

    private handleHeadingClose(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        let count = 0;
        let pos = context.position;

        while (pos < context.input.length && context.input[pos] === "=") {
            count++;
            pos++;
        }

        if (count > 0) {
            const delim = "=".repeat(count);
            context.advance(count);
            tokens.push(context.createToken(TokenType.HEADING_CLOSE, delim));

            const index = tokenStack.lastIndexOf(TokenType.HEADING_OPEN);
            if (index !== -1) {
                tokenStack.splice(index, 1);
            }
            return true;
        }

        return false;
    }
}

export class WhitespaceHandler extends BaseTokenHandler {
    priority = 10; // Low priority

    canHandle(context: LexerContext): boolean {
        return context.peek() === '\n' || /\s/.test(context.peek());
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        if (context.peek() === '\n') {
            tokens.push(context.createToken(TokenType.NEWLINE, context.advance()));
            return true;
        }

        if (/\s/.test(context.peek())) {
            let whitespace = '';
            while (!context.isEOF() && /\s/.test(context.peek()) && context.peek() !== '\n') {
                whitespace += context.advance();
            }
            tokens.push(context.createToken(TokenType.WHITESPACE, whitespace));
            return true;
        }

        return false;
    }
}

export class TextHandler extends BaseTokenHandler {
    priority = 1; // Lowest priority - fallback

    private specialChars = ['_', '*', '/', '[', ']', '=', '\n', '|', '-', '`', '\\', '<'];

    canHandle(context: LexerContext): boolean {
        return !context.isEOF(); // Always can handle as fallback
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        let text = '';

        while (!context.isEOF() && 
               !(/\s/.test(context.peek())) && 
               !this.isSpecialCharacter(context.peek())) {
            text += context.advance();
        }

        if (text) {
            tokens.push(context.createToken(TokenType.TEXT, text));
            return true;
        }

        // Single character fallback
        tokens.push(context.createToken(TokenType.TEXT, context.advance()));
        return true;
    }

    private isSpecialCharacter(char: string): boolean {
        return this.specialChars.includes(char);
    }
}


export class MiscHandler extends BaseTokenHandler {
    priority = 95

    canHandle(context: LexerContext): boolean {
        return this.isLinebreak(context) || this.isHorizRule(context)
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {

        if (this.isLinebreak(context)) {

            context.advance(2)
            tokens.push(context.createToken(TokenType.LINEBREAK, '\\\\'))

            return true
        }

        if (this.isHorizRule(context)) {

            context.advance(4)
            tokens.push(context.createToken(TokenType.HORIZ_RULE, '----'))
            
            return true
        }
        
        return false
    }

    private isLinebreak(context: LexerContext): boolean {
        return context.peek() === '\\' && context.peek(1) === "\\" && (context.peek(2) === " " || context.peek(2) === "\n" )
    }

    private isHorizRule(context: LexerContext): boolean {
        const asStartOfLine = context.position === 0 || context.input[context.position - 1] === '\n'

        return asStartOfLine && context.peek() === '-' && context.peek(1) === '-' && context.peek(2) === '-' && context.peek(3) === '-' && context.peek(4) !== '-';
    }
}