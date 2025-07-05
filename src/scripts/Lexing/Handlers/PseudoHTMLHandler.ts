import { BaseTokenHandler } from "./handlers";
import { TokenType } from "../lexer";
import type { Token } from "../lexer"
import LexerContext from "../context"

export type CalloutType = "default" | "success" | "info" | "warning" | "danger"


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

        const mapping = this.tagMappings[tagName as keyof typeof this.tagMappings];
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
            token.calloutType = (attributes.type as CalloutType) || 'default'
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

        const mapping = this.tagMappings[tagName as keyof typeof this.tagMappings];
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