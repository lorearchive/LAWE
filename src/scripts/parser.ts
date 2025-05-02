import type { Token } from "./lexer";
import { TokenType } from "./lexer";

export type NodeType = 
    | 'Document'
    | 'Paragraph'
    | 'Underline'
    | 'Bold'
    | 'Italic'
    | 'Text'


export interface ASTNode {
    type: NodeType
    children?: ASTNode[]
    value?: string
    level?: number
    url?: string
    text?: string
    lang?: string
    isHeading?: string
}

export default class Parser {

    private tokens: Token[]
    private current: number = 0

    constructor(tokens: Token[]) {
        this.tokens = tokens
    }

    public parse(): ASTNode {

        //root document node
        const document: ASTNode = {
            type: 'Document',
            children: []
        }

        // Parse until EOF
        while(!this.isAtEnd()) {

            try {
                const node = this.parseBlock()

                if (node && document.children) {
                    document.children.push(node)
                }
            } catch (e) {
                console.error('Parser error:', e)
                // Skip to next token and try to recover
                this.advance();
            }
        }

        return document
    }

    private parseBlock(): ASTNode | null {
        // parse block-level stuff

        // Skip whitespace and newlines at the top level
        this.skipWhitespaceAndNewlines() // Super nice function name

        if (this.isAtEnd()) {
            return null
        }

        // Here youwould check for other block level elements

        // Default to paragraph for inline content
        return this.parseParagraph();
    }

    private parseParagraph(): ASTNode {
       
        const children = this.parseInlineUntil(TokenType.NEWLINE);
    
        // match eats the newline
        if (this.match(TokenType.NEWLINE)) {
            this.match(TokenType.NEWLINE);
        }
    
        return {
            type: 'Paragraph',
            children
        };
    }
    

    private parseInlineUntil(terminator: TokenType|null = null): ASTNode[] {
        
        const children: ASTNode[] = [];
    
        while (!this.isAtEnd() && !(terminator && this.check(terminator))) {
            
            if (this.match(TokenType.WHITESPACE)) {
                children.push({ type: "Text", value: " " })
                continue
            }
            
            if (this.match(TokenType.UNDERLINE_OPEN)) {
                children.push(this.parseUnderline());

            } else if (this.match(TokenType.BOLD_OPEN)) {
                children.push(this.parseBold());

            } else if (this.match(TokenType.ITALIC_OPEN)) {
                children.push(this.parseItalic());

            } else if (this.match(TokenType.TEXT)) {
                children.push({ type: 'Text', value: this.previous().value });

            } else {
                // if unrecognized just skip it
                this.advance();
            }
        }
    
        return children;
    }
  


    private parseUnderline(): ASTNode {

        const children = this.parseInlineUntil(TokenType.UNDERLINE_CLOSE);
      
        // consume the closing delimiter
        this.consume(TokenType.UNDERLINE_CLOSE, "Expected '__' to close underline");
      
        return {
            type: 'Underline',
            children
        };
    }
      
    private parseBold(): ASTNode {

        const children = this.parseInlineUntil(TokenType.BOLD_CLOSE);
      
        // consume the closing delimiter
        this.consume(TokenType.BOLD_CLOSE, "Expected '**' to close bold text");
      
        return {
            type: 'Bold',
            children
        };
    }

    private parseItalic(): ASTNode {

        const children = this.parseInlineUntil(TokenType.ITALIC_CLOSE);
      
        // consume the closing delimiter
        this.consume(TokenType.ITALIC_CLOSE, "Expected '//' to close italic");
      
        return {
            type: 'Italic',
            children
        };
    }




    // --------------------------- HELPER METHODS

    private isAtEnd(): boolean {

        return this.current >= this.tokens.length
            || this.tokens[this.current].type === TokenType.EOF

    }

    private check(type: TokenType): boolean {
        
        if (this.current >= this.tokens.length) return false

        return this.tokens[this.current].type === type
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++

        return this.previous()
    }

    private consume(type: TokenType, errMsg: string): Token {

        if (this.check(type)) {
            return this.advance()
        }

        throw new Error(`${errMsg} at line ${this.peek().position.line}, col ${this.peek().position.col}`)
    }

    private match(type: TokenType): boolean {

        if (this.check(type)) {

            this.advance()
            return true
        }
        return false
    }

    private previous(): Token {
        return this.tokens[this.current - 1]
    }

    private peek(): Token {
        return this.tokens[this.current]
    }

    private skipWhitespace(): void {

        while (this.check(TokenType.WHITESPACE)) {
        
            this.advance()
        }
    }

    private skipWhitespaceAndNewlines(): void {
        while (true) {
            if (this.match(TokenType.WHITESPACE)) {
                continue
            }

            if (this.match(TokenType.NEWLINE)) {
                continue
            }

            break
        }
    }

    //private isEmptyLine(): boolean {
    //    return this.check(TokenType.NEWLINE) && (this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === TokenType.NEWLINE)

    //}


    
}