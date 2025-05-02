

    export enum TokenType {
        TEXT = 'TEXT',
        BOLD_OPEN = "BOLD_OPEN",
        BOLD_CLOSE = "BOLD_CLOSE",
        ITALIC_OPEN = "ITALIC_OPEN",
        ITALIC_CLOSE = "ITALIC_CLOSE",
        UNDERLINE_OPEN = "UNDERLINE_OPEN",
        UNDERLINE_CLOSE = "UNDERLINE_CLOSE",

        NEWLINE = "NEWLINE",
        WHITESPACE = "WHITESPACE",

        EOF = "EOF" // End of file
    }


    export interface Token {
        type: TokenType
        value: string
        position: {
            line: number
            col: number
        }
    }

    export default class Lexer {

        private input: string
        private position = 0
        private line = 1
        private col = 1


        constructor(input: string) {
            this.input = input
        }

        private isEOF(): boolean {
            return this.position >= this.input.length
        }

        private peek(lookahead: number = 0): string {

            if (this.position + lookahead >= this.input.length) {
                return ''
            }

            return this.input[this.position + lookahead]
        }
        // This method is pretty important as it lets the lexer cursor to "look ahead". Like looking for a clsing tag.
        // When used just like this.peek(), it shows the next char from lexer cursor


        private advance(count: number = 1) {
            const char = this.peek()

            this.position += count

            if (char === "\n") {
                this.line++
                this.col = 1
            } else {
                this.col += count
            }

            return char
        }
        // This moves the lexer cursor.
        // The lexer evals one char at a time so if peek() is like a time traveller advance() is like u (not a time traveller)

        private createToken(type: TokenType, value: string) {

            return {
                type,
                value,
                position: { line: this.line, col: this.col - value.length}
            }
        }
        // Concat type and value into one object

        public tokenise(): Token[] {
            //bri' ish
            
            const tokens: Token[] = []          // The tokens (object) will be pushed into here as the lexer evaluates the text
            const tokenStack: TokenType[] = []  // Stack to track nested tokens

            function findLastUnclosedOpenTag(openTag: TokenType, closeTag: TokenType): number {
                
                let closeCount = 0

                for (let i = tokenStack.length - 1; i >= 0; i--) {
                    
                    if (tokenStack[i] === closeTag) {
                        closeCount++

                    } else if (tokenStack[i] === openTag) {

                        if (closeCount === 0) {
                            return i
                        }

                        closeCount--
                    }
                }
                return -1
            }


            while(!this.isEOF()) {

                // Check for underline
                if (this.peek() === "_" && this.peek(1) === "_") {
                    
                    this.advance(2) // Moves the evaulator (cursor) by two spaces (because __ is two chars)

                    const type = findLastUnclosedOpenTag(TokenType.UNDERLINE_OPEN, TokenType.UNDERLINE_CLOSE) === -1
                        ? TokenType.UNDERLINE_OPEN
                        : TokenType.UNDERLINE_CLOSE

                    tokens.push(this.createToken(type, "__"))

                    if (type === TokenType.UNDERLINE_OPEN) {
                        tokenStack.push(TokenType.UNDERLINE_OPEN)
                    } else {
                        tokenStack.pop()
                    }

                    continue
                }

                // Check for italic
                if (this.peek() === '/' && this.peek(1) === '/') {

                    this.advance(2); 
                    
                    const type = findLastUnclosedOpenTag(TokenType.ITALIC_OPEN, TokenType.ITALIC_CLOSE) === -1
                        ? TokenType.ITALIC_OPEN
                        : TokenType.ITALIC_CLOSE
                        
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
                    const type = findLastUnclosedOpenTag(TokenType.BOLD_OPEN, TokenType.BOLD_CLOSE) === -1
                        ? TokenType.BOLD_OPEN
                        : TokenType.BOLD_CLOSE
                        
                    tokens.push(this.createToken(type, '**'));

                    if (type === TokenType.BOLD_OPEN) {
                        tokenStack.push(TokenType.BOLD_OPEN)
                    } else {
                        tokenStack.pop()
                    }
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

            // Add EOF token when while loop fails
            tokens.push(this.createToken(TokenType.EOF, ''));

            return tokens
        }

        private isSpecialCharacter(char: string): boolean {
            // Check if the character is part of special syntax
            return ['_', '*', '/', '[', ']', '=', '\n', '|', '-', '`'].includes(char);
        }

    }