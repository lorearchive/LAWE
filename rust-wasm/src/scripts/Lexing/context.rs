mod TokenType;

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
        if (self.position + lookahead >= self.input.chars().count()) {
            return "";
        }
        return self.input
            .chars()
            .nth((self.position + lookahead) as usize)
    }

    fn advance(&self, count: Option<u64>) {
        let char = self.peek();
        let countint = count.unwrap_or(1);

        self.position = self.position + countint;

        if (char == "\n") {
            self.line = self.line + 1;
            self.col = 1;
        } else {
            self.col = self.col + countint;
        }

        return char;
    }

    fn create_token(&self, ttype: TokenType, value: String, )
}