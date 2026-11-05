/* Qaser Almaraya — Arabic → English runtime dictionary.
   window.QA_I18N.map: exact-string lookups.
   window.QA_I18N.t(str): lookup + numeric/duration fallbacks. */
(function () {
  var AR = '٠١٢٣٤٥٦٧٨٩';
  function west(s) { return s.replace(/[٠-٩]/g, function (d) { return String(AR.indexOf(d)); }); }
  var map = {};
  var UNITS = [
    [/^(\d+)\s*ليالٍ$/, '$1 nights'], [/^(\d+)\s*ليلة$/, '$1 night'],
    [/^(\d+)\s*يوماً$/, '$1 days'], [/^(\d+)\s*أيام عمل$/, '$1 working days'],
    [/^(\d+)\s*يوم عمل$/, '$1 working day'], [/^(\d+)\s*ساعة$/, '$1 hours'],
    [/^(\d+)\s*\$$/, '$$$1'], [/^\$\s*(\d+)$/, '$$$1'],
    [/^(\d+)\s*دولة$/, '$1 countries'],
    [/^(\d+)\s*أنواع$/, '$1 types'], [/^(\d+)\s*نوع$/, '$1 type'],
    [/^(\d+)\s*يوم$/, '$1 days'], [/^(\d+)\s*أيام$/, '$1 days'],
    [/^(\d+)\s*اشهر$/, '$1 months'], [/^(\d+)\s*أشهر$/, '$1 months'],
    [/^(\d+)\s*شهر$/, '$1 month'], [/^(\d+)\s*شهور$/, '$1 months'],
    [/^(\d+)\s*سنة$/, '$1 year'], [/^(\d+)\s*سنوات$/, '$1 years'],
    [/^يومين$/, '2 days'], [/^شهرين$/, '2 months'], [/^سنتين$/, '2 years'],
    [/^ليلتين$/, '2 nights']
  ];
  function name(ar) { return map[ar] != null ? map[ar] : ar; }
  var PATTERNS = [
    [/^(.+?) مصممة لتسهيل رحلتك من العراق — (.+?)، وصلاحية (.+?) من تاريخ الإصدار، مع مدة إقامة (.+?) داخل الدولة\. يتولى فريقنا مراجعة مستنداتك والتقديم بالكامل نيابة عنك\.$/,
      function (m) { return name(m[1]) + ' visa is designed to make your trip from Iraq easier — ' + m[2] + ', valid ' + m[3] + ' from issuance, with a stay of ' + m[4] + ' in the country. Our team handles reviewing your documents and submitting on your behalf.'; }],
    [/^الرقم المختصر (\d+)، أو الهاتف (.+?)، أو البريد (.+)$/, function (m) { return 'Short number ' + m[1] + ', phone ' + m[2] + ', or email ' + m[3]; }],
    [/^مدة الإنجاز المتوقعة: (.+?)$/, function (m) { return 'Expected processing time: ' + m[1]; }],
    [/^نوع الدخول: (.+?)$/, function (m) { return 'Entry type: ' + m[1]; }],
    [/^صلاحية التأشيرة: (.+?) من الإصدار$/, function (m) { return 'Visa validity: ' + m[1] + ' from issuance'; }],
    [/^مدة الإصدار (.+?) من تاريخ استلام المستندات كاملة\.$/, function (m) { return 'Processing time ' + m[1] + ' from the date all documents are received.'; }],
    [/^صلاحية التأشيرة (.+?) من تاريخ الإصدار\.$/, function (m) { return 'Visa validity ' + m[1] + ' from the issuance date.'; }],
    [/^تأشيرة (.+?) لمدة إقامة (.+?) يوماً$/, function (m) { return name(m[1]) + ' visa — ' + west(m[2]) + '-day stay'; }],
    [/^تأشيرة (.+?) \+ اعتماد أمني$/, function (m) { return name(m[1]) + ' visa + security approval'; }],
    [/^جواز عراقي، تحتاج تأشيرة لدخول (.+?)\.$/, function (m) { return 'Iraqi passport — you need a visa to enter ' + name(m[1]) + '.'; }],
    [/^جواز عراقي، تحتاج تأشيرة لـ (.+?)\.$/, function (m) { return 'Iraqi passport — you need a visa for ' + name(m[1]) + '.'; }],
    [/^(.+?) Wild Visa$/, function (m) { return name(m[1]) + ' Wild Visa'; }],
    [/^(.+?) نتيجة تأشيرة لـ (.+?)$/, function (m) { return west(m[1]) + ' visa result(s) for ' + name(m[2]); }],
    [/^تأشيرة (.+?)$/, function (m) { return name(m[1]) + ' visa'; }]
  ];
  function t(raw) {
    if (raw == null) return raw;
    var s = String(raw), k = s.trim();
    if (!k) return s;
    if (map[k] != null) return s.replace(k, map[k]);
    var w = west(k);
    if (map[w] != null) return s.replace(k, map[w]);
    for (var i = 0; i < UNITS.length; i++) {
      var m = w.match(UNITS[i][0]);
      if (m) return s.replace(k, w.replace(UNITS[i][0], UNITS[i][1]));
    }
    for (var j = 0; j < PATTERNS.length; j++) {
      var pm = k.match(PATTERNS[j][0]);
      if (pm) return s.replace(k, PATTERNS[j][1](pm));
    }
    if (/^[\d\s.,:%+\-\/()$]+$/.test(w)) return s.replace(k, w); // pure numerals
    return s;
  }
  var short = { 'الأسئلة الشائعة': 'FAQ', 'الطيران والفنادق': 'Flights', 'الوظائف': 'Careers', 'الرئيسية': 'Home', 'تواصل معنا': 'Contact' };
  var pend = window.QA_I18N_PENDING || []; window.QA_I18N_PENDING = [];
  var prev = window.QA_I18N && window.QA_I18N.map; if (prev) { for (var pk in prev) map[pk] = prev[pk]; }
  pend.forEach(function (o) { for (var k in o) map[k] = o[k]; });
  // Strings that had no English yet (5 Nov 2026): footer slogan, package
  // card button, visa search labels and FAQ answers saved in the dashboard.
  var EXTRA = {
    'رحلتك تبدأ وياّنا': 'Your journey starts with us',
    'تفاصيل الباقة': 'Package details',
    'الجنسية': 'Nationality',
    'اختر جنسية': 'Choose nationality',
    'تاريخ السفر': 'Travel date',
    'الحجز المباشر يتم عبر شريكنا Flamingo على Flamingo.iq، وفريقنا يتابع طلبك خطوة بخطوة حتى إصدار التذكرة. يمكنك أيضًا الاتصال بالرقم المختصر 6393 وسنكمل الحجز عنك.': 'You can book directly through our partner Flamingo at Flamingo.iq, and our team follows your request step by step until the ticket is issued. You can also call our short number 6393 and we will complete the booking for you.',
    'التحويل على حساب الشركة، أو الدفع عبر Zain Cash، أو نقدًا في مكتبنا.': 'Bank transfer to the company account, payment via Zain Cash, or cash at our office.',
    'يتواصل معك أحد موظفينا لتأكيد التفاصيل، ويبقى معك على القناة التي تفضّلها حتى انتهاء الرحلة.': 'One of our staff contacts you to confirm the details and stays with you on the channel you prefer until the end of your trip.',
    'نعم، نعمل مع المسافرين من داخل العراق وخارجه.': 'Yes, we work with travellers both inside and outside Iraq.'
  };
  for (var ek in EXTRA) if (map[ek] == null) map[ek] = EXTRA[ek];

  window.QA_I18N = { map: map, short: short, ts: function (raw) { var k = String(raw == null ? '' : raw).trim(); return short[k] != null ? String(raw).replace(k, short[k]) : t(raw); }, t: t, west: west, add: function (o) { for (var k in o) { map[k] = o[k]; var w = west(k); if (map[w] == null) map[w] = o[k]; } } };
})();
