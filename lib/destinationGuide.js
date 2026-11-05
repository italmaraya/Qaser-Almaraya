// Destination guide: quick travel facts per country (main tourist city,
// currency, language, plug type, typical weather, best time, tips).
// Static, hand-written content: edit here to change a guide. Temperatures are
// the usual average daytime high (°C) per month, January → December, rounded.
// Used by /guide/[iso] pages and the small guide box on package pages.

const G = {
  tr: { city: ['إسطنبول', 'Istanbul'], cur: ['الليرة التركية', 'Turkish lira', 'TRY'], lang: ['التركية', 'Turkish'], plugs: 'C, F', temps: [9, 9, 12, 16, 21, 26, 28, 29, 25, 20, 15, 11],
    best: ['نيسان–حزيران وأيلول–تشرين الأول: طقس معتدل وأجواء مريحة.', 'April–June and September–October: mild weather and a relaxed feel.'],
    tips: [['بطاقة «إسطنبول كارت» تفتح لك المترو والترام والعبّارات بسعر أوفر.', 'An Istanbulkart opens up the metro, trams and ferries at a better price.'], ['رحلة بالعبّارة في البوسفور عند الغروب من أجمل تجارب إسطنبول.', 'A Bosphorus ferry ride at sunset is one of the best things to do in Istanbul.'], ['التسوق في البازار الكبير تجربة ممتعة، والمساومة جزء من متعتها.', 'Shopping in the Grand Bazaar is great fun, and bargaining is part of it.']] },
  tn: { city: ['تونس العاصمة', 'Tunis'], cur: ['الدينار التونسي', 'Tunisian dinar', 'TND'], lang: ['العربية والفرنسية', 'Arabic and French'], plugs: 'C, E', temps: [16, 17, 19, 22, 26, 30, 33, 34, 30, 26, 21, 17],
    best: ['نيسان–حزيران وأيلول–تشرين الأول للجولات، والصيف للبحر.', 'April–June and September–October for touring; summer for the beach.'],
    tips: [['المطبخ التونسي غني بالنكهات، فجرّب الكسكسي والبريك والمأكولات البحرية.', 'Tunisian food is full of flavour: try couscous, brik and fresh seafood.'], ['سيدي بوسعيد وقرطاج قريبتان من العاصمة وتستحقان نصف يوم.', 'Sidi Bou Said and Carthage are close to Tunis and worth half a day.'], ['الحمامات وسوسة وجهتا البحر والمنتجعات.', 'Hammamet and Sousse are the beach and resort towns.']] },
  om: { city: ['مسقط', 'Muscat'], cur: ['الريال العُماني', 'Omani rial', 'OMR'], lang: ['العربية', 'Arabic'], plugs: 'G', temps: [25, 26, 29, 34, 38, 40, 38, 36, 35, 33, 29, 26],
    best: ['تشرين الأول–آذار، وأجمل أوقات صلالة موسم الخريف (حزيران–أيلول).', 'October–March; Salalah is best in its khareef season (June–September).'],
    tips: [['استأجر سيارة للجولات خارج مسقط، فالطرق ممتازة.', 'Rent a car for trips outside Muscat; the roads are excellent.'], ['أمسيات مسقط على الكورنيش وفي سوق مطرح من أجمل أوقات التنزه.', 'Evenings on the Muscat Corniche and in Mutrah Souq are a highlight.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  eg: { city: ['شرم الشيخ', 'Sharm El Sheikh'], cur: ['الجنيه المصري', 'Egyptian pound', 'EGP'], lang: ['العربية', 'Arabic'], plugs: 'C, F', temps: [22, 23, 25, 29, 33, 36, 37, 37, 35, 31, 27, 23],
    best: ['تشرين الأول–نيسان: بحر دافئ وشمس ألطف.', 'October–April: warm sea and gentler sun.'],
    tips: [['البحر الأحمر من أحلى أماكن الغطس والسنوركل بالعالم.', 'The Red Sea is one of the best places in the world to dive and snorkel.'], ['الشمس مشرقة طوال العام، والشاطئ ممتع حتى في الشتاء.', 'The sun shines all year, so the beach is a joy even in winter.'], ['الدولار مقبول في أغلب الأماكن السياحية.', 'US dollars are accepted in most tourist places.']] },
  my: { city: ['كوالالمبور', 'Kuala Lumpur'], cur: ['الرينغيت الماليزي', 'Malaysian ringgit', 'MYR'], lang: ['الملايوية والإنكليزية', 'Malay and English'], plugs: 'G', temps: [32, 33, 33, 33, 33, 32, 32, 32, 32, 32, 32, 31],
    best: ['حزيران–آب أكثر الأشهر صحواً في كوالالمبور ولنكاوي، والسفر ممتع طوال العام.', 'June–August is sunniest in Kuala Lumpur and Langkawi; great all year.'],
    tips: [['الطبيعة الاستوائية خضراء طوال العام، والزخات القصيرة تلطّف الجو.', 'The tropical scenery is green all year, and short showers cool the air.'], ['تطبيق Grab للتاكسي وطلب الطعام مريح وبأسعار مناسبة.', 'The Grab app for taxis and food is easy and good value.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  mv: { city: ['ماليه', 'Malé'], cur: ['الروفية المالديفية', 'Maldivian rufiyaa', 'MVR'], lang: ['الديفيهية والإنكليزية', 'Dhivehi and English'], plugs: 'D, G', temps: [30, 31, 31, 32, 31, 31, 30, 30, 30, 30, 30, 30],
    best: ['كانون الأول–نيسان: موسم الجفاف والبحر الهادئ.', 'December–April: the dry season with calm seas.'],
    tips: [['أغلب المنتجعات تتعامل بالدولار.', 'Most resorts price in US dollars.'], ['الوصول إلى المنتجع بالقارب السريع أو الطائرة المائية تجربة رائعة بحد ذاتها.', 'Arriving at your resort by speedboat or seaplane is an experience in itself.'], ['الشعاب المرجانية مذهلة للسنوركل مباشرة من شاطئ المنتجع.', 'The coral reefs are stunning for snorkelling right off the resort beach.']] },
  id: { city: ['بالي', 'Bali'], cur: ['الروبية الإندونيسية', 'Indonesian rupiah', 'IDR'], lang: ['الإندونيسية', 'Indonesian'], plugs: 'C, F', tz: 'Asia/Makassar', temps: [31, 31, 31, 32, 31, 30, 29, 30, 31, 32, 32, 31],
    best: ['نيسان–تشرين الأول: موسم الجفاف.', 'April–October: the dry season.'],
    tips: [['تطبيقا Grab وGojek للتنقل.', 'Use Grab or Gojek to get around.'], ['أوبود مركز الفن والطبيعة وحقول الأرز الشهيرة.', 'Ubud is the home of art, nature and the famous rice terraces.'], ['غروب الشمس في معبدي تاناه لوت وأولواتو من أجمل المشاهد.', 'Sunset at Tanah Lot and Uluwatu temples is unforgettable.']] },
  th: { city: ['بانكوك', 'Bangkok'], cur: ['البات التايلندي', 'Thai baht', 'THB'], lang: ['التايلندية', 'Thai'], plugs: 'A, B, C, O', temps: [32, 33, 34, 35, 34, 33, 33, 33, 32, 32, 32, 31],
    best: ['تشرين الثاني–شباط: طقس ألطف وأيام مشمسة.', 'November–February: pleasant weather and sunny days.'],
    tips: [['تطبيق Grab للتاكسي، أو قطار BTS المعلّق في بانكوك.', 'Use Grab or the BTS Skytrain in Bangkok.'], ['تايلاند تُعرف بأرض الابتسامات، وأهلها مضيافون.', 'Thailand is known as the Land of Smiles, and its people are welcoming.'], ['بوكيت وباتايا للبحر، وبانكوك للتسوق.', 'Phuket and Pattaya for the beach; Bangkok for shopping.']] },
  sg: { city: ['سنغافورة', 'Singapore'], cur: ['الدولار السنغافوري', 'Singapore dollar', 'SGD'], lang: ['الإنكليزية والملايوية والصينية', 'English, Malay and Chinese'], plugs: 'G', temps: [30, 31, 32, 32, 32, 31, 31, 31, 31, 31, 31, 30],
    best: ['شباط–نيسان أكثر الأشهر صحواً، والسفر ممتع طوال العام.', 'February–April is sunniest; great all year.'],
    tips: [['مترو MRT سريع ونظيف ويصل إلى كل مكان.', 'The MRT metro is fast, clean and goes everywhere.'], ['سنغافورة من أنظف مدن العالم وأكثرها أماناً.', 'Singapore is one of the cleanest and safest cities in the world.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  lb: { city: ['بيروت', 'Beirut'], cur: ['الليرة اللبنانية', 'Lebanese pound', 'LBP'], lang: ['العربية', 'Arabic'], plugs: 'C, D, G', temps: [17, 17, 19, 22, 25, 28, 30, 31, 29, 27, 23, 19],
    best: ['نيسان–حزيران وأيلول–تشرين الأول، والشتاء للتزلج في الجبال.', 'April–June and September–October; winter for skiing in the mountains.'],
    tips: [['الدولار متداول على نطاق واسع إلى جانب الليرة.', 'US dollars are widely used alongside the pound.'], ['جونية وجبيل والأرز قريبة من بيروت.', 'Jounieh, Byblos and the Cedars are close to Beirut.'], ['جبال لبنان منعشة في الصيف، والساحل مثالي للبحر.', 'The mountains are refreshing in summer, and the coast is perfect for the sea.']] },
  ae: { city: ['دبي', 'Dubai'], cur: ['الدرهم الإماراتي', 'UAE dirham', 'AED'], lang: ['العربية والإنكليزية', 'Arabic and English'], plugs: 'G', temps: [24, 25, 28, 33, 38, 40, 41, 41, 39, 35, 30, 26],
    best: ['تشرين الثاني–آذار: أجمل طقس للأنشطة الخارجية.', 'November–March: the best weather for outdoor activities.'],
    tips: [['مترو دبي يصل إلى أغلب الأماكن، والدفع ببطاقة «نول».', 'The Dubai Metro reaches most places; pay with a Nol card.'], ['مراكز التسوق والأنشطة الداخلية تجعل دبي ممتعة في كل المواسم.', 'Malls and indoor attractions make Dubai fun in every season.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  jo: { city: ['عمّان', 'Amman'], cur: ['الدينار الأردني', 'Jordanian dinar', 'JOD'], lang: ['العربية', 'Arabic'], plugs: 'C, D, F, G, J', temps: [12, 14, 17, 23, 28, 31, 32, 33, 31, 27, 20, 14],
    best: ['آذار–أيار وأيلول–تشرين الثاني، والعقبة والبحر الميت دافئان في الشتاء.', 'March–May and September–November; Aqaba and the Dead Sea are warm in winter.'],
    tips: [['البتراء تستحق يوماً كاملاً، والحذاء المريح يجعل جولتك أمتع.', 'Petra deserves a full day, and comfy shoes make it even better.'], ['وادي رم تجربة صحراوية لا تُنسى، خصوصاً ليلاً تحت النجوم.', 'Wadi Rum is an unforgettable desert trip, especially at night under the stars.'], ['البحر الميت على بعد ساعة تقريباً من عمّان.', 'The Dead Sea is about an hour from Amman.']] },
  bh: { city: ['المنامة', 'Manama'], cur: ['الدينار البحريني', 'Bahraini dinar', 'BHD'], lang: ['العربية', 'Arabic'], plugs: 'G', temps: [20, 21, 25, 29, 34, 36, 37, 38, 36, 33, 28, 22],
    best: ['تشرين الثاني–آذار: طقس لطيف.', 'November–March: pleasant weather.'],
    tips: [['جسر الملك فهد يربطها بالسعودية.', 'The King Fahd Causeway links it to Saudi Arabia.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.'], ['أمسيات المنامة ومطاعمها البحرية وجهة رائعة للعائلة.', 'Manama evenings and seafood restaurants are great for families.']] },
  sa: { city: ['مكة المكرمة', 'Makkah'], cur: ['الريال السعودي', 'Saudi riyal', 'SAR'], lang: ['العربية', 'Arabic'], plugs: 'G', temps: [30, 31, 34, 38, 41, 43, 43, 42, 42, 40, 35, 31],
    best: ['تشرين الثاني–شباط أجمل الأشهر جواً، والحجز المبكر يضمن لك أفضل الخيارات في رمضان والعطل.', 'November–February has the nicest weather; booking early gets you the best options for Ramadan and holidays.'],
    tips: [['تطبيق «نسك» لتصاريح العمرة والروضة الشريفة.', 'Use the Nusuk app for Umrah and Rawdah permits.'], ['ماء زمزم متوفر في الحرم في كل الأوقات.', 'Zamzam water is available in the Haram at all times.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  cn: { city: ['غوانزو', 'Guangzhou'], cur: ['اليوان الصيني', 'Chinese yuan', 'CNY'], lang: ['الصينية', 'Chinese'], plugs: 'A, C, I', temps: [18, 19, 22, 26, 30, 32, 33, 33, 32, 29, 25, 20],
    best: ['تشرين الأول–كانون الأول، ومعرض كانتون يُقام في الربيع والخريف.', 'October–December; the Canton Fair runs in spring and autumn.'],
    tips: [['غوانزو عاصمة التسوق والجملة، وأسواقها تضم كل ما تحتاجه.', 'Guangzhou is a capital of shopping and wholesale, with markets for everything.'], ['الدفع عبر Alipay وWeChat Pay منتشر جداً.', 'Alipay and WeChat Pay are used almost everywhere.'], ['عنوان الفندق مكتوباً بالصينية يسهّل التنقل بالتاكسي.', 'Your hotel address written in Chinese makes taxi rides easy.']] },
  ma: { city: ['مراكش', 'Marrakech'], cur: ['الدرهم المغربي', 'Moroccan dirham', 'MAD'], lang: ['العربية والفرنسية', 'Arabic and French'], plugs: 'C, E', temps: [18, 20, 23, 25, 29, 33, 37, 37, 32, 28, 22, 19],
    best: ['آذار–أيار وأيلول–تشرين الثاني.', 'March–May and September–November.'],
    tips: [['أسواق المدينة القديمة مليئة بالحرف اليدوية، والمساومة جزء من متعتها.', 'The old-town souks are full of crafts, and bargaining is part of the fun.'], ['ساحة جامع الفنا في أجمل حالاتها ليلاً.', 'Jemaa el-Fnaa square comes alive at night.'], ['نهار الشتاء في مراكش مشمس ودافئ ومثالي للتجول.', 'Winter days in Marrakech are sunny, warm and perfect for exploring.']] },
  us: { city: ['نيويورك', 'New York'], cur: ['الدولار الأمريكي', 'US dollar', 'USD'], lang: ['الإنكليزية', 'English'], plugs: 'A, B', temps: [4, 5, 10, 17, 22, 27, 29, 28, 24, 18, 12, 6],
    best: ['نيسان–حزيران وأيلول–تشرين الثاني.', 'April–June and September–November.'],
    tips: [['سنترال بارك وتايمز سكوير وجسر بروكلين قريبة من بعضها بالمترو.', 'Central Park, Times Square and Brooklyn Bridge are all a short metro ride apart.'], ['مواسم التخفيضات في المتاجر الكبرى فرصة رائعة للتسوق.', 'Big store sales seasons are a great time to shop.'], ['نيويورك في كانون الأول تتزين بأضواء الأعياد وحلبات التزلج.', 'In December New York shines with holiday lights and ice rinks.']] },
  it: { city: ['روما', 'Rome'], cur: ['اليورو', 'Euro', 'EUR'], lang: ['الإيطالية', 'Italian'], plugs: 'C, F, L', temps: [12, 13, 16, 19, 23, 28, 31, 31, 27, 22, 16, 13],
    best: ['نيسان–حزيران وأيلول–تشرين الأول.', 'April–June and September–October.'],
    tips: [['الحجز المسبق لتذاكر الفاتيكان والكولوسيوم يوفّر وقتك.', 'Booking Vatican and Colosseum tickets ahead saves you time.'], ['المطبخ الإيطالي تجربة بحد ذاتها، والجيلاتو في كل زاوية.', 'Italian food is an experience in itself, with gelato on every corner.'], ['نافورة تريفي والبانثيون قريبان ويمكن زيارتهما سيراً على الأقدام.', 'The Trevi Fountain and the Pantheon are close enough to visit on foot.']] },
  gb: { city: ['لندن', 'London'], cur: ['الجنيه الإسترليني', 'Pound sterling', 'GBP'], lang: ['الإنكليزية', 'English'], plugs: 'G', temps: [8, 9, 11, 14, 18, 21, 23, 23, 20, 16, 11, 8],
    best: ['أيار–أيلول: نهار أطول وطقس ألطف.', 'May–September: longer days and milder weather.'],
    tips: [['ادفع أجور المواصلات بالبطاقة اللاتلامسية أو بطاقة Oyster.', 'Pay for transport with a contactless card or an Oyster card.'], ['متاحف لندن الكبرى مثل المتحف البريطاني دخولها مجاني.', 'Major London museums such as the British Museum are free to enter.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  ge: { city: ['تبليسي', 'Tbilisi'], cur: ['اللاري الجورجي', 'Georgian lari', 'GEL'], lang: ['الجورجية', 'Georgian'], plugs: 'C, F', temps: [6, 8, 13, 18, 24, 28, 31, 31, 26, 20, 13, 8],
    best: ['أيار–تشرين الأول للطبيعة، وكانون الأول–آذار للثلوج في غودوري.', 'May–October for nature; December–March for snow in Gudauri.'],
    tips: [['تطبيق Bolt للتاكسي.', 'Use the Bolt app for taxis.'], ['يمكن صرف الدولار إلى اللاري بسهولة.', 'US dollars are easy to change into lari.'], ['باتومي على البحر الأسود جميلة في الصيف.', 'Batumi on the Black Sea is lovely in summer.']] },
  lk: { city: ['كولومبو', 'Colombo'], cur: ['الروبية السريلانكية', 'Sri Lankan rupee', 'LKR'], lang: ['السنهالية والتاميلية', 'Sinhala and Tamil'], plugs: 'D, G, M', temps: [31, 31, 31, 31, 31, 30, 29, 29, 30, 30, 30, 30],
    best: ['كانون الأول–آذار للساحلين الغربي والجنوبي.', 'December–March for the west and south coasts.'],
    tips: [['التوك توك أسهل وسيلة للتنقل داخل المدن.', 'Tuk-tuks are the easiest way to get around town.'], ['كاندي ونوارا إليا للجبال ومزارع الشاي.', 'Kandy and Nuwara Eliya for the hills and tea estates.'], ['شواطئ الجنوب مثل بنتوتا وغالي مثالية للاسترخاء.', 'Southern beaches such as Bentota and Galle are perfect for relaxing.']] },
  fr: { city: ['باريس', 'Paris'], cur: ['اليورو', 'Euro', 'EUR'], lang: ['الفرنسية', 'French'], plugs: 'C, E', temps: [7, 8, 12, 16, 20, 23, 25, 25, 21, 16, 11, 8],
    best: ['نيسان–حزيران وأيلول–تشرين الأول.', 'April–June and September–October.'],
    tips: [['الحجز المسبق لبرج إيفل واللوفر يوفّر وقتك.', 'Booking the Eiffel Tower and the Louvre ahead saves you time.'], ['نزهة بالقارب على نهر السين من أجمل طرق رؤية باريس.', 'A boat ride on the Seine is one of the loveliest ways to see Paris.'], ['المترو أسرع وسيلة للتنقل.', 'The metro is the fastest way around.']] },
  qa: { city: ['الدوحة', 'Doha'], cur: ['الريال القطري', 'Qatari riyal', 'QAR'], lang: ['العربية', 'Arabic'], plugs: 'D, G', temps: [22, 23, 27, 32, 38, 41, 41, 41, 39, 35, 29, 24],
    best: ['تشرين الثاني–آذار.', 'November–March.'],
    tips: [['مترو الدوحة حديث ويصل إلى الأماكن الرئيسية.', 'The Doha Metro is modern and reaches the main sights.'], ['سوق واقف والكورنيش في أجمل حالاتهما ليلاً.', 'Souq Waqif and the Corniche are best at night.'], ['المقبس من نوع G مثل العراق.', 'Sockets are type G, like in Iraq.']] },
  kh: { city: ['سيم ريب', 'Siem Reap'], cur: ['الريال الكمبودي', 'Cambodian riel', 'KHR'], lang: ['الخميرية', 'Khmer'], plugs: 'A, C, G', temps: [31, 33, 34, 35, 34, 33, 32, 32, 31, 31, 31, 30],
    best: ['تشرين الثاني–آذار: موسم الجفاف.', 'November–March: the dry season.'],
    tips: [['الدولار متداول على نطاق واسع إلى جانب الريال.', 'US dollars are widely used alongside the riel.'], ['أنغكور وات تستحق يوماً أو يومين، وأجمل وقت لزيارتها الشروق.', 'Angkor Wat deserves a day or two, and sunrise is the best time to see it.'], ['الأسواق الليلية في سيم ريب مليئة بالحياة والحرف اليدوية.', 'The night markets of Siem Reap are lively and full of handicrafts.']] },
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
