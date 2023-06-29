import './styles.css'
import grammar from './arithmeticofletters.ohm-bundle'

const semantics = grammar.createSemantics()

semantics.addOperation('repr', {
    Char_paren(_1, e, _2) { return e.repr() },
    Expr_concat(a, _, b) { return `concat(${a.repr()}, ${b.repr()})` },
    Expr_add(a, _, b) { return `add(${a.repr()}, ${b.repr()})` },
    Expr_sub(a, _, b) { return `sub(${a.repr()}, ${b.repr()})` },
    Expr_and(a, _, b) { return `and(${a.repr()}, ${b.repr()})` },
    Expr_or(a, _, b) { return `or(${a.repr()}, ${b.repr()})` },
    Expr_xor(a, _, b) { return `xor(${a.repr()}, ${b.repr()})` },
    Char_literal(_) {
        return `'${this.sourceString}'`
    },
})

semantics.addOperation('pretty', {
    Char_paren(_1, e, _2) { return `(${e.pretty()})` },
    Expr_concat(a, _, b) { return `${a.pretty()} || ${b.pretty()}` },
    Expr_add(a, _, b) { return `${a.pretty()} + ${b.pretty()}` },
    Expr_sub(a, _, b) { return `${a.pretty()} - ${b.pretty()}` },
    Expr_and(a, _, b) { return `${a.pretty()} & ${b.pretty()}` },
    Expr_or(a, _, b) { return `${a.pretty()} | ${b.pretty()}` },
    Expr_xor(a, _, b) { return `${a.pretty()} ^ ${b.pretty()}` },
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
    Expr_concat(first, _, second) {
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
    Expr_add(a, _, b) { 
        return CompositeChars(a.bitmap(), b.bitmap(), "source-over");
    },
    Expr_sub(a, _, b) {
        return CompositeChars(a.bitmap(), b.bitmap(), "destination-out");
    },
    Expr_and(a, _, b) {
        return CompositeChars(a.bitmap(), b.bitmap(), "source-in");
    },
    Expr_or(a, _, b) {
        return CompositeChars(a.bitmap(), b.bitmap(), "source-over");
    },
    Expr_xor(a, _, b) {
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

document.addEventListener('DOMContentLoaded', async () => {
    const fontFace = new FontFace("roboto", `url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2)`);
    document.fonts.add(await fontFace.load())

    await update(
        document.getElementById("input")! as HTMLInputElement,
        document.getElementById("output")! as HTMLImageElement,
    )

    document.getElementById('source')!.innerText = grammar.source.sourceString
})

async function update(input: HTMLInputElement, output: HTMLImageElement) {
    let result = grammar.match(input.value)
    if (result.failed()) {
        console.warn(`Failed to parse: ${result.message}`)
        return
    }
    let adapter = semantics(result)  
    
    let bitmap = adapter.bitmap()

    let canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    let ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    const blob = await canvas.convertToBlob()
    const url = URL.createObjectURL(blob);
    output.src = url
}

document.getElementById("input")?.addEventListener('input', async (event) => {
    await update(
        event.target! as HTMLInputElement,
        document.getElementById('output')! as HTMLImageElement,
    )
})