import { TokenType } from "../Lexing/lexer";
import type { ASTNode, ParserCtx } from "./parser"

export function parseInfoTable(ctx: ParserCtx): ASTNode {


    if (ctx.check(TokenType.AFFILI)) {

        const attributes = ctx.previous().attributes

        return {
            type: "InfoTableAffili",
            attributes

        }
            
    } else {
        throw new Error("LAWE DEBUG PARSEINFOTABLE ENCOUNTERED UNRECOGNISED INFOTABLE TYPE: " + ctx.previous())
    }

}