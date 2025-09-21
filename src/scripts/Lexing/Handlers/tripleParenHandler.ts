import { BaseTokenHandler } from "./handlers";
import { TokenType } from "../lexer";
import type { Token } from "../lexer";
import LexerContext from "../context";

const VALID_COMMANDS = [
    'unfinished',
    'contextwarn',
    'external'
]

export type ValidCommand = typeof VALID_COMMANDS[number]

export default class TripleParenthesesHandler extends BaseTokenHandler {
    priority = 111;

    private static readonly VALID_COMMANDS = new Set(VALID_COMMANDS);
    

    // Pre-compiled regex for date validation (basic format checking)

    canHandle(context: LexerContext): boolean {
        // Check for opening triple parentheses
        if (context.peek() === '(' && context.peek(1) === '(' && context.peek(2) === '(') {
            // Look ahead to see if this matches our pattern
            return this.isValidTripleParentheses(context);
        }
        return false;
    }

    handle(context: LexerContext, tokens: Token[]): boolean {
        if (this.canHandle(context)) {
            const result = this.parseTripleParentheses(context);
            if (result) {
                tokens.push(context.createToken(TokenType.TRIPLE_PARENTHESES, result.fullText));
                return true;
            }
        }
        return false;
    }

    private isValidTripleParentheses(context: LexerContext): boolean {
        // Quick check: must start with (((
        if (!(context.peek() === '(' && context.peek(1) === '(' && context.peek(2) === '(')) {
            return false;
        }

        // Look ahead to find the complete pattern
        let pos = context.position + 3; // Skip opening (((
        let content = '';

        // Read content until we find ))) or hit end of input
        while (pos < context.input.length) {
            const char = context.input[pos];
            if (char === ')' && 
                pos + 2 < context.input.length && 
                context.input[pos + 1] === ')' && 
                context.input[pos + 2] === ')') {
                // Found closing )))
                break;
            }
            content += char;
            pos++;
        }

        // Check if we found proper closing
        if (pos >= context.input.length - 2) {
            return false; // No proper closing found
        }

        // Validate the content format: command|date
        return this.validateContent(content);
    }

    private parseTripleParentheses(context: LexerContext): { fullText: string; command: string; date: string } | null {
        const startPos = context.position;
        
        // Skip opening (((
        context.advance(3);
        
        let content = '';
        
        // Read content until closing )))
        while (!context.isEOF()) {
            if (context.peek() === ')' && 
                context.peek(1) === ')' && 
                context.peek(2) === ')') {
                // Found closing, advance past it
                context.advance(3);
                break;
            }
            content += context.advance();
        }

        // Validate and parse content
        const parts = content.split('|');
        if (parts.length !== 2) {
            // Reset position if invalid
            context.position = startPos;
            return null;
        }

        const [command, date] = parts.map(part => part.trim());
        
        if (!this.isValidCommand(command) || !this.isValidDate(date)) {
            // Reset position if invalid
            context.position = startPos;
            return null;
        }

        const fullText = `(((${content})))`;
        return { fullText, command, date };
    }

    private validateContent(content: string): boolean {
        const parts = content.split('|');
        if (parts.length !== 2) {
            return false;
        }

        const [command, date] = parts.map(part => part.trim());
        return this.isValidCommand(command) && this.isValidDate(date);
    }

    private isValidCommand(command: string): boolean {
        return TripleParenthesesHandler.VALID_COMMANDS.has(command);
    }

    private isValidDate(date: string): boolean {
        // Basic validation - date should not be empty and contain reasonable characters
        if (!date || date.length === 0) {
            return false;
        }
        
        // Allow alphanumeric, hyphens, slashes, spaces, colons (for various date formats)
        // This is permissive to allow different date formats
        const allowedChars = /^[a-zA-Z0-9\-\/\s:,.]+$/;
        return allowedChars.test(date);
    }

}