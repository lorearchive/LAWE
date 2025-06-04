# Adding new syntax to the Lexer
This guide walks you through adding new syntax to the lexer. We'll use linebreak (\\) as our example.

## Step 1: Add Token Types
First, we must add the new token type (if applicable) to the `TokenType` enum in `Lexing/lexer.ts`.

```
export enum TokenType {
    // ... existing tokens
    LINEBREAK = "LINEBREAK",
    // ... rest of tokens
}
```

The lexer needs to know what types of tokens it can generate. Always add both OPEN and CLOSE variants for paired syntax.

## Step 2: Create the Handler

Navigate to `Lexing/handlers.ts` and write the desired handler.

```
export class LinebreakHandler extends BaseTokenHandler {
    priority = 95

    canHandle(context: LexerContext): boolean {
        return context.peek() === '\\' && context.peek(1) === '\\' && (context.peek(2) === ' ' || context.peek(2) === '\n' )
    }

    handle(context: LexerContext, tokens: Token[], tokenStack: TokenType[]): boolean {
        context.advance(2)
        const type = TokenType.LINEBREAK

        tokens.push(context.createToken(type, '\\\\'))

        return true
    }
}
```

**Priority** determines the order of lexing. Higher the number, higher the priority. Use 90-100 for formatting syntax. **canHandle()** returns true only when you can definitely handle this position, and **handle()** does the actual work and returns `true` if successful.


## Step 3: Register the handler
In `Lexing/lexer.ts`, navigate to `registerDefaultHandlers()` and register the handler.

```
private registerDefaultHandlers(): void {
    this.handlers = [
        new FormattingHandler(),
        new HeadingHandler(),
        new WhitespaceHandler(),
        new TextHandler(),
        new LinebreakHandler()
    ];

    // Sort by priority (highest first)
    this.handlers.sort((a, b) => b.priority - a.priority);
}
```

## Step 4: Update Special Characters
If the new syntax uses new special characters, add them to the `specialChars` array of `TextHandler` in `Lexing/handlers.ts`.

```
export class TextHandler extends BaseTokenHandler {
    priority = 1; // Lowest priority - fallback

    private specialChars = ['_', '*', '/', '[', ']', '=', '\n', '|', '-', '`', '\\', '<'];
    // ...

}
```
This prevents the text handler from consuming characters that should be handled by syntax handlers.