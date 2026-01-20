pub struct LexerContext<'a> {
    input: &'a str,
    position: u128,
    line: u128,
    col: u128
}

impl LexerContext {
    pub fn new(
        input: &str,
        position: u128 ,
        line: u128,
        col: u128
    ) -> Self { 
        Self { input, position, line, col }; 
    }

    fn is_eof(&self) -> bool {
        return self.position >= self.input.chars().count();
    }

    fn peek(&self, lookahead: u128) -> String {
        if (self.position)
    }
}