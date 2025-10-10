#include "LexerContext.h"

namespace Lexer {

    lctx::LexerContext(const std::string& inputText): input(inputText), position(0), line(1), col(1) {}

    bool lctx::isEOF() const {
        return position >= input.length();
    }

    char lctx::peek(int lookahead) const {
        if (position + lookahead >= input.length()) {
            return '\0';  // Null character for EOF
        }
        return input[position + lookahead];
    }

    char lctx::advance(int count) {
        if (isEOF()) {
            return '\0';
        }
        
        char currentChar = input[position];
        position += count;
        
        if (currentChar == '\n') {
            line++;
            col = 1;
        } else {
            col += count;
        }
        
        return currentChar;
    }

    bool lctx::matchString(const std::string& str) const {
        if (position + str.length() > input.length()) {
            return false;
        }
        
        for (size_t i = 0; i < str.length(); i++) {
            if (input[position + i] != str[i]) {
                return false;
            }
        }
        
        return true;
    }

    Token lctx::createToken(TokenType type, const std::string& value) {
        Position pos(line, col - static_cast<int>(value.length()));
        return Token(type, value, pos);
    }

    // Create a token with callout information
    Token lctx::createToken(TokenType type, const std::string& value, CalloutType calloutType, const std::string& calloutTitle) {
        Position pos(line, col - static_cast<int>(value.length()));
        return Token(type, value, pos, calloutType, calloutTitle);
    }

}  // namespace Lexer