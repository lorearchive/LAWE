import { TokenType } from "../Lexing/lexer";
import type { ASTNode, ParserCtx } from "./parser"

export function parseInfoTable(ctx: ParserCtx): ASTNode {


    if (ctx.previous().type === TokenType.AFFILI) {

        const attributes = ctx.previous().attributes

        return {
            type: "InfoTableAffili",
            attributes
        }
            
    } else if (ctx.previous().type === TokenType.INFOTABLE) {
        const attributes = ctx.previous().attributes

        return {
            type: "InfoTable",
            attributes
        }

    } else {
        throw new Error("LAWE DEBUG PARSEINFOTABLE ENCOUNTERED UNRECOGNISED INFOTABLE TYPE: " + JSON.stringify(ctx.whereami()))
    }

}