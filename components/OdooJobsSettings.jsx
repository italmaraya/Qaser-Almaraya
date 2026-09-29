'use client';
import { useState } from 'react';

const input = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #ececed', fontSize: 14, fontFamily: 'inherit', direction: 'ltr' };

// Jobs tab → Odoo Recruitment connection settings.
export default function OdooJobsSettings({ careers, onChange, onSave, saving, saved }) {
  const [test, setTest] = useState(null);
  const [testing, setTesting] = useState(false);
  const [diag, setDiag] = useState(null);
  const [diagBusy, setDiagBusy] = useState('');
  const [diagJob, setDiagJob] = useState('');

  async function runDiag(dryRun) {
    if (!dryRun && !confirm('سسيتم إرسال متقدّم تجريبي باسم "TEST — Qaser Website" إلى الوظيفة المختارة في Odoo. يمكنك حذفه بعد ذلك. متابعة؟')) return;
    setDiagBusy(dryRun ? 'dry' : 'real');
    setDiag(null);
    try {
      const r = await fetch('/api/admin/jobs-apply-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dryRun, odooUrl: careers.odooUrl, jobId: diagJob }) });
      setDiag(await r.json());
    } catch (e) {
      setDiag({ ok: false, error: e.message, trace: [] });
    } finally {
      setDiagBusy('');
    }
  }

  async function runTest() {
    setTesting(true);
    setTest(null);
    try {
      const r = await fetch('/api/admin/jobs-test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ odooUrl: careers.odooUrl }) });
      setTest(await r.json());
    } catch (e) {
      setTest({ ok: false, error: e.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div style={{ background: '#f3fafc', border: '1px solid #d9e9ef', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <b style={{ fontSize: 15, color: '#036f8c' }}>🔗 ربط الوظائف مع Odoo Recruitment</b>
      <span style={{ fontSize: 13, color: '#3d4650', lineHeight: 1.8 }}>
        كل وظيفة تنشرها في Odoo (زر <b>Publish</b> في تطبيق Recruitment) تظهر تلقائياً في صفحة الوظائف على موقعنا خلال 15 دقيقة،
        وزر «قدّم الآن» يفتح نموذج التقديم في Odoo فتصل السيرة الذاتية مباشرة إلى Recruitment.
      </span>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 600 }}>
        عنوان موقع Odoo الخاص بكم
        <input style={input} placeholder="https://almaraya.odoo.com" value={careers.odooUrl || ''} onChange={(e) => onChange({ ...careers, odooUrl: e.target.value })} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
        <input type="checkbox" checked={careers.hideManualWhenOdoo !== false} onChange={(e) => onChange({ ...careers, hideManualWhenOdoo: e.target.checked })} />
        عند وجود وظائف في Odoo، أخفِ الوظائف المكتوبة يدوياً في الأسفل
      </label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={onSave} disabled={saving} style={{ padding: '9px 16px', borderRadius: 8, border: 0, background: '#049dc5', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'جارٍ الحفظ…' : 'حفظ الإعداد'}</button>
        <button type="button" onClick={runTest} disabled={testing || !careers.odooUrl} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cfe9f2', background: '#fff', color: '#036f8c', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{testing ? 'جارٍ الفحص…' : 'اختبار الاتصال'}</button>
        {saved && <span style={{ color: '#1a7f47', fontSize: 13, fontWeight: 700 }}>✓ تم الحفظ</span>}
      </div>
      <div style={{ borderTop: '1px dashed #cfe9f2', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <b style={{ fontSize: 13.5 }}>🩺 فحص إرسال الطلبات إلى Odoo</b>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>الوظيفة المراد فحصها:
          <select value={diagJob} onChange={(e) => setDiagJob(e.target.value)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ececed', fontFamily: 'inherit', minWidth: 220 }}>
            <option value="">{test && test.ok ? '— اختر —' : '— اضغط «اختبار الاتصال» أولاً لعرض الوظائف —'}</option>
            {(test && test.jobs ? test.jobs : []).map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => runDiag(true)} disabled={!!diagBusy || !careers.odooUrl} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cfe9f2', background: '#fff', color: '#036f8c', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{diagBusy === 'dry' ? 'جارٍ الفحص…' : '١. فحص نموذج التقديم (بدون إرسال)'}</button>
          <button type="button" onClick={() => runDiag(false)} disabled={!!diagBusy || !careers.odooUrl} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #f5d8a0', background: '#fffaf0', color: '#8a5a00', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{diagBusy === 'real' ? 'جارٍ الإرسال…' : '٢. إرسال متقدّم تجريبي'}</button>
        </div>
        {diag && (
          <div style={{ fontSize: 12.5, background: diag.ok ? '#eefaf3' : '#fdecef', border: '1px solid ' + (diag.ok ? '#cdebd9' : '#f4d3da'), borderRadius: 8, padding: 10 }}>
            <b style={{ color: diag.ok ? '#1a7f47' : '#c02643' }}>
              {diag.ok ? (diag.dryRun ? '✓ تم العثور على نموذج التقديم وقراءته بنجاح' : '✓ قبل Odoo الطلب — رقم المتقدّم: ' + diag.id + ' (تحقق منه في Recruitment)') : '✕ ' + diag.error}
            </b>
            <table style={{ width: '100%', marginTop: 6, borderCollapse: 'collapse', direction: 'ltr', fontFamily: 'ui-monospace,monospace', fontSize: 11.5 }}>
              <tbody>{(diag.trace || []).map(([k, v], i) => (
                <tr key={i} style={{ borderTop: '1px solid rgba(0,0,0,.06)' }}><td style={{ padding: '3px 6px', fontWeight: 700, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{k}</td><td style={{ padding: '3px 6px', wordBreak: 'break-all' }}>{String(v)}</td></tr>
              ))}</tbody>
            </table>
            <div style={{ marginTop: 6, color: '#7b8087' }}>إذا لم تنجح الخطوة، التقط صورة لهذا المربع وأرسلها لنا.</div>
          </div>
        )}
      </div>
      {test && (
        test.ok ? (
          <div style={{ fontSize: 13, background: '#eefaf3', border: '1px solid #cdebd9', borderRadius: 8, padding: 10, lineHeight: 1.8 }}>
            ✓ تم الاتصال ({test.mode === 'api' ? 'عبر API الرسمي' : 'عبر صفحة الوظائف العامة'}) — عدد الوظائف المنشورة: <b>{test.count}</b>
            {test.count > 0 && <ul style={{ margin: '4px 0 0', paddingInlineStart: 18 }}>{test.titles.map((t, i) => <li key={i}>{t}</li>)}</ul>}
            {test.count === 0 && <div>لم نجد وظائف منشورة. تأكد أن الوظيفة عليها «Published» في Odoo وأن تطبيق Website مفعّل.</div>}
            {test.note && <div style={{ color: '#8a5a00' }}>ملاحظة: {test.note}</div>}
          </div>
        ) : (
          <div style={{ fontSize: 13, background: '#fdecef', border: '1px solid #f4d3da', borderRadius: 8, padding: 10, color: '#c02643' }}>✕ تعذّر الوصول: {test.error}</div>
        )
      )}
    </div>
  );
}
