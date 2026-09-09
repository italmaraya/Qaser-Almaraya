// Opens a formatted, printable document in a new window. The user can then
// use the browser's print dialog to "Save as PDF" — this avoids needing a
// server-side PDF rendering dependency.
export function printDoc(title, bodyHtml, lang = 'ar') {
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) {
    alert(lang === 'en' ? 'Please allow pop-ups to download the PDF' : 'يرجى السماح بالنوافذ المنبثقة لتحميل PDF');
    return;
  }
  const origin = window.location.origin;
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  w.document.write(
    '<!DOCTYPE html><html lang="' + lang + '" dir="' + dir + '"><head><meta charset="utf-8"><title>' + title + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=IBM+Plex+Sans:wght@600;700&display=swap" rel="stylesheet">' +
    '<style>@page{size:A4;margin:0}*{box-sizing:border-box}' +
    'body{margin:0;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;color:#1d2733;line-height:1.7}' +
    '.letterhead-header{display:block;width:100%;height:auto}' +
    '.letterhead-footer{display:block;width:100%;height:auto;position:fixed;bottom:0;left:0}' +
    '.content{padding:18px 20mm 34mm}' +
    'h1{margin:0 0 14px;font-size:22px;font-weight:700;color:#1d2733;text-align:center}' +
    'h2{margin:22px 0 8px;font-size:15px;font-weight:700;color:#1d2733}' +
    'table{width:100%;border-collapse:collapse;margin-top:4px;font-size:13px}' +
    'th{background:#049dc5;color:#fff;padding:9px 8px;font-size:12.5px;font-weight:700;border:1px solid #049dc5;text-align:center}' +
    'td{padding:9px 8px;border:1px solid #ececed;text-align:center}' +
    'p.docs{font-size:13.5px;font-weight:600}' +
    '</style></head><body>' +
    '<img class="letterhead-header" src="' + origin + '/assets/pdf-letterhead-header.png" alt="" />' +
    '<div class="content">' + bodyHtml + '</div>' +
    '<img class="letterhead-footer" src="' + origin + '/assets/pdf-letterhead-footer.png" alt="" />' +
    '</body></html>'
  );
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
  }, 700);
}

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
