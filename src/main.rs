use tiny_skia::{
    BlendMode, Color, IntSize, Mask, Paint, Pixmap, PixmapPaint, Rect, Shader, Transform,
};
use fontdue::{Font, FontSettings};

fn main() {
    println!("Hello, world!");

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
