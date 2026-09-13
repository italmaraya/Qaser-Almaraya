// Static content for the "Groups & Packages" feature.
// Package records themselves live in the database (table: packages) so the
// admin dashboard can create/edit/delete them — this file only holds fixed
// reference content (categories, filter lists, UI strings) plus the sample
// rows used to seed the table the first time it's empty.

export const DIGITS_AR = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
export function toArabicNum(n) {
  return String(n);
}
export function money(n, lang) {
  const v = lang === 'ar' ? toArabicNum(n) : String(n);
  return v + ' $';
}
export function signed(n, lang) {
  if (n === 0) return '—';
  const sign = n > 0 ? '+' : '−';
  return sign + (lang === 'ar' ? toArabicNum(Math.abs(n)) : String(Math.abs(n))) + ' $';
}

export const CATS = [
  { id: 'family', icon: 'users', ar: 'عائلي', en: 'Family', blurbAr: 'برامج مريحة تناسب الأطفال والكبار.', blurbEn: 'Easy-paced programs for kids and adults alike.' },
  { id: 'group', icon: 'handshake', ar: 'مجموعات', en: 'Group tours', blurbAr: 'لمجموعات الأصدقاء وزملاء العمل والمؤسسات.', blurbEn: 'For friend groups, colleagues, and organizations.' },
  { id: 'event', icon: 'calendar-check', ar: 'فعاليات', en: 'Event travel', blurbAr: 'حفلات ومباريات ومؤتمرات — السفر منظم حول موعد الحدث.', blurbEn: 'Concerts, matches, conferences — travel built around the event date.' },
  { id: 'umrah', icon: 'moon', ar: 'عمرة وحج', en: 'Umrah & religious', blurbAr: 'برامج روحية بإقامة قريبة من الحرمين.', blurbEn: 'Spiritual programs with stays close to the Haramain.' },
  { id: 'adventure', icon: 'map-pinned', ar: 'مغامرة وطبيعة', en: 'Adventure & nature', blurbAr: 'للمستكشفين الباحثين عن الطبيعة والمساحات المفتوحة.', blurbEn: 'For explorers chasing nature and open spaces.' },
];

export const COUNTRIES_LIST = [
  { id: 'my', ar: 'ماليزيا', en: 'Malaysia' },
  { id: 'id', ar: 'إندونيسيا (بالي)', en: 'Indonesia (Bali)' },
  { id: 'ae', ar: 'الإمارات', en: 'UAE' },
  { id: 'sa', ar: 'السعودية', en: 'Saudi Arabia' },
  { id: 'ge', ar: 'جورجيا', en: 'Georgia' },
];

export const NATIONALITIES = [
  { id: 'iq', ar: 'عراقي', en: 'Iraqi' },
  { id: 'sa', ar: 'سعودي', en: 'Saudi' },
  { id: 'ae', ar: 'إماراتي', en: 'Emirati' },
  { id: 'jo', ar: 'أردني', en: 'Jordanian' },
  { id: 'eg', ar: 'مصري', en: 'Egyptian' },
  { id: 'kw', ar: 'كويتي', en: 'Kuwaiti' },
  { id: 'other', ar: 'أخرى', en: 'Other' },
];

export const PREFS = [
  { id: 'kids', ar: 'مع الأطفال', en: 'Travelling with kids' },
  { id: 'nature', ar: 'طبيعة', en: 'Nature' },
  { id: 'history', ar: 'تاريخ ومتاحف', en: 'History & museums' },
  { id: 'shopping', ar: 'تسوق', en: 'Shopping' },
];

