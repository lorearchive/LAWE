#ifndef TOKEN_H
    #define TOKEN_H


    #include <string>      // std::string
    #include <optional>    // std::optional (C++17)
    #include <unordered_map>  // attributes dictionary


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

    }

#endif

