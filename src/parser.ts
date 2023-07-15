import grammar, {
  ArithmeticOfLettersSemantics,
} from "./arithmeticofletters.ohm-bundle";
import { MatchResult } from "ohm-js";
import Color from "colorjs.io";
import { ColorStrategy } from "./colors";

const semantics = grammar.createSemantics() as ParserSemantics;

interface ParserSemantics extends ArithmeticOfLettersSemantics {
  (match: MatchResult): ParserAdapter;
}

// Apply the correct types to the adapter that the semantics object creates from a MatchResult
interface ParserAdapter {
  repr: string;
  pretty: string;
  bitmap(font: string, colorStrategy: ColorStrategy): HTMLCanvasElement;

  [index: string]: any;
}

semantics.addAttribute("repr", {
  Char_paren(_1, e, _2) {
    return e.repr;
  },
  BinaryOperator_concat(a, _, b) {
    return `concat(${a.repr}, ${b.repr})`;
  },
  BinaryOperator_add(a, _, b) {
    return `add(${a.repr}, ${b.repr})`;
  },
  BinaryOperator_sub(a, _, b) {
    return `sub(${a.repr}, ${b.repr})`;
  },
  BinaryOperator_and(a, _, b) {
    return `and(${a.repr}, ${b.repr})`;
  },
  BinaryOperator_or(a, _, b) {
    return `or(${a.repr}, ${b.repr})`;
  },
  BinaryOperator_xor(a, _, b) {
    return `xor(${a.repr}, ${b.repr})`;
  },
  Char_literal(_) {
    return `'${this.sourceString}'`;
  },
});

semantics.addAttribute("pretty", {
  Char_paren(_1, e, _2) {
    return `(${e.pretty})`;
  },
  BinaryOperator_concat(a, _, b) {
    return `${a.pretty} || ${b.pretty}`;
  },
  BinaryOperator_add(a, _, b) {
    return `${a.pretty} + ${b.pretty}`;
  },
  BinaryOperator_sub(a, _, b) {
    return `${a.pretty} - ${b.pretty}`;
  },
  BinaryOperator_and(a, _, b) {
    return `${a.pretty} & ${b.pretty}`;
  },
  BinaryOperator_or(a, _, b) {
    return `${a.pretty} | ${b.pretty}`;
  },
  BinaryOperator_xor(a, _, b) {
    return `${a.pretty} ^ ${b.pretty}`;
  },
  Char_literal(_) {
    return `${this.sourceString}`;
  },
});

function CompositeChars(
  a: HTMLCanvasElement,
  b: HTMLCanvasElement,
  compositeOperation: GlobalCompositeOperation
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.width = Math.max(a.width, b.width);
  canvas.height = Math.max(a.height, b.height);

  const ctx = canvas.getContext("2d")!;

  let centerx = false;
  let centered_a = centerx ? (canvas.width - a.height) / 2 : 0;
  let centered_b = centerx ? (canvas.width - b.width) / 2 : 0;

  // Center vertically
  ctx.drawImage(a, centered_a, (canvas.height - a.height) / 2); // destination
  ctx.globalCompositeOperation = compositeOperation;
  ctx.drawImage(b, centered_b, (canvas.height - b.height) / 2); // source

  return canvas;
}

semantics.addOperation<HTMLCanvasElement>("bitmap(font, colorStrategy)", {
  Entry(e) {
    return e.bitmap(...Object.values(this.args));
  },
  Char_paren(_1, e, _2) {
    return e.bitmap(...Object.values(this.args));
  },
  BinaryOperator_concat(first, _, second) {
    let a = first.bitmap(...Object.values(this.args));
    let b = second.bitmap(...Object.values(this.args));

    const canvas = document.createElement("canvas");

    canvas.width = a.width + b.width;
    canvas.height = Math.max(a.height, b.height);

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(a, 0, (canvas.height - a.height) / 2);
    ctx.drawImage(b, a.width, (canvas.height - b.height) / 2);

    return canvas;
  },
  BinaryOperator_add(a, _, b) {
    return CompositeChars(
      a.bitmap(...Object.values(this.args)),
      b.bitmap(...Object.values(this.args)),
      "source-over"
    );
  },
  BinaryOperator_sub(a, _, b) {
    return CompositeChars(
      a.bitmap(...Object.values(this.args)),
      b.bitmap(...Object.values(this.args)),
      "destination-out"
    );
  },
  BinaryOperator_and(a, _, b) {
    return CompositeChars(
      a.bitmap(...Object.values(this.args)),
      b.bitmap(...Object.values(this.args)),
      "source-in"
    );
  },
  BinaryOperator_or(a, _, b) {
    return CompositeChars(
      a.bitmap(...Object.values(this.args)),
      b.bitmap(...Object.values(this.args)),
      "source-over"
    );
  },
  BinaryOperator_xor(a, _, b) {
    return CompositeChars(
      a.bitmap(...Object.values(this.args)),
      b.bitmap(...Object.values(this.args)),
      "xor"
    );
  },
  Char_literal(_) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    ctx.font = this.args.font;
    const textMetrics = ctx.measureText(this.sourceString);

    canvas.width = textMetrics.width;
    canvas.height =
      textMetrics.actualBoundingBoxAscent +
      textMetrics.actualBoundingBoxDescent;

    ctx.font = this.args.font;

    const color: Color = this.args.colorStrategy.next().value;
    ctx.fillStyle = color.to("hsl").toString();

    ctx.fillText(this.sourceString, 0, textMetrics.actualBoundingBoxAscent);

    return canvas;
  },
});

export { grammar, semantics };
export { DefaultColorStrategy } from "./colors";
