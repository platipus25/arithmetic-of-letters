use crate::color::ColorStrategy;
use crate::render::{composite, concat, render_char, RenderOptions};
use pest::iterators::Pairs;
use pest::pratt_parser::{Assoc, Op, PrattParser};
use pest::Parser;
use tiny_skia::{BlendMode, Pixmap};

lazy_static! {
    static ref PRATT: PrattParser<Rule> = PrattParser::new()
        .op(Op::infix(Rule::concat, Assoc::Left))
        .op(Op::infix(Rule::add, Assoc::Left)
            | Op::infix(Rule::sub, Assoc::Left)
            | Op::infix(Rule::and, Assoc::Left)
            | Op::infix(Rule::or, Assoc::Left)
            | Op::infix(Rule::xor, Assoc::Left));
}

#[derive(Parser)]
#[grammar = "arithmeticofletters.pest"]
struct ArithmeticOfLettersParser;

pub fn parse(program: &str, options: &RenderOptions) -> Result<Pixmap, pest::error::Error<Rule>> {
    let pairs = parse_program(program)?;

    let mut color_strategy: ColorStrategy = (options.color_strategy)();

    let rendering = render(pairs, options, &mut color_strategy);

    Ok(rendering)
}

pub fn pretty(program: &str) -> Result<String, pest::error::Error<Rule>> {
    let pairs = parse_program(program)?;

    Ok(transform_pretty(pairs))
}

pub fn polish(program: &str) -> Result<String, pest::error::Error<Rule>> {
    let pairs = parse_program(program)?;

    Ok(transform_polish_notation(pairs))
}

pub fn parse_program(program: &str) -> Result<Pairs<Rule>, pest::error::Error<Rule>> {
    let pairs = ArithmeticOfLettersParser::parse(Rule::program, program)?;

    let program = pairs.peek().unwrap();
    assert_eq!(program.as_rule(), Rule::program);

    let expr = program.into_inner().peek().unwrap();
    assert_eq!(expr.as_rule(), Rule::expr);

    Ok(expr.into_inner())
}

pub fn transform_pretty(pairs: Pairs<Rule>) -> String {
    PRATT
        .map_primary(|primary| match primary.as_rule() {
            Rule::char => primary.as_str().to_owned(),
            Rule::expr => transform_pretty(primary.into_inner()), // from "(" ~ expr ~ ")"
            _ => unreachable!(),
        })
        .map_infix(|lhs, op, rhs| match op.as_rule() {
            Rule::add => format!("{} + {}", lhs, rhs),
            Rule::sub => format!("{} - {}", lhs, rhs),
            Rule::and => format!("{} & {}", lhs, rhs),
            Rule::or => format!("{} | {}", lhs, rhs),
            Rule::xor => format!("{} ^ {}", lhs, rhs),
            Rule::concat => format!("{} || {}", lhs, rhs),
            _ => unreachable!(),
        })
        .parse(pairs)
}

pub fn transform_polish_notation(pairs: Pairs<Rule>) -> String {
    PRATT
        .map_primary(|primary| match primary.as_rule() {
            Rule::char => primary.as_str().to_owned(),
            Rule::expr => transform_polish_notation(primary.into_inner()), // from "(" ~ expr ~ ")"
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

pub fn render(
    pairs: Pairs<Rule>,
    options: &RenderOptions,
    color_strategy: &mut ColorStrategy,
) -> Pixmap {
    PRATT
        .map_primary(|primary| match primary.as_rule() {
            Rule::char => render_char(primary.as_str(), options, color_strategy),
            Rule::expr => render(primary.into_inner(), options, color_strategy), // from "(" ~ expr ~ ")"
            _ => unreachable!(),
        })
        .map_infix(|lhs, op, rhs| match op.as_rule() {
            Rule::add => composite(lhs, rhs, BlendMode::SourceOver, options),
            Rule::sub => composite(lhs, rhs, BlendMode::DestinationOut, options),
            Rule::and => composite(lhs, rhs, BlendMode::SourceIn, options),
            Rule::or => composite(lhs, rhs, BlendMode::SourceOver, options),
            Rule::xor => composite(lhs, rhs, BlendMode::Xor, options),
            Rule::concat => concat(lhs, rhs, options),
            _ => unreachable!(),
        })
        .parse(pairs)
}
