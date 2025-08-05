import type { CalloutType } from "../Lexing/Handlers/PseudoHTMLHandler";
import { LinkHandler } from "../Lexing/Handlers/handlers";
import type { Token } from "../Lexing/lexer";
import { TokenType } from "../Lexing/lexer";
import { parseInfoTable } from "./infoTableParser";

import { parseTable } from './TableParser';

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
    | 'Newline'
    | 'Callout'

    | 'Table'
    | 'TableHead'
    | 'TableBody'
    | 'TableFoot'
    | 'TableRow'
    | 'TableCell'
    | 'TableHeaderCell'

    | 'Image'
    | 'Link'

    | 'InfoTableAffili'

export interface ASTNode {
    type: NodeType
    children?: ASTNode[]
    value?: string
    level?: number
    url?: string
    text?: string
    ID?: string
    calloutType?: CalloutType
    calloutTitle?: string
    attributes?: Record<string, string>
    src?: string      // Image path/URL
    alt?: string      // Image caption/alt text
    width?: string    // Image width
    format?: string   // Image format
    loading?: string  // Image loading (lazy or eager)
    align?: string    // Image align (right, left)
    linkType?: 'external' | 'internal' | 'anchor'
    href?: string        // The actual link target
    namespace?: string   // For internal links
    page?: string        // For internal links  
    anchor?: string      // Fragment identifier
}

export interface ParserCtx {
    isAtEnd(): boolean;
    check(type: TokenType): boolean
    match(type: TokenType): boolean
    advance(): Token;
    previous(): Token
    whereami(): Token
    consume(type: TokenType, errMsg: string): Token;
    parseInlineUntil(terminator: TokenType|null): ASTNode[]
    peek(): Token
}

export default class Parser {

    private tokens: Token[] = []
    private current: number = 0
    private generatedIDs: Set<string> = new Set() // Track generated heading IDs


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

    // BLOCK LEVEL ELEMENTS---------------------------------------------------------------------------------------------------

    private parseBlock(): ASTNode | null {
        // parse block-level stuff

        // Skip whitespace and newlines at the top level
        this.skipWhitespace() // Super nice function name

        if (this.isAtEnd()) {   
            return null
        }

        // Here we check for other block level elements

        if (this.match(TokenType.HEADING_OPEN)) {
            return this.parseHeading()
        }

        if (this.match(TokenType.HORIZ_RULE)) {
            return this.parseHorizRule()
        }

        if (this.match(TokenType.CALLOUT_OPEN)) {
            return this.parseCallout()
        }

        if (this.match(TokenType.TABLE_OPEN)) {
            return parseTable(this)
        }

        if (this.match(TokenType.AFFILI)) {
            return parseInfoTable(this)
        }

        if (this.match(TokenType.IMAGE_OPEN)) {
            return this.parseImage();
        }

        // Default to paragraph for inline content
        return this.parseParagraph();
    }

    // BLOCK LEVEL ELEMENTS INDIVIDUAL---------------------------------------------------------------------------------------------------

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

    private parseCallout(): ASTNode {
        // previous() is now the CALLOUT_OPEN token
        const openToken = this.previous();
        const calloutType = openToken.calloutType || 'default';
        const calloutTitle = openToken.calloutTitle;
        
        // Skip any whitespace/newlines after the opening tag
        this.skipWhitespaceAndNewlines();
        
        // Parse content until we hit CALLOUT_CLOSE
        const children: ASTNode[] = [];
        
        while (!this.isAtEnd() && !this.check(TokenType.CALLOUT_CLOSE)) {
            const nodes = this.parseInlineUntil(TokenType.CALLOUT_CLOSE);
            children.push(...nodes);
        }
        
        // Consume the closing tag
        this.consume(TokenType.CALLOUT_CLOSE, "Expected '</callout>' to close callout");
        
        // Optionally consume newlines after closing tag
        if (this.match(TokenType.NEWLINE)) {
            this.match(TokenType.NEWLINE);
        }
        
        return {
            type: 'Callout',
            calloutType,
            calloutTitle,
            children
        };
    }

