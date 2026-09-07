import { Fragment, type ReactNode } from "react";

/**
 * Minimal markdown renderer for AI assistant replies (headings, nested
 * ordered/unordered lists, bold/italic/code spans). The backend LLM formats
 * answers with markdown but the widget previously rendered raw text, so
 * `**Bjarne Stroustrup**` showed up literally instead of bold. No markdown
 * package is in the dependency tree, so this covers just what the assistant
 * actually emits rather than pulling in a full parser.
 */

type ListItemNode = { text: string; children: BlockNode[] };
type BlockNode =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: ListItemNode[] };

type StackEntry = { indent: number; ordered: boolean; items: ListItemNode[] };

function parseBlocks(source: string): BlockNode[] {
  const root: BlockNode[] = [];
  const stack: StackEntry[] = [];

  const currentContainer = (): BlockNode[] | ListItemNode[] => {
    if (stack.length === 0) return root;
    const parentItems = stack[stack.length - 1].items;
    return parentItems[parentItems.length - 1]?.children ?? root;
  };

  const listMarker = /^(\s*)(?:([-*+])|(\d+)\.)\s+(.*)$/;
  const heading = /^(#{1,6})\s+(.*)$/;

  for (const rawLine of source.split("\n")) {
    if (!rawLine.trim()) continue;

    const headingMatch = rawLine.match(heading);
    if (headingMatch) {
      stack.length = 0;
      root.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const listMatch = rawLine.match(listMarker);
    if (listMatch) {
      const indent = listMatch[1].length;
      const ordered = listMatch[3] !== undefined;
      const text = listMatch[4].trim();

      while (stack.length > 0 && indent < stack[stack.length - 1].indent) {
        stack.pop();
      }

      const top = stack[stack.length - 1];
      if (!top || indent > top.indent || top.ordered !== ordered) {
        const container = currentContainer();
        const items: ListItemNode[] = [];
        (container as BlockNode[]).push({ type: "list", ordered, items });
        stack.push({ indent, ordered, items });
      }

      stack[stack.length - 1].items.push({ text, children: [] });
      continue;
    }

    // Plain line: a continuation of the current list item if indented
    // deeper than the open list, otherwise a paragraph at the top level.
    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const top = stack[stack.length - 1];
    if (top && indent > top.indent) {
      const item = top.items[top.items.length - 1];
      if (item) {
        item.text = `${item.text} ${rawLine.trim()}`;
        continue;
      }
    }

    stack.length = 0;
    root.push({ type: "paragraph", text: rawLine.trim() });
  }

  return root;
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*.+?\*\*|`.+?`|\*.+?\*)/g;
  const parts = text.split(pattern).filter((part) => part !== "");
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-black/10 px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function renderBlocks(blocks: BlockNode[], keyPrefix: string): ReactNode {
  return blocks.map((block, i) => {
    const key = `${keyPrefix}-${i}`;
    if (block.type === "heading") {
      const sizeClass =
        block.level <= 2 ? "text-base font-semibold" : "text-sm font-semibold";
      return (
        <p key={key} className={cn2("mt-2 mb-1 first:mt-0", sizeClass)}>
          {renderInline(block.text, key)}
        </p>
      );
    }
    if (block.type === "paragraph") {
      return (
        <p key={key} className="mt-2 first:mt-0">
          {renderInline(block.text, key)}
        </p>
      );
    }
    const ListTag = block.ordered ? "ol" : "ul";
    return (
      <ListTag
        key={key}
        className={cn2(
          "mt-2 space-y-1 pl-5 first:mt-0",
          block.ordered ? "list-decimal" : "list-disc"
        )}
      >
        {block.items.map((item, j) => {
          const itemKey = `${key}-${j}`;
          return (
            <li key={itemKey}>
              {renderInline(item.text, itemKey)}
              {item.children.length > 0
                ? renderBlocks(item.children, `${itemKey}c`)
                : null}
            </li>
          );
        })}
      </ListTag>
    );
  });
}

function cn2(...classes: string[]): string {
  return classes.join(" ");
}

export function ChatMarkdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);
  return <div className="text-sm leading-relaxed">{renderBlocks(blocks, "b")}</div>;
}
