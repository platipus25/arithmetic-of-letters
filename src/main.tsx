import "./styles.css";
import { grammar, semantics, DefaultColorStrategy } from "./parser";
import { createSignal, createMemo, createEffect, Show } from "solid-js";
import { render } from "solid-js/web";
import { MatchResult } from "ohm-js";

const DEFAULT_EXPRESSION = "A + B || 8 & 0 || G - K";

function ExpressionRenderer(props: {
  match: MatchResult;
  fontSize: string;
  fontFamily: string;
  class: string;
}) {
  const [renderedImage, setRenderedImage] = createSignal("");

  const font = () => `${props.fontSize} ${props.fontFamily}, sans-serif`;

  createEffect(async () => {
    if (props.match.failed()) {
      return;
    }

    const adapter = semantics(props.match);
    const bitmap = adapter.bitmap(font(), DefaultColorStrategy());

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    canvas.getContext("bitmaprenderer")?.transferFromImageBitmap(bitmap);

    const blob = await canvas.convertToBlob();

    const url = URL.createObjectURL(blob);
    setRenderedImage(url);
  });

  return (
    <a href={renderedImage()} class="contents" download>
      <img class={props.class} src={renderedImage()} />
    </a>
  );
}

function Input(props: any) {
  return (
    <div class="flex p-0 border-0 border-b-4 text-gray-900 border-indigo-500 dark:text-gray-300 focus-within:border-indigo-400 focus:ring-inset sm:leading-6">
      <input
        {...props}
        type="text"
        class="block dark:bg-inherit border-0 my-0 w-full focus:ring-0 mx-2 px-1 py-0.5 text-lg border-t dark:border-neutral-600 dark:focus:border-neutral-600 focus:border-gray-300  border-gray-300 justify-center placeholder:text-gray-400"
      />
    </div>
  );
}

const App = () => {
  const [text, setText] = createSignal(DEFAULT_EXPRESSION);
  const [fontSize, setFontSize] = createSignal(300);

  const match = createMemo(() => grammar.match(text()));

  const prettyText = () => {
    if (match().failed()) {
      return text();
    }
    const adapter = semantics(match());
    setText(adapter.pretty);
  };

  createEffect(() => {
    if (match().succeeded()) {
      return;
    }

    console.warn(match().message);
  });

  return (
    <div class="grid relative auto-cols-auto md:grid-flow-col md:grid-cols-3 dark:bg-neutral-700 grid-rows-min-content">
      <div
        id="headerbox"
        class="col-span-full left-0 right-0 top-0 p-2 bg-gray-300 dark:bg-neutral-900 max-h-fit"
      >
        <h1 class="text-2xl font-display text-black dark:text-gray-300">
          Arithmetic of Letters
        </h1>
      </div>

      <div
        id="displaybox"
        class="grid md:col-span-2 md:col-start-2 grid-flow-row md:grid-rows-3 grid-cols-1 place-items-center"
      >
        <div id="expressionbox" class="overflow-scroll max-w-full">
          <ExpressionRenderer
            fontFamily="roboto"
            fontSize={`${fontSize()}px`}
            match={match()}
            class="h-60 justify-self-center hover:drop-shadow m-auto max-w-fit min-w-full"
          />
        </div>
        <pre class="text-rose-500 mx-2 order-3 md:order-2">
          {match().message}
        </pre>

        <div
          id="inputbox"
          class="sticky p-4 justify-self-stretch order-2 md:order-3"
        >
          <Input
            oninput={(e: InputEvent & { currentTarget: HTMLInputElement }) =>
              setText(e.currentTarget.value)
            }
            onfocusout={() => prettyText()}
            value={text()}
            name="expression"
            placeholder="expression"
          />
        </div>
      </div>

      <div
        id="sidebar"
        class="md:bg-gray-200 md:dark:bg-neutral-800 col-start-1 md:row-start-2 row-span-1 md:drop-shadow-md dark:text-gray-200"
      >
        <div id="controlsbox" class="grid px-4 py-2">
          <label for="fontsize" class="m-1">
            Font Size
          </label>
          <input
            name="fontsize"
            type="range"
            min="2"
            max="1000"
            oninput={(e) => setFontSize(parseInt(e.currentTarget.value))}
            value={fontSize()}
          />
          <label for="fontfamily" class="m-1">
            Font Family (Coming Soon)
          </label>
          <label for="colorstrategy" class="m-1">
            Color Palette (Coming Soon)
          </label>
        </div>

        <div
          id="infobox"
          class="flex flex-col gap-2 px-4 py-2 overflow-y-scroll"
        >
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
          <pre class="overflow-x-scroll">
            {(grammar as any).source.sourceString}
          </pre>
        </div>
      </div>

      {/*<div id="footerbox" class="grid h-14 bg-gray-300 md:col-span-2 self-end place-content-center">
        🫨
        </div>*/}
    </div>
  );
};

document.addEventListener("DOMContentLoaded", async () => {
  const fontFace = new FontFace(
    "roboto",
    `url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2)`
  );
  document.fonts.add(await fontFace.load());

  render(() => <App />, document.getElementById("app")!);
});
