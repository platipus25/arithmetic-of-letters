import grammar from './arithmeticofletters.ohm-bundle'

const semantics = grammar.createSemantics()

semantics.addOperation('repr', {
    ConcatExp(a, _, b) { return `concat(${a.repr()}, ${b.repr()})` },
    PriExp(_1, e, _2) { return e.repr() },
    AddExp(a, _, b) { return `add(${a.repr()}, ${b.repr()})` },
    SubExp(a, _, b) { return `sub(${a.repr()}, ${b.repr()})` },
    XorExp(a, _, b) { return `xor(${a.repr()}, ${b.repr()})` },
    CharLiteral(_) {
        return `'${this.sourceString}'`
    },
})

//let charRenderingCanvas = new OffscreenCanvas(1000, 1000)
let color = 0;

semantics.addOperation<ImageBitmap>('bitmap', {
    PriExp(_1, e, _2) { return e.bitmap() },
    ConcatExp(first, _, second) {
        let a = first.bitmap()
        let b = second.bitmap()

        let width = a.width + b.width;
        let height = Math.max(a.height, b.height);

        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(a, 0, 0)
        ctx.drawImage(b, a.width, 0)

        return canvas.transferToImageBitmap()
    },
    AddExp(first, _, second) { 
        let a = first.bitmap()
        let b = second.bitmap()
        
        let width = Math.max(a.width, b.width);
        let height = Math.max(a.height, b.height);
        
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!
        
        ctx.drawImage(a, 0, 0) // destination
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(b, 0, 0) // source
        
        return canvas.transferToImageBitmap()
    },
    SubExp(first, _, second) {
        let a = first.bitmap()
        let b = second.bitmap()

        let width = Math.max(a.width, b.width);
        let height = Math.max(a.height, b.height);
        
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!

        ctx.drawImage(a, 0, 0) // destination
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(b, 0, 0) // source
        
        return canvas.transferToImageBitmap()
    },
    XorExp(first, _, second) {
        let a = first.bitmap()
        let b = second.bitmap()

        let width = Math.max(a.width, b.width);
        let height = Math.max(a.height, b.height);
        
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!

        ctx.drawImage(a, 0, 0) // destination
        ctx.globalCompositeOperation = "xor";
        ctx.drawImage(b, 0, 0) // source
        
        return canvas.transferToImageBitmap()
    },
    CharLiteral(_) {
        const font = "100px monospace";

        let canvas = new OffscreenCanvas(100, 100);
        let ctx = canvas.getContext('2d')! 

        ctx.font = font;
        const textMetrics = ctx.measureText(this.sourceString);

        let width = textMetrics.width;
        let height = textMetrics.fontBoundingBoxAscent + textMetrics.fontBoundingBoxDescent;

        canvas = new OffscreenCanvas(width, height);
        ctx = canvas.getContext('2d')! 
    
        ctx.font = font;
        ctx.fillStyle = `hsl(${color % 360.0}, 100%, 60%)`
        color += 80.0

        ctx.fillText(this.sourceString, 0, textMetrics.fontBoundingBoxAscent)
    
        
        return canvas.transferToImageBitmap()
    },
})

let result = grammar.match("(G - H) || (J ^ H) || (M + N) + (O + P)")
let adapter = semantics(result)

console.log("HI")
console.log(result, result.succeeded(), adapter.repr())

document.addEventListener('DOMContentLoaded', async () => {
    await update(
        document.getElementById("input")! as HTMLInputElement,
        document.getElementById("output")! as HTMLImageElement,
    )
})

async function render(text: string) : Promise<Blob> {
    let result = grammar.match(text)
    if (result.failed()) {
        throw SyntaxError(`Failed to parse: ${result.message}`)
    }
    let adapter = semantics(result)
    let bitmap = adapter.bitmap()
    color = 0;

    let canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    let ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    const blob = await canvas.convertToBlob()
    return blob
}

async function update(input: HTMLInputElement, output: HTMLImageElement) {
    await render(input.value).then((blob) => {
        const url = URL.createObjectURL(blob);
        output.src = url
    }).catch((err) => console.error(err))
}

document.getElementById("input")?.addEventListener('input', async (event) => {
    await update(
        event.target! as HTMLInputElement,
        document.getElementById('output')! as HTMLImageElement,
    )
})