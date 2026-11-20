import type { ReactNode } from "react";

/*
 * Tiny, safe markdown renderer for chat answers: paragraphs, **bold**, "- " bullet and "1." numbered lists.
 * Builds React elements (never innerHTML), so model output can't inject markup.
 */

type Block = { type: "p"; lines: string[] } | { type: "ul" | "ol"; items: string[] };

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const HEADING = /^\s*#{1,6}\s+/;
const RULE = /^\s*([-*_])\1{2,}\s*$/; // "---", "***", "___" dividers

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", lines: para });
    para = [];
  };
  const pushItem = (type: "ul" | "ol", item: string) => {
    flush();
    const last = blocks[blocks.length - 1];
    if (last && last.type === type) last.items.push(item);
    else blocks.push({ type, items: [item] });
  };

  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line || RULE.test(raw)) flush();
    else if (BULLET.test(raw)) pushItem("ul", raw.replace(BULLET, ""));
    else if (NUMBERED.test(raw)) pushItem("ol", raw.replace(NUMBERED, ""));
    else if (HEADING.test(raw)) {
      flush();
      blocks.push({ type: "p", lines: [`**${raw.replace(HEADING, "").replace(/\*\*/g, "")}**`] });
    } else para.push(line);
  }
  flush();
  return blocks;
}

function inline(text: string): ReactNode[] {
  // **bold**, then *italic* / _italic_ (e.g. scientific names like *Phytophthora infestans*)
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g).map((part, i) => {
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.length > 2 && ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_")))) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {parseBlocks(text).map((b, i) =>
        b.type === "p" ? (
          <p key={i} className="whitespace-pre-line">
            {inline(b.lines.join("\n"))}
          </p>
        ) : b.type === "ul" ? (
          <ul key={i} className="list-disc space-y-1 ps-5 marker:text-leaf-500">
            {b.items.map((it, j) => (
              <li key={j}>{inline(it)}</li>
            ))}
          </ul>
        ) : (
          <ol key={i} className="list-decimal space-y-1 ps-5 marker:font-semibold marker:text-leaf-600">
            {b.items.map((it, j) => (
              <li key={j}>{inline(it)}</li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}
