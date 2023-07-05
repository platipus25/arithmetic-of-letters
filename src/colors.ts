import Color from "colorjs.io";

export type ColorStrategy = Generator<Color>;

export function* HslWheelStrategy(start: Color, step: number): ColorStrategy {
  let color: Color = start.to("hsl");

  while (true) {
    yield color;
    color.hsl.h += step;
    color.hsl.h %= 360;
  }
}

// Lch is a perceptual color space in CSS colors Level 4
// https://css.land/lch/
export function* LchWheelStrategy(start: Color, step: number): ColorStrategy {
  let color: Color = start.to("lch");

  while (true) {
    yield color;
    color.lch.h += step;
    color.lch.h %= 360;
  }
}

export function* PaletteStrategy(palette: Color[]): ColorStrategy {
  while (true) {
    for (const color of palette) {
      yield color;
    }
  }
}

export function* UniformColorStrategy(color: Color): ColorStrategy {
  while (true) {
    yield color;
  }
}

export function DefaultColorStrategy(): ColorStrategy {
  return HslWheelStrategy(new Color("hsl(0 100% 60%)"), 70.0);
}

export { Color };
