'use client';
import Icon from '../Icon';

// Real WhatsApp messages from customers, as the company already published
// them in the «تجربة الزبائن» Instagram highlight (names hidden there too).
// Wording kept as the customers wrote it, with spelling tidied only.
// Approved by the owner on 7 Nov 2026 to replace the dashboard review list here.
const HIGHLIGHT = 'https://www.instagram.com/stories/highlights/17866616271560902/';
const VOICES = [
  {
    ar: 'أول يوم كلش خفنا من الأجواء والفندق، للأمانة بعدها واليوم كلشي صار مثل منريد، والسايق والدليل ويانا كلش خدومين ويوفرولنا كلشي نريده. شكراً إلكم.',
    en: 'On the first day we were really worried about the place and the hotel. Honestly, since then everything has been just as we wanted, and the driver and the guide are so helpful and get us everything we need. Thank you.',
    whoAr: 'من عملائنا · آخر يوم من الرحلة', whoEn: 'A customer · last day of the trip',
  },
  {
    ar: 'للأمانة السفرة لليوم كلشي بيرفكت، وأحلى بكثير من ما توقعنا، والفنادق مالت كولومبو وكاندي كلش حلوات وكلش كلاس.',
    en: 'Honestly, the trip so far has been perfect and much better than we expected. The hotels in Colombo and Kandy are lovely and very classy.',
    whoAr: 'من عملائنا · خلال رحلة سريلانكا', whoEn: 'A customer · during the Sri Lanka trip',
  },
  {
    ar: 'الحمد لله صار ساعة واصلين، كلشي جان تمام الحمد لله.',
    en: 'Thank God, we got home an hour ago. Everything went perfectly, thank God.',
    whoAr: 'عميلة · بعد العودة من السفر', whoEn: 'A customer · back home after the trip',
  },
];

export default function HomeVoices({ lang = 'ar' }) {
  const en = lang === 'en';
  return (
    <section className="qs-band qs-white" data-no-i18n="" dir={en ? 'ltr' : 'rtl'}>
      <div className="qs-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div className="qs-head">
          <div>
            <span className="qs-kicker">{en ? 'Travellers' : 'المسافرون'}</span>
            <h2 className="qs-h2">{en ? 'In our customers’ words' : 'بكلمات عملائنا'}</h2>
            <p className="qs-lead">{en ? 'Messages customers sent us on WhatsApp during and after their trips. Names are hidden.' : 'رسائل وصلتنا من عملائنا على واتساب خلال رحلاتهم وبعدها، مع إخفاء الأسماء.'}</p>
          </div>
          <a className="qs-link" href={HIGHLIGHT} target="_blank" rel="noopener noreferrer">{en ? 'More on Instagram' : 'المزيد على انستغرام'}</a>
        </div>
        <div className="qs-voices">
          {VOICES.map((v) => (
            <figure key={v.whoEn} className="qs-voice qs-voice-wa">
              <span className="qs-voice-src"><Icon name="message-circle" size={15} strokeWidth={2.2} />{en ? 'WhatsApp message' : 'رسالة واتساب'}</span>
              <blockquote>{en ? v.en : v.ar}</blockquote>
              <figcaption>{en ? v.whoEn : v.whoAr}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
