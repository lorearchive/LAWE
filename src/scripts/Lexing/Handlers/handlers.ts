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

export class LinkHandler extends BaseTokenHandler {
    priority = 85; // High priority, should come before text handler but after image

    // Pre-compiled regex patterns for optimization
    private static readonly EXTERNAL_URL_REGEX = /^https?:\/\//;
    private static readonly INTERNAL_LINK_REGEX = /^[a-zA-Z0-9_\-\/:#]+$/;
    private static readonly NAMESPACE_CHAR_REGEX = /[a-zA-Z0-9_\-\/:#]/;
    private static readonly WIKI_PREFIX_REGEX = /^([a-z]+)>(.+)$/;

    private static readonly WIKI_PREFIXES: Record<string, { baseUrl: string, pathTemplate: string }> = {
        'wp': { 
            baseUrl: 'https://en.wikipedia.org', 
            pathTemplate: '/wiki/{id}' 
        },
        'yt': { 
            baseUrl: 'https://www.youtube.com', 
            pathTemplate: '/watch?v={id}' 
        }
        // we can add more websites here later
    }


    canHandle(context: LexerContext): boolean {
        if (context.peek() === '[' && context.peek(1) === '[') {
            return true;
        }
        
        if (context.peek() === ']' && context.peek(1) === ']') {
            return true;
        }
        
        if (context.peek() === '|') {
            return true;
        }
        
        return false;
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        if (context.peek() === '[' && context.peek(1) === '[') {
            return this.handleLinkOpen(context, tokens, tokenStack);
        }
        
        if (context.peek() === ']' && context.peek(1) === ']' && 
            this.hasOpenLink(tokenStack)) {
            return this.handleLinkClose(context, tokens, tokenStack);
        }

        if (context.peek() === '|' && this.hasOpenLink(tokenStack)) {
            return this.handleLinkPipe(context, tokens, tokenStack);
        }

        return false;
    }

    private handleLinkOpen(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        context.advance(2); // Skip '[['
        tokens.push(context.createToken(TokenType.LINK_OPEN, '[['));
        tokenStack.push(TokenType.LINK_OPEN);
        return true;
    }

    private handleLinkClose(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        context.advance(2); // Skip ']]'
        tokens.push(context.createToken(TokenType.LINK_CLOSE, ']]'));
        
        // Remove the corresponding open tag from stack
        const index = this.findLastUnclosedOpenTag(tokenStack, TokenType.LINK_OPEN, TokenType.LINK_CLOSE);
        if (index !== -1) {
            tokenStack.splice(index, 1);
        }
        
        return true;
    }

    private handleLinkPipe(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        context.advance(1); // Skip '|'
        tokens.push(context.createToken(TokenType.LINK_PIPE, '|'));
        return true;
    }

    private hasOpenLink(tokenStack: TokenType[]): boolean {
        return tokenStack.includes(TokenType.LINK_OPEN);
    }

    /**
     * Utility method to validate and categorize link types
     * This can be used by the parser to determine link behavior
     */
    static validateLinkTarget(target: string): {
        isValid: boolean;
        type: 'external' | 'internal' | 'anchor';
        namespace?: string;
        page?: string;
        anchor?: string;
        interwikiDest?: string // destination website for interwiki links
        interwikiId?: string   // id for website for interwiki links
        error?: string;
    } {
        if (!target || target.trim().length === 0) {
            return { isValid: false, type: 'internal', error: 'Empty link target' };
        }

        const trimmed = target.trim();

        const wikiMatch = trimmed.match(LinkHandler.WIKI_PREFIX_REGEX);
        if (wikiMatch) {
            const [, prefix, id] = wikiMatch;
            const wikiConfig = LinkHandler.WIKI_PREFIXES[prefix.toLowerCase()];
            
            if (!wikiConfig) {
                return { isValid: false, type: 'external', error: `Unknown wiki prefix: ${prefix}` };
            }
            
            if (!id || id.trim().length === 0) {
                return { isValid: false, type: 'external', error: `Empty ${prefix} identifier` };
            }
            
            return {
                isValid: true,
                type: 'external',
                interwikiDest: prefix,
                interwikiId: id.trim()
            };
        }


        // External link (http/https)
        if (LinkHandler.EXTERNAL_URL_REGEX.test(trimmed)) {
            return {
                isValid: true,
                type: 'external'
            };
        }

        // Anchor-only link (starts with #)
        if (trimmed.startsWith('#')) {
            const anchor = trimmed.slice(1);
            if (anchor.length === 0) {
                return { isValid: false, type: 'anchor', error: 'Empty anchor' };
            }
            return {
                isValid: true,
                type: 'anchor',
                anchor: anchor
            };
        }

        // Internal link validation
        if (!LinkHandler.INTERNAL_LINK_REGEX.test(trimmed)) {
            return { isValid: false, type: 'internal', error: 'Invalid characters in internal link' };
        }

        // Parse internal link with potential anchor
        const [linkPart, anchor] = trimmed.split('#', 2);
        
        // Parse namespace and page
        const parts = linkPart.split('/');
        let namespace = '';
        let page = '';

        if (parts.length === 1) {
            page = parts[0];
        } else {
            namespace = parts.slice(0, -1).join('/');
            page = parts[parts.length - 1];
        }

        // Validate page name isn't empty (but namespace can be)
        if (!page && !anchor) {
            return { isValid: false, type: 'internal', error: 'Missing page name' };
        }

        return {
            isValid: true,
            type: 'internal',
            namespace: namespace || undefined,
            page: page || undefined,
            anchor: anchor || undefined
        };
    }

    /**
     * Utility method to normalize internal link paths
     * Only handles absolute paths - no relative link support
     */
    static normalizeInternalLink(target: string): string {
        const validation = LinkHandler.validateLinkTarget(target);
        
        if (!validation.isValid || validation.type !== 'internal') {
            return target;
        }

        let normalized = target.trim();

        // Remove leading slash for consistency
        if (normalized.startsWith('/')) {
            normalized = normalized.slice(1);
        }

        // Clean up double slashes
        normalized = normalized.replace(/\/+/g, '/');

        return normalized;
    }

    /**
     * Generates the actual URL for interwiki links
     */
    static generateInterwikiUrl(prefix: string, id: string): string | null {
        const wikiConfig = LinkHandler.WIKI_PREFIXES[prefix.toLowerCase()];
        if (!wikiConfig) {
            return null;
        }
        return wikiConfig.baseUrl + wikiConfig.pathTemplate.replace('{id}', encodeURIComponent(id));
    }
}

export class ImageHandler extends BaseTokenHandler {
    priority = 80; // High priority, should come before text handler

    canHandle(context: LexerContext): boolean {
        // Can handle opening braces
        if (context.peek() === '{' && context.peek(1) === '{') {
            return true;
        }
        
        // Can handle closing braces if we're inside an image
        if (context.peek() === '}' && context.peek(1) === '}') {
            return true; // we check the stack in handle()
        }
        
        // Can handle pipe if we're inside an image
        if (context.peek() === '|') {
            return true; // we also check the stack in handle()
        }
        
        return false;
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        // Check if we're at the start of an image tag
        if (context.peek() === '{' && context.peek(1) === '{') {
            return this.handleImageOpen(context, tokens, tokenStack);
        }
        
        // Check if we're at the end of an image tag
        if (context.peek() === '}' && context.peek(1) === '}' && 
            tokenStack.includes(TokenType.IMAGE_OPEN)) {
            return this.handleImageClose(context, tokens, tokenStack);
        }

        // Handle pipe separator within image tag
        if (context.peek() === '|' && tokenStack.includes(TokenType.IMAGE_OPEN)) {
            return this.handleImagePipe(context, tokens, tokenStack);
        }

        return false;
    }

    private handleImageOpen(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        context.advance(2); // Skip '{{'
        tokens.push(context.createToken(TokenType.IMAGE_OPEN, '{{'));
        tokenStack.push(TokenType.IMAGE_OPEN);
        return true;
    }

    private handleImageClose(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        context.advance(2); // Skip '}}'
        tokens.push(context.createToken(TokenType.IMAGE_CLOSE, '}}'));
        
        // Remove the corresponding open tag from stack
        const index = tokenStack.lastIndexOf(TokenType.IMAGE_OPEN);
        if (index !== -1) {
            tokenStack.splice(index, 1);
        }
        
        return true;
    }

    private handleImagePipe(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        context.advance(1); // Skip '|'
        tokens.push(context.createToken(TokenType.IMAGE_PIPE, '|'));
        return true;
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

    private specialChars = ['_', '*', '/', '[', ']', '=', '\n', '|', '-', '`', '\\', '<', '{', '}']

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