use std::collections::Hashmap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TokenType {
    CalloutOpen,
    CalloutClose,
    SubOpen,
    SubClose,
    SupOpen,
    SupClose,
    BlockquoteOpen,
    BlockquoteClose,

    TableOpen,
    TableClose,
    TheadOpen,
    TheadClose,
    TbodyOpen,
    TbodyClose,
    TfootOpen,
    TfootClose,
    TrOpen,
    TrClose,
    TdOpen,
    TdClose,
    ThOpen,
    ThClose,

    Text,
    BoldOpen,
    BoldClose,
    UnderlineOpen,
    UnderlineClose,
    ItalicOpen,
    ItalicClose,

    Linebreak,
    Newline,
    Whitespace,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Token {
    pub token_type: TokenType,
    pub value: String,
    pub position: Position,
    pub attributes: Option<Hashmap<String, String>>,
    pub callout_type: Option<CalloutType>,
    pub callout_title: Option<String>
}

struct Position {
    pub line: usize,
    pub col: usize,
}