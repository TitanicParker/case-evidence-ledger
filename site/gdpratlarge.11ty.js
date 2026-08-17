const fs = require("node:fs");
const path = require("node:path");
const { esc, header, footer, head } = require("./_lib/public-shell.js");

function inlineMarkdown(value) {
  return esc(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let paragraph = [];

  const flush = () => {
    if (!paragraph.length) return;
    blocks.push(`<p>${inlineMarkdown(paragraph.join(" ").trim())}</p>`);
    paragraph = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line === "---") {
      flush();
      blocks.push("<hr>");
      continue;
    }
    if (line.startsWith("# ")) {
      flush();
      blocks.push(`<h1>${inlineMarkdown(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("### ")) {
      flush();
      blocks.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("> ")) {
      flush();
      blocks.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`);
      continue;
    }
    paragraph.push(line);
  }
  flush();
  return blocks.join("\n");
}

module.exports = class {
  data() {
    return { permalink: "/gdpratlarge/", eleventyExcludeFromCollections: true };
  }

  render() {
    const sourcePath = path.join(process.cwd(), "gdpratlarge.md");
    const document = fs.readFileSync(sourcePath, "utf8");
    const body = renderMarkdown(document);
    const styles = `<style>
      .plain-language-main{max-width:78rem;margin:0 auto;padding:4.5rem 2rem 7rem}.plain-language-document{max-width:50rem;margin:0 auto}.plain-language-document h1{margin:0 0 2.4rem;font:500 clamp(3.2rem,7vw,6.2rem)/.94 var(--serif);letter-spacing:-.045em}.plain-language-document h2{margin:4.2rem 0 1.2rem;padding-top:1.8rem;border-top:1px solid var(--line-strong);font:500 clamp(2rem,4vw,3rem)/1 var(--serif);letter-spacing:-.03em}.plain-language-document h3{margin:2rem 0 1rem;font:600 1.15rem/1.35 var(--serif);color:var(--ink)}.plain-language-document p{margin:0 0 1.25rem;font-size:1.05rem;line-height:1.72;color:var(--ink-soft)}.plain-language-document strong{color:var(--ink);font-weight:700}.plain-language-document a{color:var(--ink);text-decoration:underline;text-underline-offset:.18em}.plain-language-document hr{margin:2.5rem 0;border:0;border-top:1px solid var(--line-strong)}.plain-language-document blockquote{margin:2rem 0;padding:1.25rem 1.5rem;border-left:3px solid var(--line-strong);font:500 1.12rem/1.65 var(--serif);color:var(--ink)}.plain-language-note{max-width:50rem;margin:0 auto 2.4rem;padding-bottom:1rem;border-bottom:1px solid var(--line);font:700 .68rem/1.4 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-soft)}@media(max-width:720px){.plain-language-main{padding:2.8rem 1.1rem 5rem}.plain-language-document h1{font-size:clamp(2.8rem,14vw,4.3rem)}.plain-language-document h2{margin-top:3.2rem}.plain-language-document p{font-size:1rem;line-height:1.68}}
    </style>`;
    const pageHead = head(
      "The Whole Story: Clinical Uncertainty, the Medical Record, and the GDPR Trail",
      "A combined plain-language account of the clinical uncertainty, medical record, and subsequent GDPR trail."
    ).replace("</head>", `${styles}</head>`);

    return `<!doctype html><html lang="en">${pageHead}<body class="route-home"><a class="skip-link" href="#content">Skip to content</a>${header("home")}<main id="content" class="plain-language-main"><div class="plain-language-note">Related reading · the whole clinical and GDPR story</div><article class="plain-language-document">${body}</article></main>${footer()}</body></html>`;
  }
};
