import { type Token, TokenType } from "../Lexing/lexer";
import type { ASTNode } from "./parser"

export interface ParserCtx {
    isAtEnd(): boolean;
    check(type: TokenType): boolean
    match(type: TokenType): boolean
    advance(): Token;
    consume(type: TokenType, errMsg: string): Token;
    parseInlineUntil(terminator: TokenType|null): ASTNode[]
}

// main parser as ctx
export function parseTable(ctx: ParserCtx): ASTNode {
    const children: ASTNode[] = [];

    while(!ctx.isAtEnd() && !ctx.check(TokenType.TABLE_CLOSE)) {

        if (ctx.match(TokenType.THEAD_OPEN)) {
            children.push(parseTableHead(ctx));

        } else if (ctx.match(TokenType.TBODY_OPEN)) {
            children.push(parseTableBody(ctx));

        } else if (ctx.match(TokenType.TR_OPEN)) {
            children.push(parseTableRow(ctx));

        } else {
            ctx.advance();
        }
    }

    ctx.consume(TokenType.TABLE_CLOSE, "Expected </table>");
    return { type: 'Table', children };
}

export function parseTableHead(ctx: ParserCtx): ASTNode {
        const children: ASTNode[] = []
  
        while (!ctx.isAtEnd() && !ctx.check(TokenType.THEAD_CLOSE)) {
    
            if (ctx.match(TokenType.TR_OPEN)) {
                children.push(parseTableRow(ctx))
    
            } else {
                ctx.advance()
            }
        }
        
        ctx.consume(TokenType.THEAD_CLOSE, "Expected </thead>")
        return { type: 'TableHead', children }
    }

    
export function parseTableBody(ctx: ParserCtx): ASTNode {
    const children: ASTNode[] = []

    while (!ctx.isAtEnd() && !ctx.check(TokenType.TBODY_CLOSE)) {

        if (ctx.match(TokenType.TR_OPEN)) {
            children.push(parseTableRow(ctx))
        
        } else {
            ctx.advance()
        }
    }

    ctx.consume(TokenType.TBODY_CLOSE, "Expected </tbody>")
    return { type: 'TableBody', children }
}

export function parseTableRow(ctx: ParserCtx): ASTNode {
    
    const children: ASTNode[] = []
    
    while (!ctx.isAtEnd() && !ctx.check(TokenType.TR_CLOSE)) {
    
        if (ctx.match(TokenType.TD_OPEN)) {
            children.push(parseTableCell(ctx))
        
        } else if (ctx.match(TokenType.TH_OPEN)) {
            children.push(parseTableHeaderCell(ctx))
        
        } else {
            ctx.advance()
        }
    }

    ctx.consume(TokenType.TR_CLOSE, "Expected </tr>")
    return { type: 'TableRow', children }
}

export function parseTableCell(ctx: ParserCtx): ASTNode {
    // collect inline content until </td>
    const children = ctx.parseInlineUntil(TokenType.TD_CLOSE)
    ctx.consume(TokenType.TD_CLOSE, "Expected </td>")
    return { type: 'TableCell', children }
}

export function parseTableHeaderCell(ctx: ParserCtx): ASTNode {
    const children = ctx.parseInlineUntil(TokenType.TH_CLOSE)
    ctx.consume(TokenType.TH_CLOSE, "Expected </th>")
    return { type: 'TableHeaderCell', children }
}
