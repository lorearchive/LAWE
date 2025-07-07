import { BaseTokenHandler } from "./handlers";
import { TokenType } from "../lexer";
import type { Token } from "../lexer"
import LexerContext from "../context"

export type CalloutType = "default" | "success" | "info" | "warning" | "danger"


export default class PseudoHTMLHandler extends BaseTokenHandler {
    priority = 110; // High priority to catch before other handlers

    private tagMappings = {
        'callout': { open: TokenType.CALLOUT_OPEN, close: TokenType.CALLOUT_CLOSE },
        'sub': { open: TokenType.SUB_OPEN, close: TokenType.SUB_CLOSE },
        'sup': { open: TokenType.SUP_OPEN, close: TokenType.SUP_CLOSE },

        // HTML tables
        'table': { open: TokenType.TABLE_OPEN, close: TokenType.TABLE_CLOSE },
        'thead': { open: TokenType.THEAD_OPEN, close: TokenType.THEAD_CLOSE },
        'tbody': { open: TokenType.TBODY_OPEN, close: TokenType.TBODY_CLOSE },
        'tfoot': { open: TokenType.TFOOT_OPEN, close: TokenType.TFOOT_CLOSE },
        'tr': { open: TokenType.TR_OPEN, close: TokenType.TR_CLOSE },
        'td': { open: TokenType.TD_OPEN, close: TokenType.TD_CLOSE },
        'th': { open: TokenType.TH_OPEN, close: TokenType.TH_CLOSE },
    };

    private voidTagMappings = {
        'affili': TokenType.AFFILI
    };

    canHandle(context: LexerContext): boolean {
        if (context.peek() !== '<') return false;

        // Check for closing tag: </tagname>
        if (context.peek(1) === '/') {
            return this.isValidClosingTag(context);
        }

        // Check for void tag: <tagname />
        if (this.isValidVoidTag(context)) {
            return true;
        }

        // Check for opening tag: <tagname ...>
        return this.isValidOpeningTag(context);
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        if (context.peek(1) === '/') {
            return this.handleClosingTag(context, tokens, tokenStack);
        
        } else if (this.isValidVoidTag(context)) {
            return this.handleVoidTag(context, tokens);
        
        } else {
            return this.handleOpeningTag(context, tokens, tokenStack);
        }
    }

    private isValidVoidTag(context: LexerContext): boolean {
        if (context.peek() !== '<') return false;

        let pos = 1; // skip '<'
        let tagName = '';

        while (pos < context.input.length - context.position) {
            const char = context.peek(pos);
            if (char === ' ' || char === '/' || char === '\n') break;
            if (/[a-zA-Z]/.test(char)) {
                tagName += char;
                pos++;
            } else {
                return false;
            }
        }

        if (!this.voidTagMappings.hasOwnProperty(tagName)) return false;

        // Now scan forward for '/>' skipping attributes
        let inQuotes = false;
        while (pos < context.input.length - context.position) {
            const char = context.peek(pos);

            if (char === '"') {
                inQuotes = !inQuotes;
                pos++;
                continue;
            }

            if (!inQuotes && char === '/' && context.peek(pos + 1) === '>') {
                return true;
            }

            pos++;
        }

        return false;
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

        const mapping = this.tagMappings[tagName as keyof typeof this.tagMappings]
        let attributes: { [key: string]: string } = {};
        attributes = this.filterAllowedAttributes(tagName, this.parseAttributes(context))


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
            
        token.attributes = attributes

        tokens.push(token);
        tokenStack.push(mapping.open);
        
        return true
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

    private handleVoidTag(context: LexerContext, tokens: Token[]): boolean {
        const startPos = context.position;
        context.advance(1); // Skip '<'

        // Parse tag name
        let tagName = '';
        while (!context.isEOF() && /[a-zA-Z]/.test(context.peek())) {
            tagName += context.advance();
        }

        if (!this.voidTagMappings.hasOwnProperty(tagName)) {
            context.position = startPos;
            return false;
        }

        const tokenType = this.voidTagMappings[tagName as keyof typeof this.voidTagMappings];
        let attributes: { [key: string]: string } = {};
        attributes = this.filterAllowedAttributes(tagName, this.parseAttributes(context));

        // Skip to '/>'
        while (!context.isEOF() && context.peek() !== '/') {
            context.advance();
        }

        if (context.peek() === '/') {
            context.advance(); // Skip '/'
            if (context.peek() === '>') {
                context.advance(); // Skip '>'
            }
        }

        // Create the full tag string
        const fullTag = context.input.slice(startPos, context.position);
        
        // Create token with attributes
        const token = context.createToken(tokenType, fullTag);
        token.attributes = attributes;

        tokens.push(token);
        // Note: We don't push to tokenStack since void tags don't need closing
        
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
        return attributes
    }


    private filterAllowedAttributes(tag: string, attributes: Record<string, string>): Record<string, string> {
        
        const allowedAttributes: Record<string, Set<string>> = {
            'callout': new Set(['type', 'title']),
            'table': new Set(['class']),
            'th': new Set(['class', 'align', 'colspan']),
            'td': new Set(['class', 'align', 'colspan']),
            'tr': new Set(['class']),
            'thead': new Set(['class']),
            'tbody': new Set(['class']),

            'affili': new Set(['class', 'name', 'school', 'fAppear']), //fAppear: first appearance 
        }

        const allowed = allowedAttributes[tag];
        if (!allowed) return {};

        const result: Record<string, string> = {};
        for (const [key, value] of Object.entries(attributes)) {
            if (allowed.has(key)) {
                result[key] = this.sanitizeAttributeValue(value);
            }
        }
        return result;
    }

    private sanitizeAttributeValue(value: string): string {
        // Remove dangerous protocols
        if (/^javascript:/i.test(value)) return '';

        // Escape quotes & angle brackets
        return this.escapeHTML(value) 
    }

    private escapeHTML(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}