use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn simple_inline(raw: &str) -> String {
    let mut out: String = String::new();
    let chars: Vec<char> = raw.chars().collect();
    let mut i: usize = 0;

    let mut em: bool = false;
    let mut strong: bool = false;
    let mut underline: bool = false;
    let mut strike: bool = false;

    while i < chars.len() {

        if i + 1 < chars.len() && chars[i] == '/' && chars[i + 1] == '/' {
            if em {
                out.push_str("</em>");
            } else {
                out.push_str("<em>");
            }
            em = !em;
            i += 2;
            continue;
        }

        if i + 1 < chars.len() && chars[i] == '*' && chars[i + 1] == '*' {
            if strong {
                out.push_str("</strong>");
            } else {
                out.push_str("<strong>");
            }
            strong = !strong;
            i += 2;
            continue;
        }

        if i + 1 < chars.len() && chars[i] == '_' && chars[i + 1] == '_' {
            if underline {
                out.push_str("</u>");
            } else {
                out.push_str("<u>");
            }
            underline = !underline;
            i += 2;
            continue;
        }


        if i + 1 < chars.len() && chars[i] == '~' && chars[i + 1] == '~' {
            if strike {
                out.push_str("</s>");
            } else {
                out.push_str("<s>");
            }
            strike = !strike;
            i += 2;
            continue;
        }

        if i + 1 < chars.len() && chars[i] == '\\' && chars[i + 1] == '\\' {
            out.push_str("<br />");
            i += 2;
            continue;
        }

        out.push(chars[i]);
        i += 1;
    }

    out
}
