// Opens a formatted, printable document in a new window. The user can then
// use the browser's print dialog to "Save as PDF" — this avoids needing a
// server-side PDF rendering dependency.
export function printDoc(title, bodyHtml, lang = 'ar') {
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) {
    alert(lang === 'en' ? 'Please allow pop-ups to download the PDF' : 'يرجى السماح بالنوافذ المنبثقة لتحميل PDF');
    return;
  }
  // The body may still be building (e.g. the visa PDF creates a QR code).
  // The window is opened right away — inside the click — so pop-up blockers
  // allow it, then filled in once the content is ready.
  if (bodyHtml && typeof bodyHtml.then === 'function') {
    w.document.write('<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0;color:#036f8c">' + (lang === 'en' ? 'Preparing PDF…' : 'جارٍ تجهيز الملف…') + '</body></html>');
    bodyHtml.then((html) => { w.document.open(); writeDoc(w, title, html, lang); }, () => w.close());
    return;
  }
  writeDoc(w, title, bodyHtml, lang);
}

function writeDoc(w, title, bodyHtml, lang) {
  const origin = window.location.origin;
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  // The page body sits inside a table whose <tfoot> holds an empty spacer the
  // same height as the fixed letterhead footer. Browsers repeat <thead>/<tfoot>
  // on every printed page, so content never runs underneath the footer image.
  w.document.write(
    '<!DOCTYPE html><html lang="' + lang + '" dir="' + dir + '"><head><meta charset="utf-8"><title>' + title + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Sans:wght@500;600;700&display=swap" rel="stylesheet">' +
    '<style>@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'body{margin:0;font-family:"IBM Plex Sans Arabic","IBM Plex Sans",system-ui,sans-serif;color:#1d2733;line-height:1.7}' +
    '.letterhead-header{display:block;width:100%;height:auto}' +
    // On screen the footer sits once at the end of the document; only when
    // printing is it pinned to the bottom of every page (with the tfoot spacer
    // reserving room for it), so it never floats over the content on screen.
    '.letterhead-footer{display:block;width:100%;height:auto}' +
    '@media print{.letterhead-footer{position:fixed;bottom:0;left:0}}' +
    '@media screen{.foot-space{height:0}body{max-width:210mm;margin:0 auto;background:#fff;box-shadow:0 0 0 100vmax #eef1f3}}' +
    'table.page{width:100%;border-collapse:collapse;margin:0}table.page>thead td,table.page>tfoot td,table.page>tbody>tr>td.page-cell{border:0;padding:0;text-align:inherit}' +
    '.head-space{height:8mm}.foot-space{height:36mm}' +
    '.content{padding:10px 16mm 6mm}' +
    'h1{margin:0 0 14px;font-size:22px;font-weight:700;color:#1d2733;text-align:center}' +
    'h2{margin:22px 0 8px;font-size:15px;font-weight:700;color:#1d2733}' +
    'table{width:100%;border-collapse:collapse;margin-top:4px;font-size:13px}' +
    'th{background:#049dc5;color:#fff;padding:9px 8px;font-size:12.5px;font-weight:700;border:1px solid #049dc5;text-align:center}' +
    'td{padding:9px 8px;border:1px solid #ececed;text-align:center}' +
    'p.docs{font-size:13.5px;font-weight:600}' +
    '</style></head><body>' +
    '<img class="letterhead-header" src="' + origin + '/assets/pdf-letterhead-header.png" alt="" />' +
    '<table class="page"><thead><tr><td><div class="head-space"></div></td></tr></thead>' +
    '<tfoot><tr><td><div class="foot-space"></div></td></tr></tfoot>' +
    '<tbody><tr><td class="page-cell"><div class="content">' + bodyHtml + '</div></td></tr></tbody></table>' +
    '<img class="letterhead-footer" src="' + origin + '/assets/pdf-letterhead-footer.png" alt="" />' +
    '</body></html>'
  );
  w.document.close();
  w.focus();

  // Wait for every image (hotel photos, airline logos, day photos) and the
  // web fonts before opening the print dialog, with a safety timeout so a
  // single broken image can never block the download.
  let printed = false;
  const doPrint = () => {
    if (printed) return;
    printed = true;
    setTimeout(() => w.print(), 150);
  };
  const imgs = Array.from(w.document.images || []);
  const imgReady = Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; }))));
  const fontReady = w.document.fonts && w.document.fonts.ready ? w.document.fonts.ready : Promise.resolve();
  Promise.all([imgReady, fontReady]).then(doPrint, doPrint);
  setTimeout(doPrint, 8000);
}

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Copies text to the clipboard, falling back to a hidden textarea + execCommand
// for browsers/contexts where navigator.clipboard isn't available.
export function copyText(text, onDone) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onDone, () => fallbackCopyText(text, onDone));
  } else {
    fallbackCopyText(text, onDone);
  }
}

function fallbackCopyText(text, onDone) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:-1000px';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(ta);
  onDone();
}

// Builds the visa comparison table HTML (تسلسل | نوع التأشيرة | مدة الإقامة | صلاحية الدخول | مدة الإصدار | سعر البالغ | سعر الطفل)
export function visaTableHtml(cards, lang = 'ar') {
  const en = lang === 'en';
  const header = en
    ? '<tr><th>#</th><th>Visa type</th><th>Stay duration</th><th>Valid before travel</th><th>Processing time</th><th>Adult price (IQD)</th><th>Child price (IQD)</th></tr>'
    : '<tr><th>تسلسل</th><th>نوع التأشيرة</th><th>مدة الإقامة</th><th>صلاحية الدخول</th><th>مدة الإصدار</th><th>سعر البالغ</th><th>سعر الطفل</th></tr>';
  const rows = cards
    .map(
      (c, i) =>
        '<tr><td>' + (i + 1) + '</td>' +
        '<td>' + esc(en && c.visa_type_name_en ? c.visa_type_name_en : c.visa_type_name_ar) + '</td>' +
        '<td>' + esc(c.stay_duration || '—') + '</td>' +
        '<td>' + esc(c.validity_before_travel || '—') + '</td>' +
        '<td>' + esc(c.issuing_time_days ? c.issuing_time_days + (en ? ' working days' : ' أيام عمل') : '—') + '</td>' +
        '<td>' + Number(c.adult_price).toLocaleString() + '</td>' +
        '<td>' + Number(c.child_price).toLocaleString() + '</td></tr>'
    )
    .join('');
  return '<table>' + header + rows + '</table>';
}

// Merges documents across one or more cards into a single "doc1 + doc2 + doc3" line
export function combinedDocsLine(cardsWithDocs, lang = 'ar') {
  const en = lang === 'en';
  const names = [];
  for (const c of cardsWithDocs) {
    for (const d of c.documents || []) {
      const label = en && d.name_en ? d.name_en : d.name_ar;
      if (!names.includes(label)) names.push(label);
    }
  }
  return names.length ? names.join(' + ') : '—';
}
