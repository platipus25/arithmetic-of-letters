import "./styles.css";
import { grammar, semantics } from "./parser";
import { createSignal, createMemo, createEffect, For } from "solid-js";
import { render } from "solid-js/web";
import { MatchResult } from "ohm-js";
import {
  Color,
  DefaultColorStrategy,
  UniformColorStrategy,
  LchWheelStrategy,
  ColorStrategy,
} from "./colors";

const DEFAULT_EXPRESSION = "A + B || 8 & 0 || G - K";

export const colorStrategies = [
  {
    name: "Default",
    strategy: () => {
      return DefaultColorStrategy();
    },
  },
  {
    name: "Black",
    strategy: () => UniformColorStrategy(new Color("black")),
  },
  {
    name: "Pastel",
    strategy: () => {
      return LchWheelStrategy(new Color("lch(75 70 0)"), 95);
    },
  },
  {
    name: "Rainbow",
    strategy: () => {
      return LchWheelStrategy(new Color("lch(60 70 0)"), 10);
    },
  },
  {
    name: "Glass",
    strategy: () => {
      return LchWheelStrategy(new Color("lch(60 70 0 / 0.5)"), 95);
    },
  },
];

function ExpressionRenderer(props: {
  match: MatchResult;
  fontSize: string;
  fontFamily: string;
  colorStrategy: () => ColorStrategy;
  class: string;
}) {
  const [renderedImage, setRenderedImage] = createSignal("");

  const font = () => `${props.fontSize} ${props.fontFamily}, sans-serif`;

  createEffect(async () => {
    if (props.match.failed()) {
      return;
    }

    const adapter = semantics(props.match);
    const bitmap = adapter.bitmap(font(), props.colorStrategy());

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

const App = () => {
  const [text, setText] = createSignal(DEFAULT_EXPRESSION);
  const [fontSize, setFontSize] = createSignal(300);
  const [colorStrategy, setColorStrategy] = createSignal(DefaultColorStrategy);

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
            colorStrategy={colorStrategy()}
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
          <div class="flex p-0 border-0 border-b-4 text-gray-900 border-indigo-500 dark:text-gray-300 focus-within:border-indigo-400 focus:ring-inset sm:leading-6">
            <input
              oninput={(e) => setText(e.currentTarget.value)}
              onfocusout={() => prettyText()}
              value={text()}
              name="expression"
              placeholder="expression"
              type="text"
              class="block dark:bg-inherit border-0 my-0 w-full focus:ring-0 mx-2 px-1 py-0.5 text-lg border-t dark:border-neutral-600 dark:focus:border-neutral-600 focus:border-gray-300  border-gray-300 justify-center placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div
        id="sidebar"
        class="md:bg-gray-200 md:dark:bg-neutral-800 col-start-1 md:row-start-2 row-span-1 md:drop-shadow-md dark:text-gray-200"
      >
        <div id="controlsbox" class="grid px-4 py-2 gap-2">
          <label for="fontsize" class="">
            Font Size
          </label>
          <input
            id="fontsize"
            name="fontsize"
            type="range"
            min="2"
            max="1000"
            oninput={(e) => setFontSize(parseInt(e.currentTarget.value))}
            value={fontSize()}
          />
          <label for="colorstrategy" class="">
            Color Palette
          </label>
          <select
            name="colorpalette"
            id="colorstrategy"
            class="dark:bg-inherit"
            oninput={(e) => {
              const index = e.currentTarget.selectedIndex;
              const strategy = colorStrategies[index];
              if (strategy != undefined) {
                setColorStrategy(() => strategy.strategy);
              }
            }}
          >
            <For each={colorStrategies}>
              {(item, i) => <option value={`${i}`}>{item.name}</option>}
            </For>
          </select>
          <label for="fontfamily" class="">
            Font Family (Coming Soon)
          </label>
        </div>

        <div
          id="infobox"
          class="flex flex-col gap-2 px-4 py-2 overflow-y-scroll"
        >
          <label for="reference" class="m-1">
            Syntax Reference
          </label>
          <pre id="reference" class="m-1">{`
|| concat
+  add
-  subtract
&  and
|  or
^  xor
() parentheses
any unicode character
`}</pre>
          {/*<label for="grammar">Grammar Definition</label>
          <pre id="grammar" class="overflow-x-scroll">
            {(grammar as any).source.sourceString}
          </pre>*/}
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
