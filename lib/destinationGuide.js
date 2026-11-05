// Destination guide: quick travel facts per country (main tourist city,
// currency, language, plug type, typical weather, best time, tips).
// Static, hand-written content: edit here to change a guide. Temperatures are
// the usual average daytime high (°C) per month, January → December, rounded.
// Used by /guide/[iso] pages and the small guide box on package pages.

const G = {
  tr: { city: ['إسطنبول', 'Istanbul'], cur: ['الليرة التركية', 'Turkish lira', 'TRY'], lang: ['التركية', 'Turkish'], plugs: 'C, F', temps: [9, 9, 12, 16, 21, 26, 28, 29, 25, 20, 15, 11],
    best: ['نيسان–حزيران وأيلول–تشرين الأول: طقس معتدل وزحام أقل.', 'April–June and September–October: mild weather and fewer crowds.'],
    tips: [['بطاقة «إسطنبول كارت» للمترو والترام والعبّارات توفّر عليك الكثير.', 'An Istanbulkart covers the metro, trams and ferries and saves money.'], ['الشتاء بارد وماطر، فاحمل معطفاً ومظلة.', 'Winters are cold and rainy: pack a jacket and an umbrella.'], ['المساومة أمر طبيعي في البازارات، والمحلات الكبيرة تقبل البطاقات.', 'Haggling is normal in the bazaars; bigger shops take cards.']] },
  tn: { city: ['تونس العاصمة', 'Tunis'], cur: ['الدينار التونسي', 'Tunisian dinar', 'TND'], lang: ['العربية والفرنسية', 'Arabic and French'], plugs: 'C, E', temps: [16, 17, 19, 22, 26, 30, 33, 34, 30, 26, 21, 17],
    best: ['نيسان–حزيران وأيلول–تشرين الأول للجولات، والصيف للبحر.', 'April–June and September–October for touring; summer for the beach.'],
    tips: [['لا يمكن صرف الدينار خارج تونس، فاصرف بقدر حاجتك فقط.', 'The dinar cannot be exchanged outside Tunisia: change only what you need.'], ['سيدي بوسعيد وقرطاج قريبتان من العاصمة وتستحقان نصف يوم.', 'Sidi Bou Said and Carthage are close to Tunis and worth half a day.'], ['الحمامات وسوسة وجهتا البحر والمنتجعات.', 'Hammamet and Sousse are the beach and resort towns.']] },
  om: { city: ['مسقط', 'Muscat'], cur: ['الريال العُماني', 'Omani rial', 'OMR'], lang: ['العربية', 'Arabic'], plugs: 'G', temps: [25, 26, 29, 34, 38, 40, 38, 36, 35, 33, 29, 26],
    best: ['تشرين الأول–آذار، وأجمل أوقات صلالة موسم الخريف (حزيران–أيلول).', 'October–March; Salalah is best in its khareef season (June–September).'],
    tips: [['استأجر سيارة للجولات خارج مسقط، فالطرق ممتازة.', 'Rent a car for trips outside Muscat; the roads are excellent.'], ['الصيف حار جداً، فاجعل جولاتك صباحاً أو مساءً.', 'Summer is very hot: plan outings for mornings and evenings.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  eg: { city: ['شرم الشيخ', 'Sharm El Sheikh'], cur: ['الجنيه المصري', 'Egyptian pound', 'EGP'], lang: ['العربية', 'Arabic'], plugs: 'C, F', temps: [22, 23, 25, 29, 33, 36, 37, 37, 35, 31, 27, 23],
    best: ['تشرين الأول–نيسان: بحر دافئ وشمس ألطف.', 'October–April: warm sea and gentler sun.'],
    tips: [['البحر الأحمر من أحلى أماكن الغطس والسنوركل بالعالم.', 'The Red Sea is one of the best places in the world to dive and snorkel.'], ['احمل واقي الشمس والنظارات، فالشمس قوية حتى في الشتاء.', 'Bring sunscreen and sunglasses: the sun is strong even in winter.'], ['الدولار مقبول في أغلب الأماكن السياحية.', 'US dollars are accepted in most tourist places.']] },
  my: { city: ['كوالالمبور', 'Kuala Lumpur'], cur: ['الرينغيت الماليزي', 'Malaysian ringgit', 'MYR'], lang: ['الملايوية والإنكليزية', 'Malay and English'], plugs: 'G', temps: [32, 33, 33, 33, 33, 32, 32, 32, 32, 32, 32, 31],
    best: ['حزيران–آب أقل الأشهر مطراً في كوالالمبور ولنكاوي، والسفر مناسب طوال العام.', 'June–August is driest in Kuala Lumpur and Langkawi; good all year.'],
    tips: [['أمطار استوائية قصيرة في أغلب الأيام، فاحمل مظلة صغيرة.', 'Short tropical showers most days: keep a small umbrella.'], ['تطبيق Grab للتاكسي وطلب الطعام أرخص وآمن.', 'Use the Grab app for taxis and food: cheaper and safer.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  mv: { city: ['ماليه', 'Malé'], cur: ['الروفية المالديفية', 'Maldivian rufiyaa', 'MVR'], lang: ['الديفيهية والإنكليزية', 'Dhivehi and English'], plugs: 'D, G', temps: [30, 31, 31, 32, 31, 31, 30, 30, 30, 30, 30, 30],
    best: ['كانون الأول–نيسان: موسم الجفاف والبحر الهادئ.', 'December–April: the dry season with calm seas.'],
    tips: [['أغلب المنتجعات تتعامل بالدولار.', 'Most resorts price in US dollars.'], ['التنقل بين الجزر بالقارب السريع أو الطائرة المائية، فتأكد أنه مشمول في الحجز.', 'Island transfers are by speedboat or seaplane: check they are included.'], ['استخدم واقي شمس آمناً على الشعاب المرجانية.', 'Bring reef-safe sunscreen.']] },
  id: { city: ['بالي', 'Bali'], cur: ['الروبية الإندونيسية', 'Indonesian rupiah', 'IDR'], lang: ['الإندونيسية', 'Indonesian'], plugs: 'C, F', tz: 'Asia/Makassar', temps: [31, 31, 31, 32, 31, 30, 29, 30, 31, 32, 32, 31],
    best: ['نيسان–تشرين الأول: موسم الجفاف.', 'April–October: the dry season.'],
    tips: [['تطبيقا Grab وGojek للتنقل.', 'Use Grab or Gojek to get around.'], ['اللباس المحتشم مطلوب داخل المعابد.', 'Modest clothing is required inside temples.'], ['مبالغ الروبية كبيرة، فتأكد من الأصفار قبل الدفع.', 'Rupiah amounts are large: count the zeros before paying.']] },
  th: { city: ['بانكوك', 'Bangkok'], cur: ['البات التايلندي', 'Thai baht', 'THB'], lang: ['التايلندية', 'Thai'], plugs: 'A, B, C, O', temps: [32, 33, 34, 35, 34, 33, 33, 33, 32, 32, 32, 31],
    best: ['تشرين الثاني–شباط: أبرد وأقل مطراً.', 'November–February: cooler and drier.'],
    tips: [['تطبيق Grab للتاكسي، أو قطار BTS المعلّق في بانكوك.', 'Use Grab or the BTS Skytrain in Bangkok.'], ['احترم المعابد والعائلة المالكة، والمعابد تشترط اللباس المحتشم.', 'Respect temples and the royal family; temples require modest dress.'], ['بوكيت وباتايا للبحر، وبانكوك للتسوق.', 'Phuket and Pattaya for the beach; Bangkok for shopping.']] },
  sg: { city: ['سنغافورة', 'Singapore'], cur: ['الدولار السنغافوري', 'Singapore dollar', 'SGD'], lang: ['الإنكليزية والملايوية والصينية', 'English, Malay and Chinese'], plugs: 'G', temps: [30, 31, 32, 32, 32, 31, 31, 31, 31, 31, 31, 30],
    best: ['شباط–نيسان أقل الأشهر مطراً، والسفر مناسب طوال العام.', 'February–April is driest; good all year.'],
    tips: [['مترو MRT سريع ونظيف ويصل إلى كل مكان.', 'The MRT metro is fast, clean and goes everywhere.'], ['الغرامات عالية على رمي النفايات في الشارع.', 'Fines for littering are high.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  lb: { city: ['بيروت', 'Beirut'], cur: ['الليرة اللبنانية', 'Lebanese pound', 'LBP'], lang: ['العربية', 'Arabic'], plugs: 'C, D, G', temps: [17, 17, 19, 22, 25, 28, 30, 31, 29, 27, 23, 19],
    best: ['نيسان–حزيران وأيلول–تشرين الأول، والشتاء للتزلج في الجبال.', 'April–June and September–October; winter for skiing in the mountains.'],
    tips: [['الدولار متداول على نطاق واسع إلى جانب الليرة.', 'US dollars are widely used alongside the pound.'], ['جونية وجبيل والأرز قريبة من بيروت.', 'Jounieh, Byblos and the Cedars are close to Beirut.'], ['الجبل في الصيف أبرد من الساحل بكثير.', 'In summer the mountains are much cooler than the coast.']] },
  ae: { city: ['دبي', 'Dubai'], cur: ['الدرهم الإماراتي', 'UAE dirham', 'AED'], lang: ['العربية والإنكليزية', 'Arabic and English'], plugs: 'G', temps: [24, 25, 28, 33, 38, 40, 41, 41, 39, 35, 30, 26],
    best: ['تشرين الثاني–آذار: أجمل طقس للأنشطة الخارجية.', 'November–March: the best weather for outdoor activities.'],
    tips: [['مترو دبي يصل إلى أغلب الأماكن، والدفع ببطاقة «نول».', 'The Dubai Metro reaches most places; pay with a Nol card.'], ['في الصيف اجعل الأنشطة الخارجية صباحاً أو مساءً.', 'In summer, plan outdoor activities for mornings and evenings.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  jo: { city: ['عمّان', 'Amman'], cur: ['الدينار الأردني', 'Jordanian dinar', 'JOD'], lang: ['العربية', 'Arabic'], plugs: 'C, D, F, G, J', temps: [12, 14, 17, 23, 28, 31, 32, 33, 31, 27, 20, 14],
    best: ['آذار–أيار وأيلول–تشرين الثاني، والعقبة والبحر الميت دافئان في الشتاء.', 'March–May and September–November; Aqaba and the Dead Sea are warm in winter.'],
    tips: [['البتراء تحتاج يوماً كاملاً، فالبس حذاءً مريحاً.', 'Petra needs a full day: wear comfortable shoes.'], ['عمّان باردة في الشتاء وقد تتساقط فيها الثلوج.', 'Amman is cold in winter and can snow.'], ['البحر الميت على بعد ساعة تقريباً من عمّان.', 'The Dead Sea is about an hour from Amman.']] },
  bh: { city: ['المنامة', 'Manama'], cur: ['الدينار البحريني', 'Bahraini dinar', 'BHD'], lang: ['العربية', 'Arabic'], plugs: 'G', temps: [20, 21, 25, 29, 34, 36, 37, 38, 36, 33, 28, 22],
    best: ['تشرين الثاني–آذار: طقس لطيف.', 'November–March: pleasant weather.'],
    tips: [['جسر الملك فهد يربطها بالسعودية.', 'The King Fahd Causeway links it to Saudi Arabia.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.'], ['الصيف حار ورطب، فاجعل نزهاتك مساءً.', 'Summers are hot and humid: go out in the evening.']] },
  sa: { city: ['مكة المكرمة', 'Makkah'], cur: ['الريال السعودي', 'Saudi riyal', 'SAR'], lang: ['العربية', 'Arabic'], plugs: 'G', temps: [30, 31, 34, 38, 41, 43, 43, 42, 42, 40, 35, 31],
    best: ['تشرين الثاني–شباط الأبرد، ومواسم رمضان والعطل تحتاج حجزاً مبكراً.', 'November–February is coolest; Ramadan and holidays need early booking.'],
    tips: [['تطبيق «نسك» لتصاريح العمرة والروضة الشريفة.', 'Use the Nusuk app for Umrah and Rawdah permits.'], ['اشرب الماء بكثرة واحمل مظلة للشمس.', 'Drink plenty of water and carry a sun umbrella.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  cn: { city: ['غوانزو', 'Guangzhou'], cur: ['اليوان الصيني', 'Chinese yuan', 'CNY'], lang: ['الصينية', 'Chinese'], plugs: 'A, C, I', temps: [18, 19, 22, 26, 30, 32, 33, 33, 32, 29, 25, 20],
    best: ['تشرين الأول–كانون الأول، ومعرض كانتون يُقام في الربيع والخريف.', 'October–December; the Canton Fair runs in spring and autumn.'],
    tips: [['أغلب تطبيقات Google وواتساب محجوبة، فرتّب وسيلة تواصلك قبل السفر.', 'Most Google apps and WhatsApp are blocked: arrange how you will stay in touch before you go.'], ['الدفع عبر Alipay وWeChat Pay منتشر جداً.', 'Alipay and WeChat Pay are used almost everywhere.'], ['احتفظ بعنوان الفندق مكتوباً بالصينية لسائق التاكسي.', 'Keep your hotel address written in Chinese for taxis.']] },
  ma: { city: ['مراكش', 'Marrakech'], cur: ['الدرهم المغربي', 'Moroccan dirham', 'MAD'], lang: ['العربية والفرنسية', 'Arabic and French'], plugs: 'C, E', temps: [18, 20, 23, 25, 29, 33, 37, 37, 32, 28, 22, 19],
    best: ['آذار–أيار وأيلول–تشرين الثاني.', 'March–May and September–November.'],
    tips: [['المساومة أمر طبيعي في أسواق المدينة القديمة.', 'Haggling is normal in the old-town souks.'], ['ساحة جامع الفنا في أجمل حالاتها ليلاً.', 'Jemaa el-Fnaa square comes alive at night.'], ['ليالي الشتاء باردة حتى لو كان النهار دافئاً.', 'Winter nights are cold even when days are warm.']] },
  us: { city: ['نيويورك', 'New York'], cur: ['الدولار الأمريكي', 'US dollar', 'USD'], lang: ['الإنكليزية', 'English'], plugs: 'A, B', temps: [4, 5, 10, 17, 22, 27, 29, 28, 24, 18, 12, 6],
    best: ['نيسان–حزيران وأيلول–تشرين الثاني.', 'April–June and September–November.'],
    tips: [['البقشيش بنسبة 15–20% في المطاعم أمر متعارف عليه.', 'A 15–20% tip is expected in restaurants.'], ['الأسعار المعروضة لا تشمل الضريبة عادةً.', 'Displayed prices usually exclude sales tax.'], ['الشتاء بارد جداً وقد تتساقط الثلوج.', 'Winters are very cold and it can snow.']] },
  it: { city: ['روما', 'Rome'], cur: ['اليورو', 'Euro', 'EUR'], lang: ['الإيطالية', 'Italian'], plugs: 'C, F, L', temps: [12, 13, 16, 19, 23, 28, 31, 31, 27, 22, 16, 13],
    best: ['نيسان–حزيران وأيلول–تشرين الأول.', 'April–June and September–October.'],
    tips: [['احجز تذاكر الفاتيكان والكولوسيوم مسبقاً.', 'Book Vatican and Colosseum tickets in advance.'], ['احذر النشالين في الأماكن المزدحمة والمترو.', 'Watch for pickpockets in crowds and on the metro.'], ['في آب تُغلق محلات كثيرة للعطلة.', 'In August many shops close for the holidays.']] },
  gb: { city: ['لندن', 'London'], cur: ['الجنيه الإسترليني', 'Pound sterling', 'GBP'], lang: ['الإنكليزية', 'English'], plugs: 'G', temps: [8, 9, 11, 14, 18, 21, 23, 23, 20, 16, 11, 8],
    best: ['أيار–أيلول: نهار أطول وطقس ألطف.', 'May–September: longer days and milder weather.'],
    tips: [['ادفع أجور المواصلات بالبطاقة اللاتلامسية أو بطاقة Oyster.', 'Pay for transport with a contactless card or an Oyster card.'], ['الطقس متقلب حتى في الصيف، فاحمل مظلة.', 'Weather changes quickly even in summer: carry an umbrella.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  ge: { city: ['تبليسي', 'Tbilisi'], cur: ['اللاري الجورجي', 'Georgian lari', 'GEL'], lang: ['الجورجية', 'Georgian'], plugs: 'C, F', temps: [6, 8, 13, 18, 24, 28, 31, 31, 26, 20, 13, 8],
    best: ['أيار–تشرين الأول للطبيعة، وكانون الأول–آذار للثلوج في غودوري.', 'May–October for nature; December–March for snow in Gudauri.'],
    tips: [['تطبيق Bolt للتاكسي.', 'Use the Bolt app for taxis.'], ['يمكن صرف الدولار إلى اللاري بسهولة.', 'US dollars are easy to change into lari.'], ['باتومي على البحر الأسود جميلة في الصيف.', 'Batumi on the Black Sea is lovely in summer.']] },
  lk: { city: ['كولومبو', 'Colombo'], cur: ['الروبية السريلانكية', 'Sri Lankan rupee', 'LKR'], lang: ['السنهالية والتاميلية', 'Sinhala and Tamil'], plugs: 'D, G, M', temps: [31, 31, 31, 31, 31, 30, 29, 29, 30, 30, 30, 30],
    best: ['كانون الأول–آذار للساحلين الغربي والجنوبي.', 'December–March for the west and south coasts.'],
    tips: [['التوك توك أسهل وسيلة للتنقل داخل المدن.', 'Tuk-tuks are the easiest way to get around town.'], ['كاندي ونوارا إليا للجبال ومزارع الشاي.', 'Kandy and Nuwara Eliya for the hills and tea estates.'], ['اللباس المحتشم مطلوب في المعابد.', 'Modest clothing is required at temples.']] },
  fr: { city: ['باريس', 'Paris'], cur: ['اليورو', 'Euro', 'EUR'], lang: ['الفرنسية', 'French'], plugs: 'C, E', temps: [7, 8, 12, 16, 20, 23, 25, 25, 21, 16, 11, 8],
    best: ['نيسان–حزيران وأيلول–تشرين الأول.', 'April–June and September–October.'],
    tips: [['احجز تذاكر برج إيفل واللوفر مسبقاً.', 'Book the Eiffel Tower and the Louvre in advance.'], ['احذر النشالين في المترو والأماكن السياحية.', 'Watch for pickpockets on the metro and at sights.'], ['المترو أسرع وسيلة للتنقل.', 'The metro is the fastest way around.']] },
  qa: { city: ['الدوحة', 'Doha'], cur: ['الريال القطري', 'Qatari riyal', 'QAR'], lang: ['العربية', 'Arabic'], plugs: 'D, G', temps: [22, 23, 27, 32, 38, 41, 41, 41, 39, 35, 29, 24],
    best: ['تشرين الثاني–آذار.', 'November–March.'],
    tips: [['مترو الدوحة حديث ويصل إلى الأماكن الرئيسية.', 'The Doha Metro is modern and reaches the main sights.'], ['سوق واقف والكورنيش في أجمل حالاتهما ليلاً.', 'Souq Waqif and the Corniche are best at night.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  kh: { city: ['سيم ريب', 'Siem Reap'], cur: ['الريال الكمبودي', 'Cambodian riel', 'KHR'], lang: ['الخميرية', 'Khmer'], plugs: 'A, C, G', temps: [31, 33, 34, 35, 34, 33, 32, 32, 31, 31, 31, 30],
    best: ['تشرين الثاني–آذار: موسم الجفاف.', 'November–March: the dry season.'],
    tips: [['الدولار متداول على نطاق واسع إلى جانب الريال.', 'US dollars are widely used alongside the riel.'], ['أنغكور وات تحتاج يوماً أو يومين، ويُفضّل زيارتها وقت الشروق.', 'Angkor Wat needs a day or two: go at sunrise.'], ['اللباس المحتشم مطلوب في المعابد.', 'Modest clothing is required at temples.']] },
};

export const GUIDE_ISOS = Object.keys(G);

const IRAQ_PLUGS = ['C', 'D', 'G'];

export function guideFor(iso, lang = 'ar') {
  const g = G[String(iso || '').toLowerCase()];
  if (!g) return null;
  const i = lang === 'en' ? 1 : 0;
  const plugs = g.plugs.split(',').map((s) => s.trim());
  return {
    iso: String(iso).toLowerCase(),
    city: g.city[i],
    currency: g.cur[i],
    currencyCode: g.cur[2],
    language: g.lang[i],
    plugs: g.plugs,
    needsAdapter: !plugs.some((p) => IRAQ_PLUGS.includes(p)),
    temps: g.temps,
    best: g.best[i],
    tips: g.tips.map((t) => t[i]),
    tz: g.tz || null,
  };
}
