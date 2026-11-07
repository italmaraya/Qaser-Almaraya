'use client';
import Icon from '../Icon';
import { waLink, WHATSAPP_NUMBER } from '../../lib/whatsapp';
import { ADDRESS_AR, ADDRESS_EN, HOURS_AR, HOURS_EN } from '../../lib/company';

// Closing contact band: WhatsApp first (the company's main channel), then the
// hotline, phones, e-mail and the office address from the dashboard content.
export default function HomeContact({ lang = 'ar', contact }) {
  const en = lang === 'en';
  const c = contact || {};
  const wa = '0' + WHATSAPP_NUMBER.replace(/^964/, '');
  const tel = (s) => 'tel:' + String(s || '').replace(/[^\d+]/g, '').replace(/^00/, '+');
  return (
    <section className="qs-band qs-sand" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap qs-contact">
        <div className="qs-contact-copy">
          <span className="qs-kicker">{en ? 'Talk to us' : 'تواصل معنا'}</span>
          <h2 className="qs-h2">{en ? 'Tell us where you want to go. We will take it from there.' : 'أخبرنا إلى أين تريد السفر، ونتولى الباقي.'}</h2>
          <p className="qs-lead">{en ? 'Message us on WhatsApp or call the hotline 6393 from anywhere in Iraq. We are open every day from 9 am to midnight.' : 'راسلنا على واتساب أو اتصل بالرقم المختصر 6393 من أي مكان في العراق. نحن معك يومياً من 9 صباحاً حتى 12 منتصف الليل.'}</p>
          <div className="qs-contact-actions">
            <a className="qs-btn qs-btn-pri" href={waLink(en ? 'Hello Qaser Almaraya, I would like help planning a trip.' : 'مرحباً قصر المرايا، أرغب بالمساعدة في حجز رحلة.')} target="_blank" rel="noopener">
              <Icon name="message-circle" size={18} strokeWidth={2} />{en ? 'WhatsApp us' : 'راسلنا على واتساب'}
            </a>
            <a className="qs-btn qs-btn-line" href="tel:6393"><Icon name="phone" size={18} strokeWidth={2} />{en ? 'Call 6393' : 'اتصل 6393'}</a>
          </div>
        </div>
        <dl className="qs-contact-list">
          <div><dt>{en ? 'WhatsApp' : 'واتساب'}</dt><dd><a href={waLink('')} target="_blank" rel="noopener" dir="ltr">{wa}</a></dd></div>
          {c.phone1 ? <div><dt>{en ? 'Phone' : 'الهاتف'}</dt><dd><a href={tel(c.phone1)} dir="ltr">{c.phone1}</a>{c.phone2 ? <><br /><a href={tel(c.phone2)} dir="ltr">{c.phone2}</a></> : null}</dd></div> : null}
          {c.email ? <div><dt>{en ? 'E-mail' : 'البريد'}</dt><dd><a href={'mailto:' + c.email} dir="ltr">{c.email}</a></dd></div> : null}
          <div><dt>{en ? 'Office' : 'المكتب'}</dt><dd>{en ? ADDRESS_EN : ADDRESS_AR}</dd></div>
          <div><dt>{en ? 'Opening hours' : 'أوقات الدوام'}</dt><dd>{en ? HOURS_EN : HOURS_AR}</dd></div>
        </dl>
      </div>
    </section>
  );
}
