mod TokenType;
mod Token;
mod LexerContext;

pub trait TokenHandler {
    fn can_handle(&self, context: &LexerContext) -> bool;
    fn handle(&self, context: &mut LexerContext, tokens: &mut Vec<Token>, token_stack: &mut Vec<TokenType>) -> bool;
    fn priority(&self) -> u64;

    fn get_token_type(&self) -> TokenType;
}

pub trait BaseTokenHandler: TokenHandler {
    fn priority()
}