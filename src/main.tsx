import './styles.css'
import { grammar, semantics } from './parser';
import { createSignal, createMemo, createEffect, Show } from "solid-js";
import { render } from "solid-js/web";
import { MatchResult } from 'ohm-js';

const DEFAULT_EXPRESSION = "A + B || 8 & 0 || G - K";

function ExpressionRenderer(props: { match: MatchResult, fontSize: string, fontFamily: string, class: string} ) {
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

function Input(props: any) {
    return  <div class="flex p-0 border-0 border-b-4 text-gray-900 border-gray-400  focus-within:border-indigo-400 focus:ring-inset sm:leading-6">
        <input
            {...props}
            type="text"
            class="block border-0 my-0 w-full focus:ring-0 mx-2 px-1 py-0.5 text-lg border-t border-t-gray-300 justify-center placeholder:text-gray-400 focus:border-t-gray-300"
        />
    </div>
}

const App = () => {
    const [text, setText] = createSignal(DEFAULT_EXPRESSION);
    const [fontSize, setFontSize] = createSignal(300);

    const match = createMemo(() => grammar.match(text()))

    createEffect(() => {
        if (match().succeeded()) { return }

        console.warn(match().message)
    })
  
    return <div class="grid relative">
        <div id="headerbox" class="left-0 right-0 top-0 p-2 bg-gray-800">
            <h1 class="text-2xl font-display text-gray-100">Arithmetic of Letters</h1>
        </div>

        <div id="displaybox" class="grid notsticky top-0 justify-center">
            <ExpressionRenderer
                fontFamily='roboto'
                fontSize={`${fontSize()}px`}
                match={match()}
                class="h-60 justify-self-center hover:drop-shadow" 
            />
            <Show when={match().failed()}>
                <pre class="text-rose-500 mx-2">{match().message}</pre>
            </Show>
        </div>
        
        <div id="inputbox" class="fixed bottom-2 left-2 right-2 ">
            <Input 
                oninput={(e) => setText(e.currentTarget.value)}
                value={text()}
                name="expression"
                placeholder='expression'
            />
        </div>
    
        <div id="controlsbox" class="grid px-4 py-2">
            <label for="fontsize" class="m-1">Font Size</label>
            <input name="fontsize" type="range" min="2" max="1000"
                oninput={(e) => setFontSize(parseInt(e.currentTarget.value))} 
                value={fontSize()}
            />
            <label for="fontfamily" class="m-1">Font Family (Coming Soon)</label>
            <label for="colorstrategy" class="m-1">Color Palette (Coming Soon)</label>
        </div>
        
        <div id="infobox" class="px-4 py-2">
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
        </div>

        <div id="footerbox" class="pb-14"></div>
    </div>
};

document.addEventListener('DOMContentLoaded', async () => {
    const fontFace = new FontFace("roboto", `url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2)`);
    document.fonts.add(await fontFace.load())

    render(() => <App />, document.getElementById("app")!);
})