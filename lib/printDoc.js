// Opens a formatted, printable document in a new window. The user can then
// use the browser's print dialog to "Save as PDF" — this avoids needing a
// server-side PDF rendering dependency.
export function printDoc(title, bodyHtml) {
  const w = window.open('', '_blank', 'width=900,height=1100');
  if (!w) {
    alert('يرجى السماح بالنوافذ المنبثقة لتحميل PDF');
    return;
  }
  w.document.write(
    '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' + title + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=IBM+Plex+Sans:wght@600;700&display=swap" rel="stylesheet">' +
    '<style>@page{size:A4;margin:16mm}*{box-sizing:border-box}' +
    'body{margin:0;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;color:#1d2733;line-height:1.7}' +
    'header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding-bottom:14px;border-bottom:3px solid #049dc5;margin-bottom:22px}' +
    '.brand{font-size:19px;font-weight:700;color:#049dc5}.sub{font-size:12.5px;color:#7b8087}' +
    'h1{margin:0 0 14px;font-size:22px;font-weight:700;color:#1d2733;text-align:center}' +
    'h2{margin:22px 0 8px;font-size:15px;font-weight:700;color:#1d2733}' +
    'table{width:100%;border-collapse:collapse;margin-top:4px;font-size:13px}' +
    'th{background:#049dc5;color:#fff;padding:9px 8px;font-size:12.5px;font-weight:700;border:1px solid #049dc5;text-align:center}' +
    'td{padding:9px 8px;border:1px solid #ececed;text-align:center}' +
    'p.docs{font-size:13.5px;font-weight:600}' +
    'footer{margin-top:34px;padding-top:12px;border-top:1px solid #ececed;font-size:12px;color:#7b8087;display:flex;justify-content:space-between;gap:12px}' +
    '</style></head><body>' +
    '<header><span class="brand">قصر المرايا للسفر و السياحة<span class="sub" style="display:block">QASER ALMARAYA · FOR TRAVEL &amp; TOURISM</span></span>' +
    '<span class="sub">6393 · sales@almarayagroup.com</span></header>' +
    bodyHtml +
    '<footer><span>قصر المرايا للسفر و السياحة</span><span>+964 784 999 9600</span></footer>' +
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
export function visaTableHtml(cards) {
  const header =
    '<tr><th>تسلسل</th><th>نوع التأشيرة</th><th>مدة الإقامة</th><th>صلاحية الدخول</th><th>مدة الإصدار</th><th>سعر البالغ</th><th>سعر الطفل</th></tr>';
  const rows = cards
    .map(
      (c, i) =>
        '<tr><td>' + (i + 1) + '</td>' +
        '<td>' + esc(c.visa_type_name_ar) + '</td>' +
        '<td>' + esc(c.stay_duration || '—') + '</td>' +
        '<td>' + esc(c.validity_before_travel || '—') + '</td>' +
        '<td>' + esc(c.issuing_time_days ? c.issuing_time_days + ' أيام عمل' : '—') + '</td>' +
        '<td>' + Number(c.adult_price).toLocaleString() + '</td>' +
        '<td>' + Number(c.child_price).toLocaleString() + '</td></tr>'
    )
    .join('');
  return '<table>' + header + rows + '</table>';
}

// Merges documents across one or more cards into a single "doc1 + doc2 + doc3" line
export function combinedDocsLine(cardsWithDocs) {
  const names = [];
  for (const c of cardsWithDocs) {
    for (const d of c.documents || []) {
      if (!names.includes(d.name_ar)) names.push(d.name_ar);
    }
  }
  return names.length ? names.join(' + ') : '—';
}
