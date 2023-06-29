import './styles.css'
import { grammar, semantics } from './parser';

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('source')!.innerText = (grammar as any).source.sourceString

    const fontFace = new FontFace("roboto", `url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2)`);
    document.fonts.add(await fontFace.load())

    await update(
        document.getElementById("input")! as HTMLInputElement,
        document.getElementById("output")! as HTMLImageElement,
    )
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
    canvas.getContext('bitmaprenderer')?.transferFromImageBitmap(bitmap)
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