"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  convert,
  copyRich,
  detectFormat,
  FORMATS,
  Format,
  pasteSmart,
} from "@/lib/convert";

const SAMPLES: Record<Format, string> = {
  markdown:
    "# Hello, traveller\n\nThis is **Transmute** — a small instrument for moving text between formats.\n\n- paste from anywhere\n- copy to anywhere\n- _looks like it belongs on your desk_\n\n> Try switching the target on the right.\n\n```ts\nconst joy = (x: number) => x * 2;\n```",
  html: '<h1>Hello, traveller</h1><p>This is <strong>Transmute</strong>.</p><ul><li>paste from anywhere</li><li>copy to anywhere</li></ul>',
  ansi:
    "\x1b[1;33mHello, traveller\x1b[0m\n\nThis is \x1b[1mTransmute\x1b[0m — a \x1b[32mquiet\x1b[0m little instrument.\n\n\x1b[2m· paste from anywhere\x1b[0m\n\x1b[2m· copy to anywhere\x1b[0m",
  rich: '<h1>Hello, traveller</h1><p>This is <strong>Transmute</strong> — a quiet little instrument.</p>',
};

export default function Page() {
  const [from, setFrom] = useState<Format>("markdown");
  const [to, setTo] = useState<Format>("rich");
  const [input, setInput] = useState<string>(SAMPLES.markdown);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);

  const output = useMemo(() => {
    try {
      return convert(input, from, to);
    } catch (e) {
      return `// conversion error: ${(e as Error).message}`;
    }
  }, [input, from, to]);

  const richHtml = useMemo(() => convert(input, from, "html"), [input, from]);

  function showFlash(msg: string) {
    setFlash(msg);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1600);
  }

  async function onPaste() {
    try {
      const { text, html } = await pasteSmart();
      const detected = detectFormat(text, html);
      setFrom(detected);
      setInput(html && detected === "rich" ? html : text);
      showFlash(`pasted as ${detected}`);
    } catch {
      showFlash("clipboard blocked — paste manually");
    }
  }

  async function onCopy() {
    try {
      if (to === "rich") {
        await copyRich(output, output.replace(/<[^>]+>/g, ""));
      } else {
        await navigator.clipboard.writeText(output);
      }
      showFlash(`copied as ${to}`);
    } catch {
      showFlash("copy failed");
    }
  }

  function onDownloadPdf() {
    const isRich = to === "rich";
    const body = isRich
      ? richHtml
      : `<pre style="white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px;line-height:1.6;">${escapeHtml(
          output,
        )}</pre>`;
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>transmute — ${to}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&family=Source+Serif+4:ital,wght@1,500&display=swap" rel="stylesheet">
    <style>
      @page { size: A4; margin: 10mm; }
      body { font-family: 'Manrope', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; font-size: 11px; }
      .mp-header { display: flex; justify-content: flex-end; margin-bottom: 12px; }
      .mp-header img { height: 32px; }
      h1 { font-size: 22px; color: #1a1a1a; font-weight: 700; border-bottom: 2px solid hsl(41, 75%, 61%); padding-bottom: 6px; margin-top: 24px; }
      h2 { font-size: 17px; color: #2d3748; font-weight: 600; border-bottom: 1px solid hsl(41, 75%, 75%); padding-bottom: 4px; margin-top: 20px; }
      h3 { font-size: 14px; color: #2d3748; font-weight: 600; margin-top: 16px; }
      h4 { font-size: 12px; color: #4a5568; font-weight: 600; }
      a { color: hsl(41, 75%, 45%); }
      table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 10.5px; }
      th { background-color: hsl(41, 75%, 93%); color: #2d3748; font-weight: 600; text-align: left; padding: 6px 8px; border: 1px solid hsl(41, 75%, 80%); }
      td { padding: 5px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
      tr:nth-child(even) { background-color: #f7fafc; }
      code { font-family: Menlo, Monaco, Consolas, monospace; background-color: hsl(41, 75%, 95%); padding: 1px 4px; border-radius: 3px; font-size: 10px; }
      pre { font-family: Menlo, Monaco, Consolas, monospace; background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; font-size: 10px; white-space: pre-wrap; }
      pre code { background: none; padding: 0; }
      blockquote { border-left: 3px solid hsl(41, 75%, 61%); margin: 10px 0; padding: 6px 12px; background: hsl(41, 75%, 96%); }
      hr { border: none; border-top: 1px solid hsl(41, 75%, 80%); margin: 16px 0; }
    </style></head><body>
    <div class="mp-header"><img src="https://muehlemann.com/img/muehlemann+popp.svg" alt="mühlemann + popp"></div>
    ${body}</body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      showFlash("popup blocked — allow popups to print");
      return;
    }
    w.document.open();
    w.document.write(doc);
    w.document.close();
    const trigger = () => {
      w.focus();
      w.print();
    };
    if (w.document.readyState === "complete") trigger();
    else w.addEventListener("load", trigger);
    showFlash("opening print dialog…");
  }

  function loadSample() {
    setInput(SAMPLES[from]);
    showFlash("sample loaded");
  }

  useEffect(() => {
    function key(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "Enter") {
        e.preventDefault();
        onCopy();
      }
      if (mod && e.shiftKey && (e.key === "V" || e.key === "v")) {
        e.preventDefault();
        onPaste();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [output, to, from]);

  return (
    <main className="relative z-10 max-w-[1320px] mx-auto px-6 sm:px-10 py-10 sm:py-14">
      <Header />

      <section className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6">
        <Panel
          side="from"
          format={from}
          setFormat={(f) => {
            setFrom(f);
            if (!input || input === SAMPLES[from]) setInput(SAMPLES[f]);
          }}
          counter={`${input.length} chars`}
          actions={
            <>
              <SmallButton onClick={onPaste} kbd="⌘⇧V">paste</SmallButton>
              <SmallButton onClick={loadSample}>sample</SmallButton>
              <SmallButton onClick={() => setInput("")}>clear</SmallButton>
            </>
          }
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="w-full h-[60vh] bg-transparent outline-none text-[13.5px] text-ink leading-[1.7] resize-none placeholder:text-ink-faint"
            placeholder="// paste, type, or load a sample…"
          />
        </Panel>

        <Divider from={from} to={to} />

        <Panel
          side="to"
          format={to}
          setFormat={setTo}
          excludeFormat="ansi"
          counter={`${output.length} chars`}
          actions={
            <>
              <SmallButton onClick={onDownloadPdf}>pdf</SmallButton>
              <SmallButton onClick={onCopy} kbd="⌘↵" accent>
                copy
              </SmallButton>
            </>
          }
        >
          {to === "rich" ? (
            <div
              className="prose-rich w-full h-[60vh] overflow-auto text-[14px]"
              dangerouslySetInnerHTML={{ __html: richHtml }}
            />
          ) : (
            <textarea
              readOnly
              value={output}
              spellCheck={false}
              className="w-full h-[60vh] bg-transparent outline-none text-[13.5px] text-ink leading-[1.7] resize-none"
            />
          )}
        </Panel>
      </section>

      <Footer />

      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300 ${flash ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="rounded-full border border-line bg-bg-elev/90 backdrop-blur px-4 py-1.5 text-[12px] text-ink-dim">
          <span className="text-accent">●</span> {flash}
        </div>
      </div>
    </main>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function Header() {
  return (
    <header className="rise flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="flex items-center gap-3 text-ink-dim text-[11px] tracking-[0.22em] uppercase">
          <span className="inline-block w-6 h-px bg-ink-faint" />
          <span>a tiny instrument · 2026</span>
        </div>
        <h1
          className="mt-3 font-display italic text-[clamp(2.8rem,7vw,5.2rem)] leading-[0.95] tracking-[-0.01em] font-medium"
        >
          Trans<span className="text-accent">mute</span>
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-xl text-ink-dim text-[13px] leading-relaxed">
          Move text between <em className="text-ink not-italic">HTML</em>,{" "}
          <em className="text-ink not-italic">Markdown</em>,{" "}
          <em className="text-ink not-italic">ANSI</em> and{" "}
          <em className="text-ink not-italic">Rich Text</em>. Paste from
          anywhere, copy to anywhere. No servers, no telemetry — it all
          happens here in the page.
        </p>
      </div>
      <div className="hidden md:flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://muehlemann.com/img/muehlemann+popp.svg"
          alt="mühlemann + popp"
          style={{ height: 32 }}
        />
      </div>
    </header>
  );
}

function Panel({
  side,
  format,
  setFormat,
  excludeFormat,
  counter,
  actions,
  children,
}: {
  side: "from" | "to";
  format: Format;
  setFormat: (f: Format) => void;
  excludeFormat?: Format;
  counter: string;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rise group relative rounded-lg border border-line bg-bg-elev/60 backdrop-blur-[2px] overflow-hidden">
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-line">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.25em] uppercase text-ink-faint">
            {side === "from" ? "source" : "target"}
          </span>
          <span className="text-ink-faint">/</span>
          <FormatPills value={format} onChange={setFormat} exclude={excludeFormat} />
        </div>
        <span className="text-[10px] text-ink-faint tabular-nums">{counter}</span>
      </div>

      <div className="px-5 py-5">{children}</div>

      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-line bg-[#fafafa]">
        {actions}
      </div>
    </div>
  );
}

function FormatPills({
  value,
  onChange,
  exclude,
}: {
  value: Format;
  onChange: (f: Format) => void;
  exclude?: Format;
}) {
  const options = FORMATS.filter((f) => f.id !== exclude);
  return (
    <div className="flex items-center gap-1">
      {options.map((f) => {
        const active = value === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            title={f.hint}
            className={`px-2.5 py-1 rounded-[3px] text-[11px] tracking-wide transition-colors ${
              active
                ? "bg-accent text-[#1a1a1a] font-medium"
                : "text-ink-dim hover:text-ink"
            }`}
          >
            {f.label.toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}

function SmallButton({
  children,
  onClick,
  kbd,
  accent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  kbd?: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[3px] text-[11px] tracking-wide border transition-all ${
        accent
          ? "bg-accent text-[#1a1a1a] border-accent hover:brightness-110"
          : "text-ink-dim border-line hover:text-ink hover:border-ink-faint"
      }`}
    >
      <span>{children}</span>
      {kbd && (
        <span
          className={`text-[10px] tabular-nums ${accent ? "text-[#1a1a1a]/70" : "text-ink-faint"}`}
        >
          {kbd}
        </span>
      )}
    </button>
  );
}

function Divider({ from, to }: { from: Format; to: Format }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center gap-3 px-1">
      <span className="text-[10px] tracking-[0.25em] uppercase text-ink-faint" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
        {from}
      </span>
      <svg width="22" height="58" viewBox="0 0 22 58" className="text-accent flicker">
        <path d="M11 2 v44 M2 38 l9 9 9-9" stroke="currentColor" strokeWidth="1.2" fill="none" />
      </svg>
      <span className="text-[10px] tracking-[0.25em] uppercase text-ink-faint" style={{ writingMode: "vertical-rl" }}>
        {to}
      </span>
    </div>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const p = {
    tl: "top-2 left-2", tr: "top-2 right-2",
    bl: "bottom-2 left-2", br: "bottom-2 right-2",
  }[pos];
  return (
    <span
      className={`pointer-events-none absolute ${p} w-2.5 h-2.5 border-accent`}
      style={{
        borderTopWidth: pos.startsWith("t") ? 1 : 0,
        borderBottomWidth: pos.startsWith("b") ? 1 : 0,
        borderLeftWidth: pos.endsWith("l") ? 1 : 0,
        borderRightWidth: pos.endsWith("r") ? 1 : 0,
      }}
    />
  );
}

function Footer() {
  return (
    <footer className="mt-10 pt-6 border-t border-line flex items-center justify-between text-[11px] text-ink-faint tracking-[0.18em] uppercase flex-wrap gap-3">
      <div>
        ⌘↵ copy &nbsp;·&nbsp; ⌘⇧V smart paste &nbsp;·&nbsp; everything runs in your browser
      </div>
      <div>m+p · 2026</div>
    </footer>
  );
}
