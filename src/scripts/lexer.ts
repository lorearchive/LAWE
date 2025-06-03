// adding a new syntax ( a note for me )

//1. start from the lexer
//2. edit the enum TokenType to accomodate this new syntax
//3. check the while loop inside the tokenise function. add an if clause for the new syntax
//4. add the new char to isSpecialCharacter
//5. advance to parser


export enum TokenType {
    TEXT = 'TEXT',
    BOLD_OPEN = "BOLD_OPEN",
    BOLD_CLOSE = "BOLD_CLOSE",
    ITALIC_OPEN = "ITALIC_OPEN",
    ITALIC_CLOSE = "ITALIC_CLOSE",
    UNDERLINE_OPEN = "UNDERLINE_OPEN",
    UNDERLINE_CLOSE = "UNDERLINE_CLOSE",

    HEADING_OPEN = "HEADING_OPEN", // ==, ==, ===, ====, =====, ====== or smth basically think them as a open/close tag
    HEADING_CLOSE = "HEADING_CLOSE",

    HORIZ_RULE = "HORIZ_RULE", // horizontal rule <hr />
    LINEBREAK = "LINEBREAK", // forced linebreak \\

    CALLOUT_OPEN = "CALLOUT_OPEN", // <callout ...>
    CALLOUT_CLOSE = "CALLOUT_CLOSE", // </callout>

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
    calloutType?: string
    calloutTitle?: string
}

export default class Lexer {

    private input: string = ''
    private position = 0
    private line = 1
    private col = 1

    constructor() {
    }

