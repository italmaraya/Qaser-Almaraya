// Renders a post body written with simple rules (no HTML allowed, so posts
// can never inject scripts):
//   blank line → new paragraph      ## Heading / ### Smaller heading
//   - item  → bullet list           > text → highlighted quote
//   **bold**   [text](https://…)    ![caption](image-url) on its own line → photo
import React from 'react';

function inline(text, keyBase) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\))/g;
  let last = 0, m, k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={keyBase + '-' + k++}>{tok.slice(2, -2)}</strong>);
    else {
      const label = tok.slice(1, tok.indexOf(']('));
      const href = tok.slice(tok.indexOf('](') + 2, -1);
      const ext = /^https?:/.test(href);
      out.push(<a key={keyBase + '-' + k++} href={href} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  // keep single line breaks inside a paragraph
  return out.flatMap((part, i) => (typeof part === 'string' ? part.split('\n').flatMap((l, j, arr) => (j < arr.length - 1 ? [l, <br key={keyBase + 'br' + i + '-' + j} />] : [l])) : [part]));
}

export default function NewsBody({ text }) {
  const blocks = String(text || '').replace(/\r\n/g, '\n').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="qn-body">
      {blocks.map((b, i) => {
        const img = b.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)$/);
        if (img) {
          return (
            <figure key={i}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img[2]} alt={img[1]} loading="lazy" />
              {img[1] && <figcaption>{img[1]}</figcaption>}
            </figure>
          );
        }
        if (b.startsWith('### ')) return <h3 key={i}>{inline(b.slice(4), 'h' + i)}</h3>;
        if (b.startsWith('## ')) return <h2 key={i}>{inline(b.slice(3), 'h' + i)}</h2>;
        const lines = b.split('\n');
        if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-•]\s+/, ''), 'l' + i + j)}</li>)}</ul>;
        }
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
          return <ol key={i}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*\d+[.)]\s+/, ''), 'o' + i + j)}</li>)}</ol>;
        }
        if (b.startsWith('> ')) return <blockquote key={i}>{inline(lines.map((l) => l.replace(/^>\s?/, '')).join('\n'), 'q' + i)}</blockquote>;
        return <p key={i}>{inline(b, 'p' + i)}</p>;
      })}
    </div>
  );
}

export const NEWS_BODY_CSS = `
.qn-body{font-size:18px;line-height:1.95;color:#2a333d}
.qn-body p{margin:0 0 20px}
.qn-body h2{font-size:26px;line-height:1.35;margin:34px 0 14px;color:#1d2733}
.qn-body h3{font-size:21px;line-height:1.4;margin:26px 0 10px;color:#1d2733}
.qn-body ul,.qn-body ol{margin:0 0 20px;padding-inline-start:24px}
.qn-body li{margin:6px 0}
.qn-body li::marker{color:#049dc5}
.qn-body a{color:#049dc5;font-weight:600;text-decoration:underline;text-underline-offset:3px}
.qn-body blockquote{margin:24px 0;padding:16px 20px;border-inline-start:4px solid #faab18;background:#fffaf0;border-radius:12px;font-size:19px;color:#3d4650}
.qn-body figure{margin:26px 0}
.qn-body figure img{width:100%;height:auto;border-radius:16px;display:block}
.qn-body figcaption{font-size:14px;color:#7b8087;text-align:center;margin-top:8px}
.qn-body strong{color:#1d2733}
@media(max-width:640px){.qn-body{font-size:16.5px}.qn-body h2{font-size:22px}}
`;
