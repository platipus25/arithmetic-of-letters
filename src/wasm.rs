use crate::{parse::{parse}, RenderOptions};
use wasm_bindgen::prelude::*;
use web_sys::{Blob, BlobPropertyBag};
use js_sys::Uint8Array;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, {{project-name}}!");
}

#[wasm_bindgen]
pub fn parse_wasm(program: &str, font_size: f32) -> Result<Uint8Array, String> {
    let options = RenderOptions {
        font_size,
        ..Default::default()
    };

    let pixmap = parse(program, &options).map_err(|err| err.to_string())?;

    let png = pixmap.encode_png().expect("Error encoding png");
        
    let mut properties = BlobPropertyBag::new();
    properties.type_("image/png");

    let array = Uint8Array::new_with_length(png.len().try_into().unwrap());
    array.copy_from(&png);

    let blob = Blob::new_with_u8_array_sequence_and_options(
        &array,
        &properties,
    ).expect("Error making blob");

    println!("Blob is {:?}", blob);

    Ok(array)
}