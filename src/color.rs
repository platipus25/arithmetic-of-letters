use palette::{FromColor, Hsl, Lch, ShiftHueAssign, Srgba};

pub type ColorStrategy = Box<dyn Iterator<Item = Srgba>>;

pub struct DefaultColorStrategy(HslWheelStrategy);

impl DefaultColorStrategy {
    pub fn new() -> Self {
        DefaultColorStrategy(HslWheelStrategy::new(Hsl::new(0.0, 1.0, 0.60), 70.0))
    }
}

impl Default for DefaultColorStrategy {
    fn default() -> Self {
        Self::new()
    }
}

impl Iterator for DefaultColorStrategy {
    type Item = Srgba;

    fn next(&mut self) -> Option<Self::Item> {
        self.0.next()
    }
}

pub struct LchWheelStrategy {
    color: Lch,
    step: f32,
}

impl LchWheelStrategy {
    pub fn new(start: Lch, step: f32) -> Self {
        LchWheelStrategy { color: start, step }
    }
}

impl Iterator for LchWheelStrategy {
    type Item = Srgba;

    fn next(&mut self) -> Option<Self::Item> {
        self.color.shift_hue_assign(self.step);

        Some(Srgba::from_color(self.color))
    }
}

pub struct HslWheelStrategy {
    color: Hsl,
    step: f32,
}

impl HslWheelStrategy {
    pub fn new(start: Hsl, step: f32) -> Self {
        HslWheelStrategy { color: start, step }
    }
}

impl Iterator for HslWheelStrategy {
    type Item = Srgba;

    fn next(&mut self) -> Option<Self::Item> {
        self.color.shift_hue_assign(self.step);

        Some(Srgba::from_color(self.color))
    }
}

pub struct UniformColorStrategy(Srgba);

impl Iterator for UniformColorStrategy {
    type Item = Srgba;

    fn next(&mut self) -> Option<Self::Item> {
        Some(self.0)
    }
}
