use arithmetic_of_letters::{color::DefaultColorStrategy, parse, polish, pretty, RenderOptions};
use fontdue::{Font, FontSettings};

fn main() {
    let mut args = std::env::args();
    args.next();

    let program = args.next().unwrap_or_else(|| {
        println!("Didn't get expression as args, using default");

        "A + B || 8 & 0 || G - K".to_owned()
    });

    // Read the font data.
    let font = include_bytes!("../Roboto-Regular.ttf") as &[u8];
    // Parse it into the font type.
    let font = Font::from_bytes(font, FontSettings::default()).unwrap();

    let options: RenderOptions = RenderOptions {
        font_size: 300.0,
        font,
        color_strategy: || Box::new(DefaultColorStrategy::new()),
    };

    println!(
        "pretty: {}\npolish: {}",
        pretty(&program).unwrap(),
        polish(&program).unwrap()
    );

    let render = parse(&program, &options).unwrap();

    render.save_png("output.png").expect("Oopsie writing png");
    println!("Written to output.png");
}
