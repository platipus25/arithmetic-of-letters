import "./styles.css";
import { grammar, semantics } from "./parser";
import { createSignal, createMemo, createEffect, For, Show } from "solid-js";
import { render } from "solid-js/web";
import { MatchResult } from "ohm-js";
import {
  Color,
  DefaultColorStrategy,
  UniformColorStrategy,
  LchWheelStrategy,
  PaletteStrategy,
  ColorStrategy,
} from "./colors";

// TODO: polyfill OffscreenCanvas
// TODO: save things in LocalStorage

const DEFAULT_EXPRESSION = "A + B || 8 & 0 || G - K";

const colorStrategies = [
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
  {
    name: "Pride Flag",
    strategy: () => {
      const palette = [
        new Color("#FF0018"),
        new Color("#FFA52C"),
        new Color("#FFFF41"),
        new Color("#008018"),
        new Color("#0000F9"),
        new Color("#86007D"),
      ];
      return PaletteStrategy(palette);
    },
  },
];

const fonts = [
  {
    name: "Roboto",
  },
  {
    name: "Courier New, Courier",
  },
  {
    name: "Helvetica, Arial",
  },
  {
    name: "Georgia",
  },
  {
    name: "Times New Roman, Times",
  },
];

function ExpressionRenderer(props: {
  match: MatchResult;
  fontSize: string;
  fontFamily: string;
  colorStrategy: () => ColorStrategy;
  renderedImage: string;
  setRenderedImage: (url: string) => void;
  class: string;
}) {
  const font = () => `${props.fontSize} ${props.fontFamily}, sans-serif`;

  createEffect(async () => {
    if (props.match.failed()) {
      return;
    }

    const adapter = semantics(props.match);
    const bitmap = adapter.bitmap(font(), props.colorStrategy());

    const url = bitmap.toDataURL("image/png");
    props.setRenderedImage(url);
  });

  return (
    <a href={props.renderedImage} class="contents" download>
      <img class={props.class} src={props.renderedImage} />
    </a>
  );
}

const App = () => {
  const [text, setText] = createSignal(DEFAULT_EXPRESSION);
  const [fontSize, setFontSize] = createSignal(300);
  const [font, setFont] = createSignal(fonts[0].name);
  const [colorStrategy, setColorStrategy] = createSignal(DefaultColorStrategy);
  const [renderedImage, setRenderedImage] = createSignal("/banner.png");

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
    <div class="grid relative auto-cols-auto md:grid-flow-col md:grid-cols-min-content dark:bg-neutral-700 grid-rows-min-content h-full w-full min-h-screen">
      <div
        id="headerbox"
        class="col-span-full text-center p-2 bg-gray-300 dark:bg-neutral-900 max-h-fit"
      >
        <h1 class="text-2xl font-display text-black dark:text-gray-300">
          Arithmetic of Letters
        </h1>
      </div>

      <div
        id="displaybox"
        class="grid md:col-span-2 md:col-start-2 grid-flow-row md:grid-rows-3 grid-cols-1 place-items-center"
      >
        <div id="expressionbox" class="overflow-x-scroll max-w-full">
          <ExpressionRenderer
            fontFamily={font()}
            fontSize={`${fontSize()}px`}
            colorStrategy={colorStrategy()}
            match={match()}
            renderedImage={renderedImage()}
            setRenderedImage={setRenderedImage}
            class="h-60 justify-self-center hover:drop-shadow m-4 max-w-fit min-w-full"
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
        class="md:bg-gray-200 md:dark:bg-neutral-800 col-start-1 md:row-start-2 row-span-2 md:drop-shadow-md dark:text-gray-200 md:overflow-y-scroll"
      >
        <div id="controlsbox" class="grid px-4 py-2 gap-2">
          <a href={renderedImage()} download="download.png" class="contents">
            <button
              class="p-2 mt-1 bg-blue-600 rounded-sm active:bg-blue-500 text-white disabled:bg-gray-400 disabled:text-gray-200"
              disabled={match().failed()}
            >
              Download Render
            </button>
          </a>
          <label for="fontsize">Render Quality</label>
          <input
            id="fontsize"
            name="fontsize"
            type="range"
            min="2"
            max="1000"
            oninput={(e) => setFontSize(parseInt(e.currentTarget.value))}
            value={fontSize()}
          />
          <label for="colorstrategy">Color Palette</label>
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
          <label for="fontfamily">Font Family</label>
          <select
            name="fontfamily"
            id="fontfamily"
            class="dark:bg-inherit"
            oninput={(e) => {
              const index = e.currentTarget.selectedIndex;
              const font = fonts[index];
              if (font != undefined) {
                setFont(() => font.name);
              }
            }}
          >
            <For each={fonts}>
              {(item, i) => <option value={`${i}`}>{item.name}</option>}
            </For>
          </select>
        </div>

        <div id="infobox" class="flex flex-col gap-2 px-4 py-2">
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
      <div
        id="footerbox"
        class="flex py-4 md:col-start-2 self-end gap-4 place-content-center"
      >
        🫨
        <a
          href="https://github.com/platipus25/arithmetic-of-letters"
          class="text-blue-400 hover:underline hover:text-blue-300"
        >
          GitHub
        </a>
      </div>
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
