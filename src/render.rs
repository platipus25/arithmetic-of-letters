use crate::color::ColorStrategy;
use fontdue::{Font, Metrics};
use tiny_skia::{BlendMode, Color, IntSize, Paint, Pixmap, PixmapPaint, Rect, Transform};

#[derive(Clone)]
pub struct RenderOptions {
    pub font: Font,
    pub font_size: f32,
    pub color_strategy: fn() -> ColorStrategy,
}

pub fn composite(lhs: Pixmap, rhs: Pixmap, mode: BlendMode, _options: &RenderOptions) -> Pixmap {
    let mut canvas =
        Pixmap::new(lhs.width().max(rhs.width()), lhs.height().max(rhs.width())).unwrap();

    canvas.draw_pixmap(
        0,
        0,
        lhs.as_ref(),
        &PixmapPaint::default(),
        Transform::identity(),
        None,
    );

    let paint = PixmapPaint {
        blend_mode: mode,
        ..Default::default()
    };

    canvas.draw_pixmap(
        0,
        0,
        rhs.as_ref(),
        &paint,
        Transform::identity(),
        None,
    );

    canvas
}

pub fn concat(lhs: Pixmap, rhs: Pixmap, mode: BlendMode, _options: &RenderOptions) -> Pixmap {
    let mut canvas = Pixmap::new(lhs.width() + rhs.width(), lhs.height().max(rhs.width())).unwrap();

    canvas.draw_pixmap(
        0,
        0,
        lhs.as_ref(),
        &PixmapPaint::default(),
        Transform::identity(),
        None,
    );

    let paint = PixmapPaint {
        blend_mode: mode,
        ..Default::default()
    };

    canvas.draw_pixmap(
        lhs.width().try_into().unwrap(),
        0,
        rhs.as_ref(),
        &paint,
        Transform::identity(),
        None,
    );

    canvas
}

pub fn render_char(
    text: &str,
    options: &RenderOptions,
    color_strategy: &mut ColorStrategy,
) -> Pixmap {
    let first_char = text.chars().next().unwrap();

    let (metrics, char_bitmap) = rasterize_char(first_char, options);

    let mut canvas = Pixmap::new(
        metrics.advance_width as u32,
        options.font_size as u32,
    )
    .unwrap();

    let transform = Transform::identity();//Transform::from_translate(metrics.bounds.xmin, -metrics.bounds.ymin);

    canvas.draw_pixmap(
        0,
        0,
        char_bitmap.as_ref(),
        &PixmapPaint::default(),
        transform,
        None,
    );

    let color = color_strategy.next().unwrap();
    let color = Color::from_rgba(color.red, color.green, color.blue, color.alpha).unwrap();

    //paint.set_color(color);

    let mut paint = Paint::default();
    paint.set_color(color);
    paint.blend_mode = BlendMode::SourceIn;

    canvas.fill_rect(
        Rect::from_xywh(0.0, 0.0, canvas.width() as f32, canvas.height() as f32).unwrap(),
        &paint,
        Transform::identity(),
        None,
    );

    canvas
}

fn rasterize_char(text: char, options: &RenderOptions) -> (Metrics, Pixmap) {
    let (metrics, bitmap) = options.font.rasterize_subpixel(text, options.font_size);

    assert_eq!(bitmap.len(), metrics.width * metrics.height * 3);

    let rgba_bitmap = bitmap
        .chunks_exact(3)
        .flat_map(|chunk| {
            [
                chunk[0],
                chunk[1],
                chunk[2],
                chunk[0].min(chunk[1]).min(chunk[2]),
            ]
        })
        .collect::<Vec<u8>>();

    println!("{} {:?}", text, metrics);
    assert_eq!(rgba_bitmap.len(), metrics.width * metrics.height * 4);

    let size: IntSize = IntSize::from_wh(
        metrics.width.try_into().unwrap(),
        metrics.height.try_into().unwrap(),
    )
    .unwrap();

    (metrics, Pixmap::from_vec(rgba_bitmap, size).unwrap())
}
