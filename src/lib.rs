extern crate pest;
#[macro_use]
extern crate pest_derive;
#[macro_use]
extern crate lazy_static;

pub mod color;
mod parse;
mod render;

pub use parse::{parse, polish, pretty};
pub use render::RenderOptions;

pub mod wasm;
