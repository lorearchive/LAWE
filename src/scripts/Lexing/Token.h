#ifndef TOKEN_H
#define TOKEN_H

#include <string>
#include <optional>
#include <unordered_map>

namespace Lexer {

    enum class TokenType {
        TEXT,
        BOLD_OPEN,
        BOLD_CLOSE,
        ITALIC_OPEN,
        ITALIC_CLOSE,
        UNDERLINE_OPEN,
        UNDERLINE_CLOSE,
        HEADING_OPEN,
        HEADING_CLOSE,
        HORIZ_RULE,
        LINEBREAK,
        NEWLINE,
        WHITESPACE,
        CALLOUT_OPEN,
        CALLOUT_CLOSE,
        SUB_OPEN,
        SUB_CLOSE,
        SUP_OPEN,
        SUP_CLOSE,

        TABLE_OPEN,
        TABLE_CLOSE,
        THEAD_OPEN,
        THEAD_CLOSE,
        TBODY_OPEN,
        TBODY_CLOSE,
        TFOOT_OPEN,
        TFOOT_CLOSE,
        TR_OPEN,
        TR_CLOSE,
        TD_OPEN,
        TD_CLOSE,
        TH_OPEN,
        TH_CLOSE,

        IMAGE_OPEN,
        IMAGE_PIPE,
        IMAGE_CLOSE,

        LINK_OPEN,
        LINK_CLOSE,
        LINK_PIPE,
        FOOTNOTE_OPEN,
        FOOTNOTE_CLOSE,
        CITATION_NEEDED,
        TRIPLE_PARENTHESES,

        BLOCKQUOTE_OPEN,
        BLOCKQUOTE_CLOSE,
        AFFILI,
        
        EOF_TOKEN
    };

    enum class CalloutType {
        DEFAULT,
        SUCCESS,
        INFO,
        WARNING,
        DANGER
    };

    struct Position {
        int line;
        int col;
        
        Position(int l = 1, int c = 1) 
            : line(l), col(c) {}
    };

    struct Token {
        TokenType type;
        std::string value;
        Position position;
        std::optional<std::unordered_map<std::string, std::string>> attributes;
        std::optional<CalloutType> calloutType;
        std::optional<std::string> calloutTitle;
        
        // Basic constructor
        Token(TokenType t, const std::string& v, Position pos)
            : type(t), value(v), position(pos) {}
        
        // Constructor with callout info
        Token(TokenType t, const std::string& v, Position pos, 
            CalloutType ct, const std::string& title)
            : type(t), value(v), position(pos), 
            calloutType(ct), calloutTitle(title) {}
    };

}  // namespace Lexer

#endif  // TOKEN_H