// Sample packages used ONLY to seed the `packages` table the first time it's
// empty. After that, everything comes from the database and is managed from
// the admin dashboard — editing this array has no effect on a live site that
// has already seeded.
export const SEED_PACKAGES = [
  {
    cat: 'family', countries: ['my', 'id'], destAr: 'كوالالمبور وبالي', destEn: 'Kuala Lumpur & Bali',
    titleAr: 'عائلتي في كوالالمبور وبالي', titleEn: 'Kuala Lumpur & Bali Family Escape',
    nightsAr: '9 ليالٍ', nightsEn: '9 nights', departsAr: 'كل اثنين', departsEn: 'Every Monday',
    price: 1390, childPrice: 970, badgeAr: 'الأكثر طلباً', badgeEn: 'Most popular', prefs: ['kids', 'nature'],
    includesAr: ['طيران ذهاب وعودة', 'جولات المدينتين', 'تنقلات المطار', 'تذاكر الحدائق'],
    includesEn: ['Round-trip flights', 'City tours in both destinations', 'Airport transfers', 'Park tickets'],
    hotels: [{ nameAr: 'فندق أورشيد 4★ — كوالالمبور', nameEn: 'Orchid Hotel 4★ — KL', diff: 0 }, { nameAr: 'فندق ماريتايم 5★ — كوالالمبور', nameEn: 'Maritime Hotel 5★ — KL', diff: 120 }, { nameAr: 'منتجع بالي جاردنز 5★', nameEn: 'Bali Gardens Resort 5★', diff: 180 }],
    flights: [{ nameAr: 'الخطوط الماليزية — رحلة مباشرة', nameEn: 'Malaysia Airlines — direct', diff: 0 }, { nameAr: 'طيران الخليج — عبر البحرين', nameEn: 'Gulf Air — via Bahrain', diff: -60 }],
    days: [
      { titleAr: 'اليوم 1 — الوصول إلى كوالالمبور', descAr: 'استقبال في المطار وتوجه إلى الفندق، مساء حر للاستراحة.', titleEn: 'Day 1 — Arrival in Kuala Lumpur', descEn: 'Airport pickup and hotel check-in, free evening to rest.' },
      { titleAr: 'اليوم 2 — جولة المدينة والبتروناس', descAr: 'زيارة برجي بتروناس، الحي الصيني، وسوق بوكيت بينتانج.', titleEn: 'Day 2 — City tour & Petronas Towers', descEn: 'Visit the Petronas Towers, Chinatown, and Bukit Bintang market.' },
      { titleAr: 'اليوم 3 — التوجه إلى بالي', descAr: 'رحلة داخلية إلى بالي واستقرار في المنتجع.', titleEn: 'Day 3 — Fly to Bali', descEn: 'Domestic flight to Bali and resort check-in.' },
      { titleAr: 'اليوم 4 — معابد وشلالات أوبود', descAr: 'جولة في حقول الأرز والمعابد وشلالات أوبود.', titleEn: 'Day 4 — Ubud temples & waterfalls', descEn: 'Tour through rice terraces, temples, and Ubud waterfalls.' },
    ],
  },
  {
    cat: 'group', countries: ['ae'], destAr: 'دبي', destEn: 'Dubai',
    titleAr: 'دبي لمجموعتكم', titleEn: 'Dubai for Your Group',
    nightsAr: '4 ليالٍ', nightsEn: '4 nights', departsAr: 'كل أربعاء', departsEn: 'Every Wednesday',
    price: 590, childPrice: 410, badgeAr: '', badgeEn: '', prefs: ['shopping', 'history'],
    includesAr: ['طيران ذهاب وعودة', 'فندق 4 نجوم', 'تأشيرة زيارة', 'جولة سفاري صحراوية'],
    includesEn: ['Round-trip flights', '4★ hotel', 'Visit visa', 'Desert safari tour'],
    hotels: [{ nameAr: 'فندق داون تاون 4★', nameEn: 'Downtown Hotel 4★', diff: 0 }, { nameAr: 'فندق مارينا 5★', nameEn: 'Marina Hotel 5★', diff: 95 }],
    flights: [{ nameAr: 'فلاي دبي', nameEn: 'flydubai', diff: 0 }, { nameAr: 'طيران الإمارات', nameEn: 'Emirates', diff: 40 }],
    days: [
      { titleAr: 'اليوم 1 — الوصول', descAr: 'استقبال في المطار والتوجه إلى الفندق.', titleEn: 'Day 1 — Arrival', descEn: 'Airport pickup and hotel check-in.' },
      { titleAr: 'اليوم 2 — جولة المدينة', descAr: 'برج خليفة، دبي مول، ومنطقة الخور التاريخية.', titleEn: 'Day 2 — City tour', descEn: 'Burj Khalifa, Dubai Mall, and the historic creek district.' },
      { titleAr: 'اليوم 3 — سفاري صحراوي', descAr: 'تجربة تطعيس، ركوب الجمال، وعشاء بدوي.', titleEn: 'Day 3 — Desert safari', descEn: 'Dune bashing, camel ride, and a Bedouin dinner.' },
    ],
  },
  {
    cat: 'event', countries: ['ae'], destAr: 'أبوظبي', destEn: 'Abu Dhabi',
    titleAr: 'حفل عمرو دياب — أبوظبي', titleEn: 'Amr Diab Live — Abu Dhabi',
    nightsAr: '3 ليالٍ', nightsEn: '3 nights', departsAr: '20 نوفمبر 2026 فقط', departsEn: 'Nov 20, 2026 only',
    price: 780, childPrice: 560, badgeAr: 'مقاعد محدودة', badgeEn: 'Limited seats', prefs: [],
    includesAr: ['طيران ذهاب وعودة', 'فندق 4 نجوم قريب من القاعة', 'تذكرة الحفل — الفئة الذهبية', 'تنقلات القاعة'],
    includesEn: ['Round-trip flights', '4★ hotel near the arena', 'Concert ticket — Gold category', 'Arena transfers'],
    hotels: [{ nameAr: 'فندق كورنيش 4★', nameEn: 'Corniche Hotel 4★', diff: 0 }, { nameAr: 'فندق ياس 5★', nameEn: 'Yas Hotel 5★', diff: 140 }],
    flights: [{ nameAr: 'الاتحاد للطيران', nameEn: 'Etihad Airways', diff: 0 }, { nameAr: 'طيران الخليج', nameEn: 'Gulf Air', diff: -30 }],
    days: [
      { titleAr: 'اليوم 1 — الوصول', descAr: 'استقبال في المطار والتوجه إلى الفندق، مساء حر.', titleEn: 'Day 1 — Arrival', descEn: 'Airport pickup and hotel check-in, free evening.' },
      { titleAr: 'اليوم 2 — ليلة الحفل', descAr: 'التوجه إلى قاعة الحفل مساءً — حفل عمرو دياب.', titleEn: 'Day 2 — Concert night', descEn: 'Transfer to the arena in the evening for the Amr Diab concert.' },
      { titleAr: 'اليوم 3 — وقت حر والمغادرة', descAr: 'صباح حر للتسوق، ثم التوجه إلى المطار.', titleEn: 'Day 3 — Free time & departure', descEn: 'A free morning for shopping, then airport transfer.' },
    ],
  },
  {
    cat: 'umrah', countries: ['sa'], destAr: 'مكة والمدينة', destEn: 'Makkah & Madinah',
    titleAr: 'عمرة العائلة', titleEn: 'Family Umrah Journey',
    nightsAr: '10 ليالٍ', nightsEn: '10 nights', departsAr: 'مواعيد أسبوعية', departsEn: 'Weekly departures',
    price: 1250, childPrice: 900, badgeAr: '', badgeEn: '', prefs: ['kids'],
    includesAr: ['طيران ذهاب وعودة', 'إقامة قريبة من الحرمين', 'تنقلات بالباص', 'مشرف ديني'],
    includesEn: ['Round-trip flights', 'Stays close to the Haramain', 'Bus transfers', 'Religious supervisor'],
    hotels: [{ nameAr: 'فندق البركة 3★ — قريب من الحرم', nameEn: 'Al Baraka Hotel 3★ — near the Haram', diff: 0 }, { nameAr: 'فندق الصفوة 5★ — إطلالة على الحرم', nameEn: 'Al Safwa Hotel 5★ — Haram view', diff: 210 }],
    flights: [{ nameAr: 'الخطوط السعودية', nameEn: 'Saudia', diff: 0 }, { nameAr: 'طيران ناس', nameEn: 'flynas', diff: -40 }],
    days: [
      { titleAr: 'اليوم 1 — الوصول إلى مكة', descAr: 'استقبال وتوجه إلى الفندق، أداء العمرة مساءً.', titleEn: 'Day 1 — Arrival in Makkah', descEn: 'Pickup and hotel check-in, Umrah rites in the evening.' },
      { titleAr: 'اليوم 2-5 — العبادة في مكة', descAr: 'أيام حرة للعبادة والزيارة حول الحرم المكي.', titleEn: 'Days 2–5 — Worship in Makkah', descEn: 'Free days for worship and visits around the Grand Mosque.' },
      { titleAr: 'اليوم 6 — التوجه إلى المدينة', descAr: 'انتقال بالباص إلى المدينة المنورة والإقامة قريباً من الحرم النبوي.', titleEn: 'Day 6 — Transfer to Madinah', descEn: "Bus transfer to Madinah, staying near the Prophet's Mosque." },
      { titleAr: 'اليوم 7-10 — العبادة في المدينة والمغادرة', descAr: 'أيام للزيارة والعبادة، ثم التوجه إلى المطار.', titleEn: 'Days 7–10 — Worship in Madinah & departure', descEn: 'Days for visits and worship, then airport transfer.' },
    ],
  },
  {
    cat: 'adventure', countries: ['ge'], destAr: 'تبليسي وباتومي', destEn: 'Tbilisi & Batumi',
    titleAr: 'جورجيا الخضراء', titleEn: 'Green Georgia',
    nightsAr: '7 ليالٍ', nightsEn: '7 nights', departsAr: 'كل سبت', departsEn: 'Every Saturday',
    price: 890, childPrice: 620, badgeAr: '', badgeEn: '', prefs: ['nature'],
    includesAr: ['طيران ذهاب وعودة', 'إقامة في وسط المدينة', 'جولات الطبيعة اليومية', 'تنقلات المطار'],
    includesEn: ['Round-trip flights', 'Downtown accommodation', 'Daily nature excursions', 'Airport transfers'],
    hotels: [{ nameAr: 'فندق أولد تبليسي 4★', nameEn: 'Old Tbilisi Hotel 4★', diff: 0 }, { nameAr: 'فندق باتومي بيتش 5★', nameEn: 'Batumi Beach Hotel 5★', diff: 100 }],
    flights: [{ nameAr: 'طيران جورجيا', nameEn: 'Georgian Airways', diff: 0 }, { nameAr: 'طيران الخليج — عبر البحرين', nameEn: 'Gulf Air — via Bahrain', diff: -25 }],
    days: [
      { titleAr: 'اليوم 1 — الوصول إلى تبليسي', descAr: 'استقبال وتوجه إلى الفندق، جولة مسائية في البلدة القديمة.', titleEn: 'Day 1 — Arrival in Tbilisi', descEn: 'Pickup and hotel check-in, an evening walk in the Old Town.' },
      { titleAr: 'اليوم 2 — جبال قزبيجي', descAr: 'رحلة يوم كامل إلى جبال القوقاز وكنيسة غيرغيتي.', titleEn: 'Day 2 — Kazbegi mountains', descEn: 'Full-day trip to the Caucasus mountains and Gergeti Church.' },
      { titleAr: 'اليوم 3 — التوجه إلى باتومي', descAr: 'رحلة بالطريق الساحلي إلى باتومي.', titleEn: 'Day 3 — Transfer to Batumi', descEn: 'Scenic coastal drive to Batumi.' },
      { titleAr: 'اليوم 4 — الحديقة النباتية والساحل', descAr: 'زيارة الحديقة النباتية ووقت حر على الساحل.', titleEn: 'Day 4 — Botanical garden & coast', descEn: 'Visit the Botanical Garden and free time on the coast.' },
    ],
  },
];

