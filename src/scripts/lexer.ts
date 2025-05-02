// Lexer for Lore Archive Wiki syntax. Somewhat backwards-compatible with DokuWiki syntax.

export enum TokenType {

    // Basic
    TEXT = 'TEXT',
    BOLD_OPEN = 'BOLD_OPEN',    // **
    BOLD_CLOSE = 'BOLD_CLOSE',  // **
    ITALIC_OPEN = 'ITALIC_OPEN',  // //
    ITALIC_CLOSE = 'ITALIC_CLOSE', // //
    UNDERLINE_OPEN = 'UNDERLINE_OPEN', // __
    UNDERLINE_CLOSE = 'UNDERLINE_CLOSE', // __
     
    // Headers
    HEADING = 'HEADING',  // =, ==, ===, etc.
    
    // LinksW
    INTERNAL_LINK_OPEN = 'INTERNAL_LINK_OPEN',  // [[
    INTERNAL_LINK_CLOSE = 'INTERNAL_LINK_CLOSE', // ]]
    EXTERNAL_LINK_OPEN = 'EXTERNAL_LINK_OPEN',   // {{
    EXTERNAL_LINK_CLOSE = 'EXTERNAL_LINK_CLOSE', // }}
    LINK_TEXT_SEPARATOR = 'LINK_TEXT_SEPARATOR', // |
    
    // Lists
    UNORDERED_LIST_ITEM = 'UNORDERED_LIST_ITEM', // -
    ORDERED_LIST_ITEM = 'ORDERED_LIST_ITEM',    // -#
    
    // Code
    CODE_BLOCK_OPEN = 'CODE_BLOCK_OPEN',    // ```
    CODE_BLOCK_CLOSE = 'CODE_BLOCK_CLOSE',  // ```
    CODE_INLINE = 'CODE_INLINE',            // ``
    
    // Tables
    TABLE_ROW_START = 'TABLE_ROW_START',    // ^
    TABLE_CELL_SEPARATOR = 'TABLE_CELL_SEPARATOR', // |
    
    // Misc
    NEWLINE = 'NEWLINE',
    WHITESPACE = 'WHITESPACE',
    
    
    EOF = 'EOF' // End of file
}
  
// Define token structure
export interface Token {
    type: TokenType;
    value: string;
    position: {
        line: number;
        column: number;
    };
}
  
export class Lexer {
    private input: string;
    private position: number = 0;
    private line: number = 1;
    private column: number = 1;
    
    constructor(input: string) {
        this.input = input;
    }
    
    private isEOF(): boolean {
        return this.position >= this.input.length;
    }
    
    private peek(lookahead: number = 0): string {
        if (this.position + lookahead >= this.input.length) {
            return '';
        }
        return this.input[this.position + lookahead];
    }
    // The peek method is pretty important as it lets you "look ahead". Like looking for a closing tag.
    
    private advance(count: number = 1): string {
        const char = this.peek();
        this.position += count;
        
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column += count;
        }
        
        return char;
    }
    // The lexer evaluates text one char at a time. If peek() is like a time traveller knowing what comes next,
    // advance() is actually moving towards the future to find out. If that makes sense.
    
    private createToken(type: TokenType, value: string): Token {
        return {
            type,
            value,
            position: { line: this.line, column: this.column - value.length }
        };
    }
    
    public tokenize(): Token[] {

        const tokens: Token[] = []; // The tokens will be pushed into here as the lexer evaluates the text
        const tokenStack: TokenType[] = [] // Stack to track nested tokens
        
        while (!this.isEOF()) {

            // Check for underline
            if (this.peek() === "_" && this.peek(1) === "_") {
                
                this.advance(2) // Moves the evaulator (cursor) by two spaces (because __ is two chars)

                const type = tokenStack.length > 0 && tokenStack[tokens.length - 1] === TokenType.UNDERLINE_OPEN
                    ? TokenType.UNDERLINE_CLOSE
                    : TokenType.UNDERLINE_OPEN;

                tokens.push(this.createToken(type, "__"))

                if (type === TokenType.UNDERLINE_OPEN) {
                    tokenStack.push(TokenType.UNDERLINE_OPEN)
                } else {
                    tokenStack.pop()
                }

                continue;
            }

            // Check for italic
            if (this.peek() === '/' && this.peek(1) === '/') {

                this.advance(2); 
                
                const type = tokenStack.length > 0 && tokenStack[tokens.length - 1] === TokenType.ITALIC_OPEN 
                    ? TokenType.ITALIC_CLOSE 
                    : TokenType.ITALIC_OPEN;
                    
                tokens.push(this.createToken(type, '//'));

                if (type === TokenType.ITALIC_OPEN) {
                    tokenStack.push(TokenType.ITALIC_OPEN)
                } else {
                    tokenStack.pop()
                }

                continue;
            }

            // Check for Bold
            if (this.peek() === '*' && this.peek(1) === '*') {
            
                this.advance(2); 
                
                // Check if it's opening or closing based on context
                const type = tokenStack.length > 0 && tokenStack[tokenStack.length - 1] === TokenType.BOLD_OPEN 
                    ? TokenType.BOLD_CLOSE 
                    : TokenType.BOLD_OPEN;
                    
                tokens.push(this.createToken(type, '**'));

                if (type === TokenType.BOLD_OPEN) {
                    tokenStack.push(TokenType.BOLD_OPEN)
                } else {
                    tokenStack.pop()
                }
                continue;
            }
            
            
            
            // Check for internal links
            if (this.peek() === '[' && this.peek(1) === '[') {
                this.advance(2);

                // No check for opening/closing because you can tell if it is an opening or closing! Look at the string!

                tokens.push(this.createToken(TokenType.INTERNAL_LINK_OPEN, '[['));

                continue;
            }
            
            if (this.peek() === ']' && this.peek(1) === ']') {
                this.advance(2);
                tokens.push(this.createToken(TokenType.INTERNAL_LINK_CLOSE, ']]'));
                continue;
            }
            
            // Heading - look for equals signs at start of line
            if ((this.position === 0 || this.input[this.position - 1] === '\n') && this.peek() === '=') {

                let headerValue = '';
                
                while (this.peek() === '=') {
                    headerValue += this.advance();
                }
                
                tokens.push(this.createToken(TokenType.HEADING, headerValue));
                continue;
            }
            
            // Newline
            if (this.peek() === '\n') {
                tokens.push(this.createToken(TokenType.NEWLINE, this.advance()));
                continue;
            }
            
            // Whitespace
            if (/\s/.test(this.peek())) {
            
                let whitespace = '';
                while (!this.isEOF() && /\s/.test(this.peek()) && this.peek() !== '\n') {
                    whitespace += this.advance();
                }

                tokens.push(this.createToken(TokenType.WHITESPACE, whitespace));
                continue;
            }
            
            // Text - collect until we hit a special character or token
            let text = '';

            while (!this.isEOF() && !(/\s/.test(this.peek())) && !this.isSpecialCharacter(this.peek())) {
                text += this.advance();
            }
            
            if (text) {
                tokens.push(this.createToken(TokenType.TEXT, text));
                continue;
            }
            
            // If we reach here, advance one character as unrecognized text
            tokens.push(this.createToken(TokenType.TEXT, this.advance()));
        }
        
        // Add EOF token
        tokens.push(this.createToken(TokenType.EOF, ''));
        
        return tokens;
    }
    
    private isSpecialCharacter(char: string): boolean {
        // Check if the character is part of special syntax
        return ['*', '/', '[', ']', '=', '\n', '|', '-', '`'].includes(char);
    }
  }