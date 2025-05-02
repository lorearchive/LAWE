import type { Token } from './lexer.ts';
import { TokenType } from './lexer.ts'

// Define AST node types
export type NodeType = 
  | 'Document'
  | 'Paragraph'
  | 'Header'
  | 'Underline'
  | 'Bold'
  | 'Italic'
  | 'Text'
  | 'InternalLink'
  | 'ExternalLink'
  | 'UnorderedList'
  | 'OrderedList'
  | 'ListItem'
  | 'CodeBlock'
  | 'InlineCode'
  | 'Table'
  | 'TableRow'
  | 'TableCell';

export interface ASTNode {
    type: NodeType;
    children?: ASTNode[];
    value?: string;
    level?: number;
    url?: string;
    text?: string;
    language?: string;
    isHeading?: string
}
// So ASTNode is an object

export class Parser {

    private tokens: Token[];
    private current: number = 0;
  
    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }
  
    public parse(): ASTNode {
        // Create root document node
        const document: ASTNode = {
            type: 'Document',
            children: []
        };
    
        // Parse content until EOF
        while (!this.isAtEnd()) {
            
            try {
                const node = this.parseBlock();
                if (node && document.children) {
                    document.children.push(node);
                }

            } catch (error) {
                console.error('Parser error:', error);
                // Skip to next token and try to recover
                this.advance();
            }
        }
    
        return document;
    }
  
    private parseBlock(): ASTNode | null {
        // Skip whitespace and newlines at the top level
        this.skipWhitespaceAndNewlines() // Super nice function name
    
        if (this.isAtEnd()) {
            return null;
        }
    
        // Check for block-level elements
        if (this.match(TokenType.HEADING)) {
            return this.parseHeader();
        }
        
        // Here we'd handle other block types like lists, code blocks, tables
        
        // Default to paragraph for inline content
        return this.parseParagraph();
    }
  
    private parseHeader(): ASTNode {

        const headerToken = this.previous();
        const level = headerToken.value.length; // Number of = characters (Remember, this is DokuWiki syntax. The less, lower heading level.)
    
        // Consume content until newline
        const children: ASTNode[] = [];


        while (!this.isAtEnd() && !this.check(TokenType.NEWLINE)) {

            const inlineNode = this.parseInline();
            if (inlineNode) {
                children.push(inlineNode);
            }
        }
    
        // Consume the newline
        this.match(TokenType.NEWLINE);
        
        return {
            type: 'Header',
            level,
            children
        };
    }
  
    private parseParagraph(): ASTNode {

        const children: ASTNode[] = [];
    
        // Parse inline content until empty line or EOF
        while (!this.isAtEnd() && !this.isEmptyLine()) {
            
            const inlineNode = this.parseInline();
            if (inlineNode) {
                children.push(inlineNode);
            }
        
            // Handle single newlines within paragraph
            if (this.match(TokenType.NEWLINE) && !this.isEmptyLine()) {
                // Add space in place of single newline
                children.push({ type: 'Text', value: ' ' });
            }
        }
        
        // Consume the double newline that ends the paragraph
        if (this.match(TokenType.NEWLINE)) {
            this.match(TokenType.NEWLINE);
        }
        
        return {
            type: 'Paragraph',
            children
        };
    }
  
    private parseInline(): ASTNode | null {
        // Skip whitespace in inline context
        this.skipWhitespace();
        
        if (this.isAtEnd() || this.check(TokenType.NEWLINE)) {
            return null;
        }
        
        // Handle inline formatting
        if (this.match(TokenType.UNDERLINE_OPEN)) {
            return this.parseUnderline()
        }
        
        if (this.match(TokenType.BOLD_OPEN)) {
            return this.parseBold();
        }
        
        if (this.match(TokenType.ITALIC_OPEN)) {
            return this.parseItalic();
        }
        
        if (this.match(TokenType.INTERNAL_LINK_OPEN)) {
            return this.parseInternalLink();
        }
        
        // Default to text node
        if (this.match(TokenType.TEXT)) {
            return {
                type: 'Text',
                value: this.previous().value
            };
        }
        
        // Skip unhandled tokens
        this.advance();
        return null;
    }

    private parseUnderline(): ASTNode {
        const children: ASTNode[] = [];
        
        // Parse content until underline close tag
        while (!this.isAtEnd() && !this.check(TokenType.UNDERLINE_CLOSE)) {
            const node = this.parseInline();
            if (node) {
                children.push(node);
            }
        }
        
        // Consume the close tag
        this.consume(TokenType.UNDERLINE_CLOSE, "Expected '__' to close bold text");
        
        return {
            type: 'Underline',
            children
        };
    }
  
    private parseBold(): ASTNode {
        const children: ASTNode[] = [];
        
        // Parse content until bold close tag
        while (!this.isAtEnd() && !this.check(TokenType.BOLD_CLOSE)) {
            const node = this.parseInline();
            if (node) {
                children.push(node);
            }
        }
        
        // Consume the close tag
        this.consume(TokenType.BOLD_CLOSE, "Expected '**' to close bold text");
        
        return {
            type: 'Bold',
            children
        };
    }
  
    private parseItalic(): ASTNode {
        const children: ASTNode[] = [];
        
        // Parse content until italic close tag
        while (!this.isAtEnd() && !this.check(TokenType.ITALIC_CLOSE)) {
            const node = this.parseInline();
            if (node) {
                children.push(node);
            }
        }
        
        // Consume the close tag
        this.consume(TokenType.ITALIC_CLOSE, "Expected '//' to close italic text");
        
        return {
            type: 'Italic',
            children
        };
    }
  
    private parseInternalLink(): ASTNode {
        let url = '';
        let text = '';
        
        // Parse URL part
        while (!this.isAtEnd() && !this.check(TokenType.INTERNAL_LINK_CLOSE) && !this.check(TokenType.LINK_TEXT_SEPARATOR)) {
        
            if (this.match(TokenType.TEXT)) {
                url += this.previous().value;
            } else {
                // Skip other tokens
                url += this.advance().value;
            }
        }
        
        // Check for link text
        if (this.match(TokenType.LINK_TEXT_SEPARATOR)) {
        // Parse the text part
            while (!this.isAtEnd() && !this.check(TokenType.INTERNAL_LINK_CLOSE)) {
                if (this.match(TokenType.TEXT)) {
                text += this.previous().value;
                } else {
                // Skip other tokens
                text += this.advance().value;
                }
            }
        } else {
            // Use URL as text if no separator
            text = url;
        }
        
        // Consume the close tag
        this.consume(TokenType.INTERNAL_LINK_CLOSE, "Expected ']]' to close internal link");
        
        return {
            type: 'InternalLink',
            url,
            text
        };
    }
  
  // Helper methods
    private isAtEnd(): boolean {
        return this.current >= this.tokens.length;
    }
  
    private check(type: TokenType): boolean {
        if (this.current >= this.tokens.length) return false;
        
        return this.tokens[this.current].type === type;
    }
    
    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        
        return this.previous();
    }
    
    private consume(type: TokenType, errorMessage: string): Token {
        
        if (this.check(type)) {
            return this.advance();
        }
        
        throw new Error(`${errorMessage} at line ${this.peek().position.line}, column ${this.peek().position.column}`);
    }
    
    private match(type: TokenType): boolean {
        if (this.check(type)) {
        
            this.advance();
            return true;
        }
        
        return false;
    }
  
    private previous(): Token {
        return this.tokens[this.current - 1];
    }
    
    private peek(): Token {
        return this.tokens[this.current];
    }
    
    private skipWhitespace(): void {
        while (this.check(TokenType.WHITESPACE)) {
          // Advance past the whitespace token
          this.advance();
        }
    }
    
    private skipWhitespaceAndNewlines(): void {

        while (true) {
            if (this.match(TokenType.WHITESPACE)) {
                continue;
            }
            
            if (this.match(TokenType.NEWLINE)) {
                continue;
            }
         
            break;
        }
    }
  
    private isEmptyLine(): boolean {
        return this.check(TokenType.NEWLINE) && (this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === TokenType.NEWLINE);
    }
}