// adding a new syntax ( a note for me ) continued from lexer
//6. add the new syntax to NodeType
//7. If required, add a value to ASTNode interface
//8. If the new syntax is a block level element, add syntax to parseBlock(). if inline, add syntax to parseInlineUntil().
//9. Add the corresponding parse function.
//10. proceed to renderer



import type { Token } from "./lexer";
import { TokenType } from "./lexer";

export type NodeType = 
    | 'Document'
    | 'Paragraph'
    | 'Heading'
    | 'Underline'
    | 'Bold'
    | 'Italic'
    | 'Text'
    | 'Rule'
    | 'Linebreak'


export interface ASTNode {
    type: NodeType
    children?: ASTNode[]
    value?: string
    level?: number
    url?: string
    text?: string
    ID?: string // used for headings to generate a unique ID for every heading.
}

export default class Parser {

    private tokens: Token[] = []
    private current: number = 0
    private generatedIDs: Set<string> = new Set() // Track generated heading IDs

    constructor() {
        // No longer takes tokens parameter
    }

    private reset() {
        this.tokens = []
        this.current = 0
        this.generatedIDs.clear() // Clear generated IDs when resetting
    }

    public parse(tokens: Token[]): ASTNode {
        
        // Set the tokens and reset position tracking
        this.tokens = tokens
        this.current = 0
        this.generatedIDs.clear() // Clear generated IDs for new parse

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

    // BLOCK LEVEL ELEMENTS----------------------------------------------------------

    private parseBlock(): ASTNode | null {
        // parse block-level stuff

        // Skip whitespace and newlines at the top level
        this.skipWhitespace() // Super nice function name

        if (this.isAtEnd()) {
            return null
        }

        // Here youwould check for other block level elements

        if (this.match(TokenType.HEADING_OPEN)) {
            return this.parseHeading()
        }

        if (this.match(TokenType.HORIZ_RULE)) {
            return this.parseHorizRule()
        }

        // Default to paragraph for inline content
        return this.parseParagraph();
    }

    private parseHeading(): ASTNode {
        // previous() is now the HEADING_OPEN token
        const openToken = this.previous();
        const openLevel = openToken.value.length;
        
        // Skip any whitespace after the opening tag
        while (this.match(TokenType.WHITESPACE)) {
            // Skip whitespace but don't add it to children
        }
        
        // collect inline nodes until we hit HEADING_CLOSE
        const children: ASTNode[] = [];
        
        // Process content until closing tag
        while (!this.isAtEnd() && !this.check(TokenType.HEADING_CLOSE)) {
            const nodes = this.parseInlineUntil(TokenType.HEADING_CLOSE);
            children.push(...nodes);
        }
    
        // Handle the closing tag
        let closeLevel = openLevel; // Default assumption
        
        if (this.check(TokenType.HEADING_CLOSE)) {
            closeLevel = this.peek().value.length;
        }
        
        // Consume the closing token regardless of its level
        this.consume(TokenType.HEADING_CLOSE, `Expected equals signs to close heading`);
        
        // Handle imbalanced heading tags
        if (openLevel > closeLevel) {
            // Opening tag has more equals signs than closing tag
            // Add an equals sign at the end of the text content
            children.push({ type: 'Text', value: "=" });
        } else if (openLevel < closeLevel) {
            // Closing tag has more equals signs than opening tag
            // Add an equals sign at the beginning of the text content
            children.unshift({ type: 'Text', value: "=" });
        }
        
        // Trim whitespace nodes from beginning and end of children array
        // First, find the first non-whitespace node
        let startIndex = 0;
        while (startIndex < children.length && 
               children[startIndex].type === 'Text' && 
               children[startIndex].value === ' ') {
            startIndex++;
        }
        
        // Find the last non-whitespace node
        let endIndex = children.length - 1;
        while (endIndex >= 0 && 
               children[endIndex].type === 'Text' && 
               children[endIndex].value === ' ') {
            endIndex--;
        }
        
        // Create a new array with only the non-whitespace content
        const trimmedChildren = children.slice(startIndex, endIndex + 1);
        
        // Reverse the level as requested: more equals = lower heading number (h1)
        const level = Math.min(7 - openLevel, 6);
        
        // optionally consume one or two newlines
        if (this.match(TokenType.NEWLINE)) {
            this.match(TokenType.NEWLINE);
        }

        // generate heading ID
        const ID = this.getHeadingID(trimmedChildren)
        
        return {
            type: 'Heading',
            level,
            children: trimmedChildren,
            ID: ID
        };
    }

    private getHeadingID(nodeArr: ASTNode[]): string {

        let baseID: string

        if (nodeArr.every(node => node.type === "Text")) {
        
            const concat = nodeArr.map(node => node.value).join("")
            baseID = concat
                .trim()
                .toLowerCase()
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .replace(/ /g, "_")
        } else {
            throw new Error("LAWE parsing error: getHeadingID received node array which all nodes are not text." + JSON.stringify(nodeArr))
        }

        // Handle duplicate IDs by adding numbers
        let uniqueID = baseID
        let counter = 1

        while (this.generatedIDs.has(uniqueID)) {
            uniqueID = `${baseID}_${counter}`
            counter++
        }

        // Add the unique ID to our set of generated IDs
        this.generatedIDs.add(uniqueID)

        return uniqueID
    }

    private parseHorizRule(): ASTNode {
        return {
            type: 'Rule'
        }
    }

    // INLINE LEVEL ELEMENTS----------------------------------------------------------

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

            if (this.match(TokenType.LINEBREAK)) {
                children.push(this.parseLinebreak());
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
                throw new Error("LAWE Parsing error: parseInlineUntil() encountered unrecognized token: " + this.peek().type)
            }
        }
    
        return children;
    }

    private parseLinebreak(): ASTNode {
        // The LINEBREAK token has already been consumed by the match() call
        return {
            type: 'Linebreak'
        };
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
        console.error(this.tokens[this.current])
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
        while (true) {
            if (this.match(TokenType.WHITESPACE)) {
                continue
            }

            break
        }
    }

    //private isEmptyLine(): boolean {
    //    return this.check(TokenType.NEWLINE) && (this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === TokenType.NEWLINE)

    //}   
}