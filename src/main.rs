extern crate pest;

#[macro_use]
extern crate pest_derive;

use core::panic;

use fontdue::{Font, FontSettings};
use pest::iterators::Pairs;
use pest::pratt_parser::{Assoc, Op, PrattParser};
use pest::Parser;
use tiny_skia::{
    BlendMode, Color, IntSize, Mask, Paint, Pixmap, PixmapPaint, Rect, Shader, Transform,
};

#[derive(Parser)]
#[grammar = "arithmeticofletters.pest"]
struct ArithmeticOfLettersParser;

fn main() {
    println!("Hello, world!");

    let pratt = PrattParser::new()
        .op(Op::infix(Rule::concat, Assoc::Left))
        .op(Op::infix(Rule::add, Assoc::Left)
            | Op::infix(Rule::sub, Assoc::Left)
            | Op::infix(Rule::and, Assoc::Left)
            | Op::infix(Rule::or, Assoc::Left)
            | Op::infix(Rule::xor, Assoc::Left));

    let pairs = ArithmeticOfLettersParser::parse(Rule::program, "1 + (1 - 1) || g ^ e")
        .unwrap_or_else(|e| panic!("{}", e));

    let program = pairs.peek().unwrap();
    assert_eq!(program.as_rule(), Rule::program);

    let expr = program.into_inner().peek().unwrap();
    assert_eq!(expr.as_rule(), Rule::expr);

    println!("Parsed: {:?}", expr);

    let transformed = parse_expr(expr.into_inner(), &pratt);

    println!("Transformed: {}", transformed);

    // Read the font data.
    let font = include_bytes!("../Roboto-Regular.ttf") as &[u8];
    // Parse it into the font type.
    let font = Font::from_bytes(font, FontSettings::default()).unwrap();
    // Rasterize and get the layout metrics for the letter 'g' at 17px.
    let (metrics, bitmap) = font.rasterize('©', 50.0);
    println!("{:?} {:?}", metrics, font.vertical_line_metrics(50.0));

    let size: IntSize = IntSize::from_wh(
        metrics.width.try_into().unwrap(),
        metrics.height.try_into().unwrap(),
    )
    .unwrap();

    let char_mask = Mask::from_vec(bitmap, size).unwrap();
    char_mask.save_png("output1.png").unwrap();

    let mut paint = Paint {
        anti_alias: true,
        ..Default::default()
    };
    paint.set_color_rgba8(0, 50, 0, 255);

    let mut canvas = Pixmap::new(size.width(), size.height()).unwrap();

    canvas.fill_rect(
        Rect::from_xywh(0.0, 0.0, size.width() as f32, size.height() as f32).unwrap(),
        &paint,
        Transform::identity(),
        Some(&char_mask),
    );

    //canvas.draw_pixmap(0, 0, char_a.unwrap().as_ref(), &paint, Transform::identity(), None);

    canvas.save_png("output.png").expect("Oopsie writing png");
}

fn parse_expr(pairs: Pairs<Rule>, pratt: &PrattParser<Rule>) -> String {
    pratt
        .map_primary(|primary| match primary.as_rule() {
            Rule::char => primary.as_str().to_owned(),
            Rule::expr => parse_expr(primary.into_inner(), pratt), // from "(" ~ expr ~ ")"
            _ => unreachable!(),
        })
        .map_infix(|lhs, op, rhs| match op.as_rule() {
            Rule::add => format!("(+ {} {})", lhs, rhs),
            Rule::sub => format!("(- {} {})", lhs, rhs),
            Rule::and => format!("(& {} {})", lhs, rhs),
            Rule::or => format!("(| {} {})", lhs, rhs),
            Rule::xor => format!("(^ {} {})", lhs, rhs),
            Rule::concat => format!("(|| {} {})", lhs, rhs),
            _ => unreachable!(),
        })
        .parse(pairs)
}
