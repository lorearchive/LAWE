use wasm_bindgen::prelude::*;
use url::Url;

#[wasm_bindgen]
pub fn redirect_to_lowercase(url_str: &str) -> Option<String> {
    let url = match Url::parse(url_str) {
        Ok(url) => url,
        Err(_) => return None,
    };

    let pathname = url.path();

    if pathname != pathname.to_lowercase() {
        let lowercase_pathname = pathname.to_lowercase();

        let mut new_url = url.clone();
        new_url.set_path(&lowercase_pathname);

        Some(new_url.to_string())
    } else {
        None
    }

}