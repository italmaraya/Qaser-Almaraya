import { Redis } from '@upstash/redis';

const CONTENT_KEY = 'qaser:site-content';

// These defaults mirror exactly what's currently hard-coded on the site.
// If Redis has no saved content yet (or a field is missing from what's
// saved), these values are used so the site never breaks.
export const defaultContent = {
  jobs: [
    {
      id: 'sales',
      tag: 'SALES',
      title: 'B2C Sales Representative',
      location: 'بغداد — دوام كامل',
      bullets: [
        'متابعة استفسارات العملاء وإتمام الحجوزات',
        'معرفة جيدة بأنظمة الحجز وشركات الطيران',
        'إنجليزية جيدة ومهارات تواصل عالية',
      ],
    },
    {
      id: 'corporate',
      tag: 'CORPORATE',
      title: 'Corporate Travel Consultant',
      location: 'بغداد — دوام كامل',
      bullets: [
        'إدارة حسابات الشركات وحركة سفر الفعاليات',
        'تنسيق العقود الفندقية والتذاكر الجماعية',
        'خبرة سابقة في السفر المؤسسي',
      ],
    },
    {
      id: 'visa',
      tag: 'OPERATIONS',
      title: 'Visa Processing Officer',
      location: 'بغداد — دوام كامل',
      bullets: [
        'تدقيق مستندات التأشيرات ومتابعة الطلبات',
        'تواصل منظم مع السفارات ومراكز التقديم',
        'دقة عالية في التفاصيل والمواعيد',
      ],
    },
    {
      id: 'marketing',
      tag: 'MARKETING',
      title: 'Digital Marketing Specialist',
      location: 'بغداد — دوام مختلط',
      bullets: [
        'إدارة المحتوى والحملات على منصاتنا الرقمية',
        'كتابة عربية سليمة وحس بصري جيد',
        'تحليل الأداء وتحسين النتائج',
      ],
    },
  ],

  faq: [
    {
      id: 'faq1',
      q: 'كيف أحجز تذكرة طيران معكم؟',
      a: 'الحجز المباشر يتم عبر شريكنا Flamingo على flamingo.iq، وفريقنا يتابع طلبك خطوة بخطوة حتى إصدار التذكرة. يمكنك أيضًا الاتصال بالرقم المختصر 6393 وسنكمل الحجز عنك.',
    },
    {
      id: 'faq2',
      q: 'هل تصدرون الحجوزات الفندقية أيضًا؟',
      a: 'نعم. لدينا عقود مباشرة مع فنادق في عدة وجهات، ونرشّح لك الأنسب حسب موقعك وميزانيتك ونوع رحلتك.',
    },
    {
      id: 'faq3',
      q: 'ما هي طرق الدفع المتاحة؟',
      a: 'التحويل على حساب الشركة، أو الدفع عبر Zain Cash، أو نقدًا في مكتبنا.',
    },
    {
      id: 'faq4',
      q: 'هل تنظمون رحلات المجموعات والفعاليات؟',
      a: 'نعم، ندير حركة السفر للفعاليات الكبرى والأفواج، من التذاكر الجماعية إلى الإقامة والتنقلات الداخلية.',
    },
    {
      id: 'faq5',
      q: 'كيف أتابع طلبي بعد إرساله؟',
      a: 'يتواصل معك أحد موظفينا لتأكيد التفاصيل، ويبقى معك على القناة التي تفضّلها حتى انتهاء الرحلة.',
    },
    {
      id: 'faq6',
      q: 'هل تخدمون العملاء خارج العراق؟',
      a: 'نعم، نعمل مع المسافرين من داخل العراق وخارجه.',
    },
    {
      id: 'faq7',
      q: 'كيف أتواصل مع خدمة العملاء؟',
      a: 'الرقم المختصر 6393، أو الهاتف +964 784 999 9600، أو البريد sales@almarayagroup.com.',
    },
    {
      id: 'faq8',
      q: 'هل تقدمون عروضًا للشركات؟',
      a: 'نعم، لدينا برنامج للسفر المؤسسي يشمل أسعارًا تعاقدية ومسؤول حساب مخصص لشركتك.',
    },
  ],

  achievements: [
    {
      id: 'forum',
      title: 'ملتقى شركات السفر و السياحة',
      short: 'ملتقى شركات السفر و السياحة',
      year: '2025',
      stamp: 'بغداد',
      place: 'معرض بغداد الدولي',
      photo: 'ach-forum-baghdad.webp',
      body: [
        'تفخر شركة قصر المرايا للسفر والسياحة بمشاركتها في ملتقى شركات السفر والسياحة ضمن فعاليات معرض بغداد الدولي.',
        'تمثل هذه المشاركة فرصة مثالية للتواصل مع رؤاد قطاع السياحة والسفر، وعرض خدماتنا المتميزة.',
      ],
    },
    {
      id: 'fitur',
      title: 'معرض فيتور للسفر والسياحة',
      short: 'معرض فيتور — مدريد',
      year: '2025',
      stamp: 'مدريد',
      place: 'FITUR · مدريد، إسبانيا',
      photo: 'ach-fitur-madrid.webp',
      body: [
        'تشارك قصر المرايا للسفر والسياحة في معرض فيتور 2025، أحد أكبر وأهم المعارض العالمية في مجال السياحة والسفر.',
        'من خلال جناحنا في المعرض، نقدم أحدث العروض السياحية وبرامج السفر الفريدة.',
      ],
    },
    {
      id: 'turkish',
      title: 'تكريمنا من الخطوط التركية',
      short: 'تكريم الخطوط التركية',
      year: '2023',
      stamp: 'تكريم',
      place: 'مكتب قصر المرايا — بغداد',
      photo: 'ach-turkish-airlines.webp',
      body: [
        'تفخر شركة قصر المرايا للسفر والسياحة بحصولها على شهادة تقدير مرموقة من الخطوط الجوية التركية عام 2023.',
        'هذا التكريم هو شهادة على احترافية فريقنا.',
      ],
    },
    {
      id: 'salam',
      title: 'تكريمنا من طيران السلام',
      short: 'تكريم طيران السلام',
      year: '2024',
      stamp: 'تكريم',
      place: 'مكتب قصر المرايا — بغداد',
      photo: 'ach-salam-air.webp',
      body: [
        'يسر شركة قصر المرايا للسفر والسياحة أن تتلقى تكريمًا مميزًا من طيران السلام العماني.',
        'نحن فخورون بهذا التقدير ونتطلع إلى استمرار التعاون المثمر.',
      ],
    },
    {
      id: 'fans',
      title: 'تفويج مشجعي منتخبنا الوطني',
      short: 'تفويج مشجعي المنتخب',
      year: '2024',
      stamp: 'تفويج',
      place: 'انطلاق الأفواج — البصرة',
      photo: 'ach-national-team.webp',
      body: [
        'تفخر شركة قصر المرايا للسفر والسياحة بدورها في دعم الرياضة العراقية وجماهيرها العريقة.',
        'نواصل التزامنا بدعم رياضتنا ومشجعينا في كل رحلة انتصار.',
      ],
    },
  ],

  contact: {
    phone1: '00964-774-9999-600',
    phone2: '00964-784-9999-600',
    email: 'sales@almarayagroup.com',
    address: 'العراق: شارع 14 رمضان، بغداد',
    hotline: '6393',
  },
};

