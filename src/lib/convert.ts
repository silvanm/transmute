import { marked } from "marked";
import TurndownService from "turndown";
import { AnsiUp } from "ansi_up";
import DOMPurify from "dompurify";

export type Format = "ansi" | "markdown" | "html" | "rich";

export const FORMATS: { id: Format; label: string; hint: string }[] = [
  { id: "ansi", label: "ANSI", hint: "terminal escape codes" },
  { id: "markdown", label: "Markdown", hint: "*.md" },
  { id: "html", label: "HTML", hint: "raw markup" },
  { id: "rich", label: "Rich Text", hint: "styled / pasteable" },
];

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "_",
});

function sanitize(html: string): string {
  if (typeof window === "undefined") return html;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

function ansiToHtml(input: string): string {
  const a = new AnsiUp();
  a.use_classes = false;
  return `<pre style="font-family:ui-monospace,Menlo,monospace;white-space:pre-wrap;margin:0">${a.ansi_to_html(input)}</pre>`;
}

function markdownToHtml(input: string): string {
  return marked.parse(input, { async: false, gfm: true, breaks: true }) as string;
}

function htmlToMarkdown(input: string): string {
  return turndown.turndown(input);
}

function stripAnsi(input: string): string {
  return input.replace(/\x1b\[[0-9;]*m/g, "");
}

// Convert any input format into normalized HTML (used as intermediate).
function toHtml(input: string, from: Format): string {
  switch (from) {
    case "html":
    case "rich":
      return input;
    case "markdown":
      return markdownToHtml(input);
    case "ansi":
      return ansiToHtml(input);
  }
}

export function convert(input: string, from: Format, to: Format): string {
  if (!input) return "";
  if (from === to) return input;

  // ANSI can only be a source, not a target — strip codes if asked.
  // (We don't expose ANSI as a target in the UI.)

  const html = toHtml(input, from);

  switch (to) {
    case "html":
      return sanitize(html);
    case "rich":
      // Same HTML; UI renders it as rendered preview and copies as text/html.
      return sanitize(html);
    case "markdown":
      return htmlToMarkdown(sanitize(html));
    case "ansi":
      return stripAnsi(input);
  }
}

export async function copyRich(html: string, plain: string) {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    const item = new ClipboardItem({
      "text/html": new Blob([html], { type: "text/html" }),
      "text/plain": new Blob([plain], { type: "text/plain" }),
    });
    await navigator.clipboard.write([item]);
    return;
  }
  await navigator.clipboard.writeText(plain);
}

export async function pasteSmart(): Promise<{ text: string; html: string | null }> {
  if (navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        if (item.types.includes("text/html")) {
          const html = await (await item.getType("text/html")).text();
          const text = item.types.includes("text/plain")
            ? await (await item.getType("text/plain")).text()
            : html;
          return { text, html };
        }
      }
    } catch {
      // fall through to text-only paste
    }
  }
  const text = await navigator.clipboard.readText();
  return { text, html: null };
}

export function detectFormat(text: string, html: string | null): Format {
  if (html && /<[a-z][\s\S]*>/i.test(html)) return "rich";
  if (/\x1b\[[0-9;]*m/.test(text)) return "ansi";
  if (/^\s*<[a-z!][\s\S]*>/i.test(text)) return "html";
  if (/^#{1,6}\s|^[-*]\s|```|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)/m.test(text))
    return "markdown";
  return "markdown";
}