    private parseImage(): ASTNode {
        // IMAGE_OPEN token has already been consumed by match()

        // Parse the image path - collect TEXT tokens until we hit IMAGE_PIPE or IMAGE_CLOSE
        let src = '';
        const pathTokens: string[] = [];
        let align: string = "right" //no support for center yet


        while (!this.isAtEnd() && !this.check(TokenType.IMAGE_PIPE) && !this.check(TokenType.IMAGE_CLOSE)) {

            if (this.match(TokenType.WHITESPACE)) {
                align = "right"
            }

            if (this.match(TokenType.TEXT)) {
                pathTokens.push(this.previous().value)

            } else if (this.match(TokenType.WHITESPACE)) {
                align = "left"

            } else {
                // Skip other tokens or handle them as needed
                this.advance();
            }
        }

        src = pathTokens.join('').trim();

        // extract width if there's a `?` parameter in the path
        let imagePath = src;
        let width: string = '' //Initialized to prevent vscode throwing errors on return
        let format: string | undefined

       
        if (imagePath.includes('?')) {
            const [basePath, query] = src.split('?');

            // support width=300, 300px, 50%, etc.
            const match = query.match(/^width=(\d+)(px|%)?$|^(\d+)(px|%)?$/);
            if (match) {
                width = match[1] || (match[3] + (match[4] || ''));
            }

            imagePath = basePath

            // extract file extension
            const formatMatch = basePath.match(/\.(\w+)$/);
            format = formatMatch ? formatMatch[1].toLowerCase() : undefined

        } else {
            throw new Error("LAWE Parsing error: Parser encountered no width information associated with image.")
        }

        // Parse the caption if there's a pipe
        let alt = '';
        if (this.match(TokenType.IMAGE_PIPE)) {
            const captionTokens: string[] = [];

            while (!this.isAtEnd() && !this.check(TokenType.IMAGE_CLOSE)) {
                if (this.match(TokenType.TEXT)) {
                    captionTokens.push(this.previous().value);
                } else if (this.match(TokenType.WHITESPACE)) {
                    captionTokens.push(' ');
                } else {
                    // Skip other tokens or handle them as needed
                    this.advance();
                }
            }

            alt = captionTokens.join('').trim();
        }

        // Consume the closing tag
        this.consume(TokenType.IMAGE_CLOSE, "Expected '}}' to close image");

        return {
            type: 'Image',
            src: imagePath,
            alt: alt || undefined,
            width: width,
            format: format || undefined,
            loading: 'lazy',
            align: align
        };
    }





    // INLINE LEVEL ELEMENTS INDIVIDUAL-------------------------------------------------------------------------------------

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
    

