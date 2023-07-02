import './styles.css'
import { grammar, semantics } from './parser';
import { createSignal, createMemo, createEffect, Show } from "solid-js";
import { render } from "solid-js/web";
import { MatchResult } from 'ohm-js';

const DEFAULT_EXPRESSION = "A + B || 8 & 0 || G - K";

const App = () => {
    const [text, setText] = createSignal(DEFAULT_EXPRESSION);

    const match = createMemo(() => grammar.match(text()))

    createEffect(() => {
        if (match().succeeded()) { return }

        console.warn(match().message)
    })
  
    return <>
        <ExpressionRenderer match={match()}></ExpressionRenderer>
        <input class="input" oninput={(e) => setText(e.currentTarget.value)} value={text()}/>
        <Show when={match().failed()}>
            <pre class="error">{match().message}</pre>
        </Show> 

        <pre class="info">{`
|| concat
+  add
-  subtract
&  and
|  or
^  xor
() parentheses
any unicode character
`}</pre>

        <pre class="source">
            {(grammar as any).source.sourceString}
        </pre>
    </>
};

export function ExpressionRenderer(props: { match: MatchResult}) {
    const [ renderedImage, setRenderedImage ] = createSignal("")

    createEffect(async () => {
        if (props.match.failed()) { return }

        const adapter = semantics(props.match)
        const bitmap = adapter.bitmap()
    
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        canvas.getContext('bitmaprenderer')?.transferFromImageBitmap(bitmap)

        const blob = await canvas.convertToBlob();

        const url =  URL.createObjectURL(blob)
        setRenderedImage(url)
    })

    return <img class="output" src={renderedImage()}></img>
}


document.addEventListener('DOMContentLoaded', async () => {
    const fontFace = new FontFace("roboto", `url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2)`);
    document.fonts.add(await fontFace.load())

    render(() => <App />, document.getElementById("app")!);
})