function getRedis() {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.REDIS_URL;
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.REDIS_TOKEN;

  if (!url || !token) {
    throw new Error(
      'No Redis connection found. Expected KV_REST_API_URL/KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN to be set.'
    );
  }
  return new Redis({ url, token });
}

/** Deep-merges saved content over the defaults so new fields never crash old saved data. */
function mergeWithDefaults(saved) {
  if (!saved || typeof saved !== 'object') return defaultContent;
  return {
    jobs: Array.isArray(saved.jobs) && saved.jobs.length ? saved.jobs : defaultContent.jobs,
    faq: Array.isArray(saved.faq) && saved.faq.length ? saved.faq : defaultContent.faq,
    achievements:
      Array.isArray(saved.achievements) && saved.achievements.length
        ? saved.achievements
        : defaultContent.achievements,
    contact: { ...defaultContent.contact, ...(saved.contact || {}) },
  };
}

export async function getContent() {
  try {
    const redis = getRedis();
    const saved = await redis.get(CONTENT_KEY);
    return mergeWithDefaults(saved);
  } catch (err) {
    // If Redis isn't reachable for any reason, fall back to defaults
    // rather than taking the whole site down.
    console.error('getContent failed, using defaults:', err);
    return defaultContent;
  }
}

export async function saveContent(newContent) {
  const redis = getRedis();
  const merged = mergeWithDefaults(newContent);
  await redis.set(CONTENT_KEY, merged);
  return merged;
}