    public parseInlineUntil(terminator: TokenType|null = null): ASTNode[] {
        
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

            if (this.match(TokenType.NEWLINE)) {
                children.push(this.parseNewline());
                continue
            }

            if (this.match(TokenType.LINK_OPEN)) {
                children.push(this.parseLink());
                continue;
            }
            
            if (this.match(TokenType.UNDERLINE_OPEN)) {
                children.push(this.parseUnderline());

            } else if (this.match(TokenType.BOLD_OPEN)) {
                children.push(this.parseBold());

            } else if (this.match(TokenType.ITALIC_OPEN)) {
                children.push(this.parseItalic());

            } else if (this.match(TokenType.TEXT)) {
                children.push({ type: 'Text', value: this.previous().value })

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

    private parseNewline(): ASTNode {
        // The NEWLINE token has already been consumed by the match() call
        return {
            type: 'Newline'
        };
    }

    private parseLink(): ASTNode {
        // LINK_OPEN token has already been consumed by match()
        
        // Parse the link target - collect tokens until we hit LINK_PIPE or LINK_CLOSE
        let target = '';
        const targetTokens: string[] = [];
        
        while (!this.isAtEnd() && !this.check(TokenType.LINK_PIPE) && !this.check(TokenType.LINK_CLOSE)) {
            if (this.match(TokenType.TEXT)) {
                targetTokens.push(this.previous().value);
            } else if (this.match(TokenType.WHITESPACE)) {
                targetTokens.push(' ');
            } else {
                // Skip other tokens or advance past unexpected tokens
                this.advance();
            }
        }
        
        target = targetTokens.join('').trim();
        
        // Parse the link text if there's a pipe
        let linkText = '';
        const linkTextNodes: ASTNode[] = [];
        
        if (this.match(TokenType.LINK_PIPE)) {
            // Parse inline content until LINK_CLOSE
            linkTextNodes.push(...this.parseInlineUntil(TokenType.LINK_CLOSE));
            
            // Convert nodes to text for simple cases
            if (linkTextNodes.every(node => node.type === 'Text')) {
                linkText = linkTextNodes.map(node => node.value).join('').trim();
            }
        }
        
        // Consume the closing tag
        this.consume(TokenType.LINK_CLOSE, "Expected ']]' to close link");
        
        // Validate and categorize the link using the LinkHandler utility
        const validation = LinkHandler.validateLinkTarget(target);
        
        if (!validation.isValid) {
            // Handle invalid links - you might want to treat them as plain text
            console.warn(`Invalid link target: ${target} - ${validation.error}`);
            return {
                type: 'Text',
                value: `[[${target}${linkText ? '|' + linkText : ''}]]`
            };
        }
        
        // Create the link node based on type
        const linkNode: ASTNode = {
            type: 'Link',
            linkType: validation.type,
            href: target,
            text: linkText || target, // Use link text or fall back to target
        };
        
        // Add type-specific properties
        if (validation.type === 'internal') {
            linkNode.namespace = validation.namespace;
            linkNode.page = validation.page;
            linkNode.anchor = validation.anchor;
            
            // Normalize the internal link
            linkNode.href = LinkHandler.normalizeInternalLink(target);
        } else if (validation.type === 'anchor') {
            linkNode.anchor = validation.anchor;
        }
        
        // If we have complex link text (not just plain text), store it as children
        if (linkTextNodes.length > 0 && !linkTextNodes.every(node => node.type === 'Text')) {
            linkNode.children = linkTextNodes;
            delete linkNode.text; // Remove simple text property
        }
        
        return linkNode;
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

    // ----------------------------------------------------------------------------------------------------- HELPER METHODS

    public isAtEnd(): boolean {

        return this.current >= this.tokens.length
            || this.tokens[this.current].type === TokenType.EOF

    }

    public whereami(): Token {
        return this.tokens[this.current]
    }

    public check(type: TokenType): boolean {
        
        if (this.current >= this.tokens.length) return false

        return this.tokens[this.current].type === type
    }

    public advance(): Token {
        if (!this.isAtEnd()) this.current++

        return this.previous()
    }

    public consume(type: TokenType, errMsg: string): Token {

        if (this.check(type)) {
            return this.advance()
        }
        console.error(this.tokens[this.current])
        throw new Error(`${errMsg} at line ${this.peek().position.line}, col ${this.peek().position.col}`)
    }

    public match(type: TokenType): boolean {

        if (this.check(type)) {

            this.advance()
            return true
        }
        return false
    }

    public previous(): Token {
        return this.tokens[this.current - 1]
    }

    public peek(): Token {
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

    private skipWhitespaceAndNewlines(): void {
        while (true) {
            if (this.match(TokenType.WHITESPACE) || this.match(TokenType.NEWLINE)) {
                continue
            }

            break
        }
    }

    //private isEmptyLine(): boolean {
    //    return this.check(TokenType.NEWLINE) && (this.current + 1 < this.tokens.length && this.tokens[this.current + 1].type === TokenType.NEWLINE)

    //}   
}