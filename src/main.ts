import grammar from './arithmeticofletters.ohm-bundle'

const s = grammar.createSemantics()

s.addOperation('repr', {
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

type BitmapResult = { bitmap: ImageBitmap, width: number, height: number}


s.addOperation<BitmapResult>('bitmap', {
    PriExp(_1, e, _2) { return e.bitmap() },
    ConcatExp(first, _, second) {
        let a = first.bitmap()
        let b = second.bitmap()

        let width = a.width + b.width;
        let height = Math.max(a.height, b.height);

        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(a.bitmap, 0, 0)
        ctx.drawImage(b.bitmap, a.width, 0)

        return { 
            bitmap: canvas.transferToImageBitmap(), 
            width, 
            height,
        }
    },
    AddExp(first, _, second) { 
        let a = first.bitmap()
        let b = second.bitmap()
        
        let width = Math.max(a.width, b.width);
        let height = Math.max(a.height, b.height);
        
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!
        
        ctx.drawImage(a.bitmap, 0, 0) // destination
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(b.bitmap, 0, 0) // source
        
        return {
            bitmap: canvas.transferToImageBitmap(),
            width,
            height,
        }
    },
    SubExp(first, _, second) {
        let a = first.bitmap()
        let b = second.bitmap()

        let width = Math.max(a.width, b.width);
        let height = Math.max(a.height, b.height);
        
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!

        ctx.drawImage(a.bitmap, 0, 0) // destination
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(b.bitmap, 0, 0) // source
        
        return {
            bitmap: canvas.transferToImageBitmap(),
            width,
            height,
        }
    },
    XorExp(first, _, second) {
        let a = first.bitmap()
        let b = second.bitmap()

        let width = Math.max(a.width, b.width);
        let height = Math.max(a.height, b.height);
        
        const canvas = new OffscreenCanvas(width, height)
        const ctx = canvas.getContext('2d')!

        ctx.drawImage(a.bitmap, 0, 0) // destination
        ctx.globalCompositeOperation = "xor";
        ctx.drawImage(b.bitmap, 0, 0) // source
        
        return {
            bitmap: canvas.transferToImageBitmap(),
            width,
            height,
        }
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
    
        return {
            bitmap: canvas.transferToImageBitmap(),
            width,
            height,
        }
    },
})

let result = grammar.match("(G - H) || (J ^ H) || (M + N) + (O + P)")
let adapter = s(result)

console.log("HI")
console.log(result, result.succeeded(), adapter.repr())

document.addEventListener('DOMContentLoaded', async () => {
    
    const {bitmap, width, height} = adapter.bitmap();

    
    let canvas = new OffscreenCanvas(width, height)
    let ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0)
    const blob = await canvas.convertToBlob()
    const url = URL.createObjectURL(blob);   
    console.log(url, canvas.width, canvas.height)

    canvas = document.getElementById("output")! as HTMLCanvasElement
    ctx = canvas.getContext('2d')!;
    ctx.drawImage(bitmap, 0, 0);
})
