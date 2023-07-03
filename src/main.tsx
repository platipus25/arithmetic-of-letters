import './styles.css'
import { grammar, semantics } from './parser';
import { createSignal, createMemo, createEffect, Show } from "solid-js";
import { render } from "solid-js/web";
import { MatchResult } from 'ohm-js';

const DEFAULT_EXPRESSION = "A + B || 8 & 0 || G - K";

export function ExpressionRenderer(props: { match: MatchResult, fontSize: string, fontFamily: string, class: string} ) {
    const [ renderedImage, setRenderedImage ] = createSignal("")

    createEffect(async () => {
        if (props.match.failed()) { return }

        const adapter = semantics(props.match)
        const bitmap = adapter.bitmap(`${props.fontSize} ${props.fontFamily}, sans-serif`)
    
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        canvas.getContext('bitmaprenderer')?.transferFromImageBitmap(bitmap)

        const blob = await canvas.convertToBlob();

        const url =  URL.createObjectURL(blob)
        setRenderedImage(url)
    })

    return <a href={renderedImage()} class="contents" download><img class={props.class} src={renderedImage()} /></a>
}

const App = () => {
    const [text, setText] = createSignal(DEFAULT_EXPRESSION);
    const [fontSize, setFontSize] = createSignal(300);

    const match = createMemo(() => grammar.match(text()))

    createEffect(() => {
        if (match().succeeded()) { return }

        console.warn(match().message)
    })
  
    return <>
        <div class="grid relative mt-2 rounded-md">
            <ExpressionRenderer
                fontFamily='roboto'
                fontSize={`${fontSize()}px`}
                match={match()}
                class="h-60 justify-self-center hover:drop-shadow"
            />
            <input
                type="text"
                name="expression"
                class="block rounded-md border-0 py-1.5 text-gray-900 text-xl ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6"
                oninput={(e) => setText(e.currentTarget.value)}
                value={text()}
            />
            <label for="fontsize">Font Size</label>
            <input name="fontsize" type="range" min="2" max="1000"
                oninput={(e) => setFontSize(parseInt(e.currentTarget.value))} 
                value={fontSize()}
            />
            <Show when={match().failed()}>
                <pre class="error">{match().message}</pre>
            </Show>
        </div>
        <pre>{`
|| concat
+  add
-  subtract
&  and
|  or
^  xor
() parentheses
any unicode character
`}</pre>

        <pre>
            {(grammar as any).source.sourceString}
        </pre>
    </>
};

document.addEventListener('DOMContentLoaded', async () => {
    const fontFace = new FontFace("roboto", `url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2)`);
    document.fonts.add(await fontFace.load())

    render(() => <App />, document.getElementById("app")!);
})