import grammar from './arithmeticofletters.ohm-bundle'

const semantics = grammar.createSemantics()

semantics.addAttribute('repr', {
    Char_paren(_1, e, _2) { return e.repr },
    BinaryOperator_concat(a, _, b) { return `concat(${a.repr}, ${b.repr})` },
    BinaryOperator_add(a, _, b) { return `add(${a.repr}, ${b.repr})` },
    BinaryOperator_sub(a, _, b) { return `sub(${a.repr}, ${b.repr})` },
    BinaryOperator_and(a, _, b) { return `and(${a.repr}, ${b.repr})` },
    BinaryOperator_or(a, _, b) { return `or(${a.repr}, ${b.repr})` },
    BinaryOperator_xor(a, _, b) { return `xor(${a.repr}, ${b.repr})` },
    Char_literal(_) {
        return `'${this.sourceString}'`
    },
})

semantics.addAttribute('pretty', {
    Char_paren(_1, e, _2) { return `(${e.pretty})` },
    BinaryOperator_concat(a, _, b) { return `${a.pretty} || ${b.pretty}` },
    BinaryOperator_add(a, _, b) { return `${a.pretty} + ${b.pretty}` },
    BinaryOperator_sub(a, _, b) { return `${a.pretty} - ${b.pretty}` },
    BinaryOperator_and(a, _, b) { return `${a.pretty} & ${b.pretty}` },
    BinaryOperator_or(a, _, b) { return `${a.pretty} | ${b.pretty}` },
    BinaryOperator_xor(a, _, b) { return `${a.pretty} ^ ${b.pretty}` },
    Char_literal(_) {
        return `${this.sourceString}`
    },
})

let hue: number = 0;
let font = "100px roboto";

function CompositeChars(a: ImageBitmap, b: ImageBitmap, compositeOperation: GlobalCompositeOperation) {
    let width = Math.max(a.width, b.width);
    let height = Math.max(a.height, b.height);
    
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')!
    
    ctx.drawImage(a, 0, 0) // destination
    ctx.globalCompositeOperation = compositeOperation;
    ctx.drawImage(b, 0, 0) // source
    
    return canvas.transferToImageBitmap()
}

semantics.addOperation<ImageBitmap>('bitmap', {
    Char_paren(_1, e, _2) { return e.bitmap() },
    BinaryOperator_concat(first, _, second) {
        let a = first.bitmap()
        let b = second.bitmap()
        hue = 0;

        let width = a.width + b.width;
        let height = Math.max(a.height, b.height);

        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(a, 0, 0)
        ctx.drawImage(b, a.width, 0)

        return canvas.transferToImageBitmap()
    },
    BinaryOperator_add(a, _, b) { 
        return CompositeChars(a.bitmap(), b.bitmap(), "source-over");
    },
    BinaryOperator_sub(a, _, b) {
        return CompositeChars(a.bitmap(), b.bitmap(), "destination-out");
    },
    BinaryOperator_and(a, _, b) {
        return CompositeChars(a.bitmap(), b.bitmap(), "source-in");
    },
    BinaryOperator_or(a, _, b) {
        return CompositeChars(a.bitmap(), b.bitmap(), "source-over");
    },
    BinaryOperator_xor(a, _, b) {
        return CompositeChars(a.bitmap(), b.bitmap(), "xor");
    },
    Char_literal(_) {
        let canvas = new OffscreenCanvas(100, 100);
        let ctx = canvas.getContext('2d')! 

        ctx.font = font;
        const textMetrics = ctx.measureText(this.sourceString);

        let width = textMetrics.width;
        let height = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;

        canvas = new OffscreenCanvas(width, height);
        ctx = canvas.getContext('2d')! 
    
        ctx.font = font;
        ctx.fillStyle = `hsl(${hue % 360}, 100%, 60%)`
        hue += 80.0

        ctx.fillText(this.sourceString, 0, textMetrics.fontBoundingBoxAscent)
    
        
        return canvas.transferToImageBitmap()
    },
})

export {
  grammar,
  semantics 
};