    private reset() {
        this.position = 0
        this.line = 1
        this.col = 1
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

    private createToken(type: TokenType, value: string, calloutType?: string, calloutTitle?: string) {

        return {
            type,
            value,
            position: { line: this.line, col: this.col - value.length},
            calloutType,
            calloutTitle
        }
    }
    // Concat type and value into one object

    public tokenise(input: string): Token[] {
        //bri' ish
        
        // Set the input and reset position tracking
        this.input = input
        this.reset()
        
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

            // Check for callout tags
            if (this.peek() === '<') {
                // Check for opening callout tag
                if (this.matchString('<callout')) {
                    const result = this.parseCalloutOpen();
                    if (result) {
                        tokens.push(this.createToken(TokenType.CALLOUT_OPEN, result.value, result.type, result.title));
                        tokenStack.push(TokenType.CALLOUT_OPEN);
                        continue;
                    }
                }
                
                // Check for closing callout tag
                if (this.matchString('</callout>')) {
                    this.advance(10); // Move past "</callout>"
                    tokens.push(this.createToken(TokenType.CALLOUT_CLOSE, '</callout>'));
                    
                    // Remove the most recent callout open token from the stack
                    const index = tokenStack.lastIndexOf(TokenType.CALLOUT_OPEN);
                    if (index !== -1) {
                        tokenStack.splice(index, 1);
                    }
                    continue;
                }
            }

            // check for heading - look for equal signs at start of line
            if ((this.position === 0 || this.input[this.position - 1] === "\n") && this.peek() === "=") {
                let level = 0
            
                while(this.peek() === "=") {
                    level++
                    this.advance()
                }
                
                const delim = "=".repeat(level)
                tokens.push(this.createToken(TokenType.HEADING_OPEN, delim))
                tokenStack.push(TokenType.HEADING_OPEN)
                
                continue
            }

            // Check for heading close - look for equal signs that match an open heading
            if (this.peek() === "=") {
                // First check if we have an unclosed heading tag
                const hasOpenHeading = tokenStack.includes(TokenType.HEADING_OPEN);
                
                if (hasOpenHeading) {
                    let count = 0;
                    let pos = this.position;
                    
                    // Count consecutive equals signs
                    while (pos < this.input.length && this.input[pos] === "=") {
                        count++;
                        pos++;
                    }
                    
                    // If we have a sequence of equals signs, treat it as a closing tag
                    if (count > 0) {
                        const delim = "=".repeat(count);
                        this.advance(count); // Move past the equals signs
                        
                        tokens.push(this.createToken(TokenType.HEADING_CLOSE, delim));
                        
                        // Remove the most recent heading open token from the stack
                        const index = tokenStack.lastIndexOf(TokenType.HEADING_OPEN);
                        if (index !== -1) {
                            tokenStack.splice(index, 1);
                        }
                        
                        continue;
                    }
                }
            }

            // Check for linebreak
            if (this.peek() === '\\' && this.peek(1) === '\\') {
                
                this.advance(2) // Move past the two backslashes
                
                // Check if followed by whitespace or end of line (following DokuWiki spec)
                if (this.isEOF() || /\s/.test(this.peek())) {
                    tokens.push(this.createToken(TokenType.LINEBREAK, "\\\\"))
                    continue
                } else {
                    // If not followed by whitespace/EOL, treat as regular text
                    // Move back and let it be handled as text
                    this.position -= 2
                    this.col -= 2
                }
            }

            // check for horizontal rule
            if (
                this.peek() === "-" &&
                this.peek(1) === "-" &&
                this.peek(2) === "-" &&
                this.peek(3) === "-" &&
                this.peek(4) !== "-"
            ) {
                this.advance(4)
                tokens.push(this.createToken(TokenType.HORIZ_RULE, "----"))
                continue
            }

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

                if (this.peek() === '\n') {
                    tokens.push(this.createToken(TokenType.NEWLINE, this.advance()));
                } else {
                    tokens.push(this.createToken(TokenType.NEWLINE, this.advance(2)));
                }
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

    private matchString(str: string): boolean {
        for (let i = 0; i < str.length; i++) {
            if (this.peek(i) !== str[i]) {
                return false;
            }
        }
        return true;
    }

    private parseCalloutOpen(): { value: string, type: string, title?: string } | null {
        const startPos = this.position;
        
        // Move past "<callout"
        this.advance(8);
        
        // Skip whitespace
        while (!this.isEOF() && /\s/.test(this.peek())) {
            this.advance();
        }
        
        let calloutType = 'default';
        let calloutTitle: string | undefined;
        
        // Parse attributes
        while (!this.isEOF() && this.peek() !== '>') {
            // Skip whitespace
            while (!this.isEOF() && /\s/.test(this.peek())) {
                this.advance();
            }
            
            if (this.peek() === '>') break;
            
            // Parse attribute name
            let attrName = '';
            while (!this.isEOF() && /[a-zA-Z]/.test(this.peek())) {
                attrName += this.advance();
            }
            
            // Skip whitespace and '='
            while (!this.isEOF() && (/\s/.test(this.peek()) || this.peek() === '=')) {
                this.advance();
            }
            
            // Parse attribute value (with or without quotes)
            let attrValue = '';
            if (this.peek() === '"') {
                this.advance(); // Skip opening quote
                while (!this.isEOF() && this.peek() !== '"') {
                    attrValue += this.advance();
                }
                this.advance(); // Skip closing quote
            } else {
                while (!this.isEOF() && !/\s/.test(this.peek()) && this.peek() !== '>') {
                    attrValue += this.advance();
                }
            }
            
            // Store the attribute
            if (attrName === 'type') {
                const validTypes = ['default', 'info', 'warning', 'danger', 'success'];
                if (validTypes.includes(attrValue)) {
                    calloutType = attrValue;
                }
            } else if (attrName === 'title') {
                calloutTitle = attrValue;
            }
        }
        
        // Consume the '>'
        if (this.peek() === '>') {
            this.advance();
        } else {
            // Invalid callout tag, reset position
            this.position = startPos;
            this.col = 1; // Simplified col tracking for this case
            return null;
        }
        
        const fullTag = this.input.slice(startPos, this.position);
        return { value: fullTag, type: calloutType, title: calloutTitle };
    }

    private isSpecialCharacter(char: string): boolean {
        // Check if the character is part of special syntax
        return ['_', '*', '/', '[', ']', '=', '\n', '|', '-', '`', '\\', '<'].includes(char);
    }

}