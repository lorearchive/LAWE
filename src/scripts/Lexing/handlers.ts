import { TokenType } from "./lexer";
import type { Token } from "./lexer";
import LexerContext from "./context";

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
            return this.handleLinebreak(context, tokens)
        }

        if (this.isHorizRule(context)) {
            return this.handleHorizRule(context, tokens)
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

    private handleLinebreak(context: LexerContext, tokens: Token[]): boolean {
        context.advance(2)
        tokens.push(context.createToken(TokenType.LINEBREAK, '\\\\'))
        return true
    }

    private handleHorizRule(context: LexerContext, tokens: Token[]): boolean {
        context.advance(4);
        tokens.push(context.createToken(TokenType.HORIZ_RULE, '----'));
        return true;
    }
}

export class PseudoHTMLHandler extends BaseTokenHandler {
    priority = 110; // High priority to catch before other handlers

    private tagMappings = {
        'callout': { open: TokenType.CALLOUT_OPEN, close: TokenType.CALLOUT_CLOSE },
        'sub': { open: TokenType.SUB_OPEN, close: TokenType.SUB_CLOSE },
        'sup': { open: TokenType.SUP_OPEN, close: TokenType.SUP_CLOSE }
    };

    canHandle(context: LexerContext): boolean {
        if (context.peek() !== '<') return false;

        // Check for closing tag: </tagname>
        if (context.peek(1) === '/') {
            return this.isValidClosingTag(context);
        }

        // Check for opening tag: <tagname ...>
        return this.isValidOpeningTag(context);
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        if (context.peek(1) === '/') {
            return this.handleClosingTag(context, tokens, tokenStack);
        } else {
            return this.handleOpeningTag(context, tokens, tokenStack);
        }
    }

    private isValidOpeningTag(context: LexerContext): boolean {
        if (context.peek() !== '<') return false;

        // Extract tag name
        let pos = 1; // Skip '<'
        let tagName = '';
        
        while (pos < context.input.length - context.position) {
            const char = context.peek(pos);
            if (char === ' ' || char === '>' || char === '\n') break;
            if (/[a-zA-Z]/.test(char)) {
                tagName += char;
                pos++;
            } else {
                return false; // Invalid character in tag name
            }
        }

        return this.tagMappings.hasOwnProperty(tagName);
    }

    private isValidClosingTag(context: LexerContext): boolean {
        if (context.peek() !== '<' || context.peek(1) !== '/') return false;

        // Extract tag name from </tagname>
        let pos = 2; // Skip '</'
        let tagName = '';
        
        while (pos < context.input.length - context.position) {
            const char = context.peek(pos);
            if (char === '>') break;
            if (/[a-zA-Z]/.test(char)) {
                tagName += char;
                pos++;
            } else {
                return false;
            }
        }

        return this.tagMappings.hasOwnProperty(tagName);
    }

    private handleOpeningTag(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        const startPos = context.position;
        context.advance(1); // Skip '<'

        // Parse tag name
        let tagName = '';
        while (!context.isEOF() && /[a-zA-Z]/.test(context.peek())) {
            tagName += context.advance();
        }

        if (!this.tagMappings.hasOwnProperty(tagName)) {
            // Reset position if invalid tag
            context.position = startPos;
            return false;
        }

        const mapping = this.tagMappings[tagName]
        let attributes: { [key: string]: string } = {};

        // Parse attributes (for callout)
        if (tagName === 'callout') {
            attributes = this.parseAttributes(context);
        }

        // Skip to closing '>'
        while (!context.isEOF() && context.peek() !== '>') {
            context.advance();
        }

        if (context.peek() === '>') {
            context.advance(); // Skip '>'
        }

        // Create the full tag string
        const fullTag = context.input.slice(startPos, context.position);
        
        // Create token with attributes
        const token = context.createToken(mapping.open, fullTag);
        
        if (tagName === 'callout') {
            token.calloutType = attributes.type || 'default';
            token.calloutTitle = attributes.title;
        }

        tokens.push(token);
        tokenStack.push(mapping.open);
        
        return true;
    }

    private handleClosingTag(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        const startPos = context.position;
        context.advance(2); // Skip '</'

        // Parse tag name
        let tagName = '';
        while (!context.isEOF() && /[a-zA-Z]/.test(context.peek())) {
            tagName += context.advance();
        }

        if (!this.tagMappings.hasOwnProperty(tagName)) {
            // Reset position if invalid tag
            context.position = startPos;
            return false;
        }

        const mapping = this.tagMappings[tagName];

        // Skip to closing '>'
        while (!context.isEOF() && context.peek() !== '>') {
            context.advance();
        }

        if (context.peek() === '>') {
            context.advance(); // Skip '>'
        }

        // Create the full closing tag string
        const fullTag = context.input.slice(startPos, context.position);
        
        tokens.push(context.createToken(mapping.close, fullTag));
        
        // Remove the most recent matching open token from the stack
        const index = tokenStack.lastIndexOf(mapping.open);
        if (index !== -1) {
            tokenStack.splice(index, 1);
        }
        
        return true;
    }

    private parseAttributes(context: LexerContext): { [key: string]: string } {
        const attributes: { [key: string]: string } = {};

        while (!context.isEOF() && context.peek() !== '>') {
            // Skip whitespace
            while (!context.isEOF() && /\s/.test(context.peek())) {
                context.advance();
            }

            if (context.peek() === '>') break;

            // Parse attribute name
            let attrName = '';
            while (!context.isEOF() && /[a-zA-Z]/.test(context.peek())) {
                attrName += context.advance();
            }

            if (!attrName) break;

            // Skip whitespace and '='
            while (!context.isEOF() && (/\s/.test(context.peek()) || context.peek() === '=')) {
                context.advance();
            }

            // Parse attribute value
            let attrValue = '';
            if (context.peek() === '"') {
                context.advance(); // Skip opening quote
                while (!context.isEOF() && context.peek() !== '"') {
                    attrValue += context.advance();
                }
                if (context.peek() === '"') {
                    context.advance(); // Skip closing quote
                }
            } else {
                // Unquoted value
                while (!context.isEOF() && !/\s/.test(context.peek()) && context.peek() !== '>') {
                    attrValue += context.advance();
                }
            }

            if (attrName) {
                attributes[attrName] = attrValue;
            }
        }

        return attributes;
    }
}