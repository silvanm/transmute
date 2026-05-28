# Transmute

A tiny browser-side instrument for moving text between **HTML**, **Markdown**, **ANSI** and **Rich Text**. Paste from anywhere, copy to anywhere. No servers, no telemetry — everything happens in the page.

Live conversions powered by [`ansi_up`](https://github.com/drudru/ansi_up), [`marked`](https://github.com/markedjs/marked), [`turndown`](https://github.com/mixmark-io/turndown) and [`DOMPurify`](https://github.com/cure53/DOMPurify), wrapped in a Next.js 16 + Tailwind v4 UI.

## Features

- Bi-directional conversion across Markdown, HTML, ANSI and Rich Text
- Smart paste — auto-detects the source format from the clipboard
- One-click copy as rich text (preserves formatting when pasting into Docs, Slides, Mail, …)
- PDF export via the browser print dialog
- Keyboard shortcuts: `⌘↵` copy · `⌘⇧V` smart paste
- Fully client-side — safe for sensitive content

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
pnpm build
pnpm start
```

## License

[MIT](./LICENSE) © Silvan Mühlemann / mühlemann + popp

---

<sub>Updated 2026-05-28</sub>
