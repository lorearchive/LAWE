#ifndef LEXER_CONTEXT_H
#define LEXER_CONTEXT_H

#include "Token.h"
#include <string>

namespace Lexer {

    class lctx {
        private:
            std::string input;
            size_t position;
            int line;
            int col;

        public:
            lctx(const std::string& inputText);
            
            bool isEOF() const;
            char peek(int lookahead = 0) const;
            char advance(int count = 1);
            bool matchString(const std::string& str) const;
            
            Token createToken(TokenType type, const std::string& value);
            Token createToken(TokenType type, const std::string& value, CalloutType calloutType, const std::string& calloutTitle);
            
            // getters (needed by handlers)
            size_t getPosition() const { return position; }
            int getLine() const { return line; }
            int getCol() const { return col; }
            const std::string& getInput() const { return input; }
            
            // allow handlers to modify position if needed (very rare)
            void setPosition(size_t pos) { position = pos; }
    };

}  // namespace Lexer

#endif  // LEXER_CONTEXT_H