export const T = {
  ar: {
    nav_packages: 'المجموعات والباقات', hero_eyebrow: 'المجموعات والباقات', hero_title: 'نُخطط لمجموعتك… وأنتم تستمتعون بالرحلة',
    hero_sub: 'باقات جاهزة بسعر واحد للفرد، لكل نوع من المجموعات — عائلات، مجموعات، فعاليات، عمرة، ومغامرات. اختاروا باقتكم أو اطلبوا واحدة مخصّصة.',
    hero_cta: 'ابحث عن باقة', hero_cta2: 'تصفح الباقات المميزة ←',
    categories_title: 'لكل مجموعة باقتها', categories_sub: 'صنّفنا باقاتنا حسب نوع مجموعتكم — اختاروا ما يناسبكم.',
    packages_title: 'باقات مختارة لكم', packages_sub: 'الأسعار تبدأ من سعر الفرد، وتشمل ما هو مذكور في كل باقة.',
    starts_from: 'يبدأ من', details_arrow: 'التفاصيل ←',
    custom_title: 'لا تجدون ما يناسب مجموعتكم؟', custom_body: 'أخبرونا بعدد المسافرين والوجهة والميزانية، وسنبني لكم باقة خاصة من الصفر.', custom_cta: 'اطلب باقة مخصصة',
    back_to_home: '← الرئيسية', results_title: 'نتائج البحث', results_sub: 'صفّوا النتائج حسب الوجهة، التصنيف، واهتمامات المسافرين.',
    filter_destination_ph: 'إلى أين تريدون السفر؟', filter_category_label: 'التصنيف', filter_pref_label: 'اهتمامات المسافرين', filter_dates_label: 'التواريخ المفضلة', filter_dates_ph: 'متى تريدون السفر؟', filter_panel_title: 'تصفية النتائج',
    no_results: 'لا توجد باقات مطابقة الآن — جرّبوا تصنيفاً آخر أو تواصلوا معنا لباقة مخصّصة.',
    back_to_results: '← نتائج البحث', overview_title: 'نظرة عامة على الباقة', calendar_title: 'برنامج الرحلة يوماً بيوم',
    hotel_title: 'اختاروا فندقكم', flight_title: 'اختاروا رحلتكم', price_title: 'ملخص السعر',
    detail_base: 'السعر الأساسي للفرد', detail_upgrade: 'فرق الترقية', detail_total_pp: 'الإجمالي للفرد',
    detail_travelers: 'عدد المسافرين', detail_total: 'الإجمالي الكلي', detail_cta: 'استمر إلى الحجز',
    detail_note: 'الدفع الفوري متاح بعد اختيار الفندق والرحلة. التأشيرة، إن وجدت، مشمولة في السعر.',
    gallery_hint: 'صورة الوجهة', all_categories: 'الكل',
    filter_nationality_label: 'جنسية المسافر', country_not_found: 'لم نجد هذه الوجهة — جرّبوا إحدى هذه الوجهات، أو تواصلوا معنا لباقة مخصّصة:',
    detail_child_price: 'سعر الطفل للفرد', detail_adults: 'البالغون', detail_children: 'الأطفال',
    back_to_detail: '← تفاصيل الباقة', booking_title: 'بيانات المسافرين', pax_name: 'الاسم الكامل', pax_passport: 'رقم الجواز', pax_phone: 'رقم الهاتف / واتساب', pax_email: 'البريد الإلكتروني', pax_adult: 'مسافر بالغ', pax_child: 'مسافر طفل', pax_remove: 'حذف', add_adult: '+ إضافة بالغ', add_child: '+ إضافة طفل', booking_cta: 'استمر إلى الدفع',
    back_to_booking: '← بيانات المسافرين', payment_title: 'طرق الدفع',
    booking_done_title: 'تم استلام حجزكم', booking_done_body: 'سيتواصل معكم فريقنا قريباً لتأكيد التفاصيل والدفع.', booking_order_no: 'رقم الحجز',
  },
  en: {
    nav_packages: 'Groups & Packages', hero_eyebrow: 'GROUPS & PACKAGES', hero_title: "We plan your group's trip… you enjoy the journey",
    hero_sub: 'Ready-made packages at one price per person, for every kind of group — families, group tours, events, Umrah, and adventure. Pick a package or ask for a custom one.',
    hero_cta: 'Search packages', hero_cta2: 'Browse featured packages →',
    categories_title: 'A package for every group', categories_sub: 'Packages sorted by the kind of group you are — pick what fits you.',
    packages_title: 'Packages picked for you', packages_sub: "Prices start from the per-person rate and include what's listed on each package.",
    starts_from: 'From', details_arrow: 'Details →',
    custom_title: "Can't find the right fit?", custom_body: "Tell us your traveller count, destination, and budget, and we'll build a custom package from scratch.", custom_cta: 'Request a custom package',
    back_to_home: '← Home', results_title: 'Search results', results_sub: 'Filter by destination, category, and traveller preferences.',
    filter_destination_ph: 'Where do you want to go?', filter_category_label: 'Category', filter_pref_label: 'Traveller preferences', filter_dates_label: 'Preferred dates', filter_dates_ph: 'When do you want to travel?', filter_panel_title: 'Refine results',
    no_results: 'No matching packages right now — try another category or contact us for a custom package.',
    back_to_results: '← Back to results', overview_title: 'Package overview', calendar_title: 'Day-by-day itinerary',
    hotel_title: 'Choose your hotel', flight_title: 'Choose your flight', price_title: 'Price summary',
    detail_base: 'Base price per person', detail_upgrade: 'Upgrade difference', detail_total_pp: 'Total per person',
    detail_travelers: 'Travellers', detail_total: 'Grand total', detail_cta: 'Continue to booking',
    detail_note: 'Instant payment is available once you pick a hotel and flight. Visa, where required, is included in the price.',
    gallery_hint: 'Destination photo', all_categories: 'All',
    filter_nationality_label: 'Traveller nationality', country_not_found: "We couldn't find that destination — try one of these, or contact us for a custom package:",
    detail_child_price: 'Child price per person', detail_adults: 'Adults', detail_children: 'Children',
    back_to_detail: '← Package details', booking_title: 'Passenger details', pax_name: 'Full name', pax_passport: 'Passport number', pax_phone: 'Phone / WhatsApp', pax_email: 'Email', pax_adult: 'Adult passenger', pax_child: 'Child passenger', pax_remove: 'Remove', add_adult: '+ Add adult', add_child: '+ Add child', booking_cta: 'Continue to payment',
    back_to_booking: '← Passenger details', payment_title: 'Payment methods',
    booking_done_title: 'Booking received', booking_done_body: "Our team will contact you shortly to confirm details and payment.", booking_order_no: 'Booking number',
  },
};

export function catLabel(id, lang) {
  const c = CATS.find((x) => x.id === id);
  if (!c) return id;
  return lang === 'en' ? c.en : c.ar;
}
export function countryLabel(id, lang) {
  const c = COUNTRIES_LIST.find((x) => x.id === id);
  if (!c) return id;
  return lang === 'en' ? c.en : c.ar;
}
export function prefLabel(id, lang) {
  const p = PREFS.find((x) => x.id === id);
  if (!p) return id;
  return lang === 'en' ? p.en : p.ar;
}
