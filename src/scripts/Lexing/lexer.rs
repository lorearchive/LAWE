#[derive(Debug, PartialEq, Eq, Hash)]
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

    

}

impl TokenType {
    pub fn as_str(&self) -> &'static str {
        match self {
            TokenType::CalloutOpen => "CALLOUT_OPEN",
            TokenType::CalloutClose => "CALLOUT_CLOSE",
            TokenType::SubOpen => "SUB_OPEN",
            TokenType::SubClose => "SUB_CLOSE",
            TokenType::SupOpen => "SUP_OPEN",
            TokenType::SupClose => "SUP_CLOSE",
            TokenType::BlockquoteOpen => "BLOCKQUOTE_OPEN",
            TokenType::BlockquoteClose => "BLOCKQUOTE_CLOSE",

            TokenType::TableOpen => "TABLE_OPEN",
            TokenType::TableClose => "TABLE_CLOSE",
            TokenType::TheadOpen => "THEAD_OPEN",
            TokenType::TheadClose => "THEAD_CLOSE",
            TokenType::TbodyOpen => "TBODY_OPEN",
            TokenType::TbodyClose => "TBODY_CLOSE",
            TokenType::TfootOpen => "TFOOT_OPEN",
            TokenType::TfootClose => "TFOOT_CLOSE",
            TokenType::TrOpen => "TR_OPEN",
            TokenType::TrClose => "TR_CLOSE",
            TokenType::TdOpen => "TD_OPEN",
            TokenType::TdClose => "TD_CLOSE",
            TokenType::ThOpen => "TH_OPEN",
            TokenType::ThClose => "TH_CLOSE",
        }
    }
}
