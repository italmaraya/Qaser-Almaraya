import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../../../lib/session';

export const maxDuration = 60;

const PROMPT = `You read a screenshot of a "Qaser Almaraya" Excel group sheet (Arabic, right-to-left) and extract its values.
Return ONLY one JSON object. No markdown, no commentary. Use null when something is not visible. Never guess or invent.
Copy Arabic text exactly as written. Numbers are plain numbers (no commas / currency). Read EVERY row.

Column meanings (header -> field):
- Orange/yellow banner row with the program title, e.g. "برنامج دبي 8 ايام - 7 ليالي A" -> title_ar = the banner text as written; dest_ar = just the country/city (e.g. "دبي"); day_count = days (8); nights = nights (7).
- التاريخ (dates, may be several lines in one cell, written dd-mm-yyyy) -> available_dates, converted to YYYY-MM-DD.
- ايام الاسبوع -> departs_ar (copy the text, join lines with " - ").
- الطيران -> flight airline name; وقت الذهاب -> outDepartTime; وقت العودة -> retDepartTime (keep text like "09:30 صباحا").
- اسم الفندق -> hotel nameAr (if the name is English, put it in nameEn instead and leave nameAr as null... if both appear fill both).
- التصنيف (e.g. "4 نجوم") -> stars as a number.
- الموقع والمميزات -> location (copy text, join lines with " / ").
- البيع -> sellAdult;  التسديد (orange header, red numbers) -> settleAdult.
- طفل بدون سرير -> settleChildNoBed;  طفل بسرير -> settleChildBed;  الرضيع -> settleInfant;  السنكل -> singleDiff.
- ملاحظات خاصة بالفندق (notes for that hotel row) -> that hotel's notesAr, copied fully, keep line breaks as \n.
- ملاحظات عامة للباكج (one big merged notes cell for the whole package) -> general_notes_ar, copied fully, keep line breaks as \n. Ignore the dashed "-----" separator lines.
- Ignore the "#" column.
- A row whose text is crossed out (strikethrough) is a cancelled hotel: still include it but set "hidden": true. Otherwise "hidden": false.

JSON shape:
{
  "title_ar": string|null, "dest_ar": string|null, "nights": number|null, "day_count": number|null,
  "departs_ar": string|null,
  "available_dates": ["YYYY-MM-DD"],
  "general_notes_ar": string|null,
  "flights": [ { "nameAr": string|null, "outDepartTime": string|null, "retDepartTime": string|null } ],
  "hotels": [ { "nameAr": string|null, "nameEn": string|null, "stars": number|null, "location": string|null,
                "sellAdult": number|null, "settleAdult": number|null, "settleChildNoBed": number|null,
                "settleChildBed": number|null, "settleInfant": number|null, "singleDiff": number|null,
                "notesAr": string|null, "hidden": boolean } ]
}`;

export async function POST(request) {
  if (!(await requireAdmin(request))) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: 'ANTHROPIC_API_KEY غير مضبوط في إعدادات الموقع (Vercel → Environment Variables).' }, { status: 500 });

  const { image, mediaType } = await request.json().catch(() => ({}));
  if (!image) return NextResponse.json({ error: 'لم يتم إرسال صورة' }, { status: 400 });
  const type = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mediaType) ? mediaType : 'image/jpeg';

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: type, data: image } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return NextResponse.json({ error: (data.error && data.error.message) || 'فشل قراءة الصورة' }, { status: 502 });

  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  try {
    const json = JSON.parse(text.replace(/```json|```/g, '').trim());
    return NextResponse.json({ ok: true, fields: json });
  } catch {
    return NextResponse.json({ error: 'تعذّر فهم نتيجة القراءة، جرّب صورة أوضح.' }, { status: 502 });
  }
}
