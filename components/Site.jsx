'use client';
import { APPLY_FLOW_ENABLED, WHATSAPP_NUMBER, openWhatsApp, visaMessage, waLink } from '../lib/whatsapp';
import { WA_ICON } from './WhatsAppButton';
import HomeHero from './HomeHero';
import HomeOffers from './HomeOffers';
import BookingPanel from './home/BookingPanel';
import HomeDestinations from './home/HomeDestinations';
import HomeServices from './home/HomeServices';
import HomeWhy from './home/HomeWhy';
import HomeVoices from './home/HomeVoices';
import HomeContact from './home/HomeContact';
import HomeInstagram from './home/HomeInstagram';
import OfferStories from './home/OfferStories';
import DeparturesBoard from './home/DeparturesBoard';
import SeasonSpotlight from './SeasonSpotlight';
import SeasonDecor from './SeasonDecor';
import TripFinder from './TripFinder';
import VisaChecker from './VisaChecker';
import PartnersWall from './PartnersWall';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { GoalServices, GoalTrust, GoalExpansion, GoalTech, GoalHeritage, GoalSafety } from './GoalIcons';
import { getStoredLang, i18nReady, onI18nReady, initialLang, applyLangToDOM } from '../lib/i18n';
import MascotLoader from './MascotLoader';
import PackageCard from './PackageCard';
import PaymentMethods from './PaymentMethods';
import PaymentBadges from './PaymentBadges';


const COUNTRIES_DEFAULT=[
 {code:'tr',name:'تركيا',en:'Turkey',region:'تركيا والقوقاز'},
 {code:'jo',name:'الأردن',en:'Jordan',region:'الشرق الأوسط وأفريقيا'},
 {code:'ae',name:'الإمارات',en:'UAE',region:'الشرق الأوسط وأفريقيا'},
 {code:'us',name:'أمريكا',en:'United States',region:'الأمريكتان'},
 {code:'ge',name:'جورجيا',en:'Georgia',region:'تركيا والقوقاز'},
 {code:'az',name:'أذربيجان',en:'Azerbaijan',region:'تركيا والقوقاز'},
 {code:'eg',name:'مصر',en:'Egypt',region:'الشرق الأوسط وأفريقيا'},
 {code:'th',name:'تايلاند',en:'Thailand',region:'آسيا'},
 {code:'am',name:'أرمينيا',en:'Armenia',region:'تركيا والقوقاز'}];
const REGIONS=['الشرق الأوسط وأفريقيا','تركيا والقوقاز','آسيا','أوروبا','الأمريكتان'];
/* BRD §4 — visa types are tick boxes, not products */
const VISA_TYPES=[
 {id:'electronic',name:'تأشيرة إلكترونية',en:'Electronic visa',filter:'إلكترونية',appointment:false,deliversFile:true,takesPassport:false,preparesPapers:false,guaranteed:true},
 {id:'normal',name:'تأشيرة عادية',en:'Normal visa',filter:'عادية',appointment:false,deliversFile:true,takesPassport:true,preparesPapers:false,guaranteed:true},
 {id:'embassy',name:'تأشيرة سفارة',en:'Embassy visa',filter:'سفارة',appointment:true,deliversFile:false,takesPassport:true,preparesPapers:true,guaranteed:false},
 {id:'appointment',name:'موعد سفارة',en:'Embassy appointment',filter:'موعد',appointment:true,deliversFile:false,takesPassport:true,preparesPapers:true,guaranteed:false}];
const TYPE_TICKS=[
 {key:'appointment',label:'نحجز لك موعداً في السفارة',icon:'calendar-check'},
 {key:'deliversFile',label:'تستلم ملف التأشيرة للتحميل',icon:'file-text'},
 {key:'takesPassport',label:'نستلم جوازك ونعيده لاحقاً',icon:'stamp'},
 {key:'preparesPapers',label:'نجهّز الأوراق: الاستمارة والحجوزات والتأمين والترجمة',icon:'handshake'},
 {key:'guaranteed',label:'النتيجة مضمونة',icon:'check'}];
/* BRD §5 — document builder lines: kind, required, who, showIf */
const D=(id,ar,en,kind,o)=>Object.assign({id,ar,en,kind,required:true,who:'all'},o||{});
const L_PASS=D('passport','جواز سفر صالح لأكثر من 6 أشهر','Passport valid for more than 6 months','file');
const L_PHOTO=D('photo','صورة شخصية حديثة','Recent personal photo','photo',{rules:'خلفية بيضاء، بدون نظارات، حجم 4×6',rulesEn:'White background, no glasses, 4×6'});
const L_EXPIRY=D('expiry','تاريخ انتهاء الجواز','Passport expiry date','date');
const L_JOB=D('job','اسم جهة العمل','Employer name','text',{who:'adult'});
const L_MARITAL=D('marital','الحالة الاجتماعية','Marital status','choice',{who:'adult',options:['أعزب','متزوج'],optionsEn:['Single','Married']});
const L_MARRIAGE=D('marriage','عقد الزواج','Marriage contract','file',{who:'adult',showIf:{line:'marital',equals:'متزوج'}});
const L_REFUSED=D('refused','هل سبق أن رُفضت لك تأشيرة؟','Have you had a visa refusal before?','yesno',{who:'adult'});
const L_REFUSAL=D('refusal','تفاصيل الرفض السابق','Details of the previous refusal','text',{who:'adult',showIf:{line:'refused',equals:'yes'}});
const L_SALARY=D('salary','تأييد عمل يُذكر فيه مقدار الراتب','Employment letter stating the salary','file',{who:'adult'});
const L_SALARYNUM=D('salaryNum','الراتب الشهري (د.ع)','Monthly salary (IQD)','number',{who:'adult',required:false});
const L_BANK=D('bank','كشف حساب بنكي لآخر 3 أشهر','Bank statement, last 3 months','file',{who:'adult'});
const L_VISITED=D('visited','الدول التي زرتها في آخر 5 سنوات','Countries visited in the last 5 years','repeat',{who:'adult',required:false});
const L_BIRTH=D('birth','شهادة ولادة الطفل','Child birth certificate','file',{who:'child'});
const L_CONSENT=D('consent','موافقة ولي الأمر للطفل','Parental consent for the child','file',{who:'child'});
const L_HOTEL=D('hotel','حجز فندقي','Hotel reservation','file',{required:false});
const L_TICKET=D('ticket','تذكرة عودة مؤكدة','Confirmed return ticket','file');
const L_PREVJO=D('prevjo','هل زرت الأردن سابقاً؟','Have you visited Jordan before?','yesno',{who:'adult'});
const L_PREVJODATE=D('prevjodate','تاريخ آخر زيارة','Date of last visit','date',{who:'adult',showIf:{line:'prevjo',equals:'yes'}});
const L_DS160=D('ds160','صفحة تأكيد استمارة DS-160','DS-160 confirmation page','file',{rules:'نعبّئها معك — أو ارفع التأكيد إن كانت لديك',rulesEn:'We fill it with you — or upload the confirmation if you have it'});
const L_USPHOTO=D('usphoto','صورة شخصية بمقاييس السفارة الأمريكية','Photo to US embassy specifications','photo',{rules:'5×5 سم، خلفية بيضاء، خلال آخر 6 أشهر',rulesEn:'5×5 cm, white background, taken in the last 6 months'});
const L_PURPOSE=D('purpose','الغرض من الزيارة','Purpose of the visit','choice',{options:['سياحة','زيارة عائلية','عمل','علاج','دراسة'],optionsEn:['Tourism','Family visit','Business','Medical','Study']});
const L_INVITE=D('invite','رسالة دعوة من المضيف','Invitation letter from the host','file',{required:false,showIf:{line:'purpose',equals:'زيارة عائلية'}});
const L_USPREV=D('usprev','هل حصلت على تأشيرة أمريكية سابقاً؟','Have you had a US visa before?','yesno',{who:'adult'});
const L_USPREVFILE=D('usprevfile','نسخة التأشيرة الأمريكية السابقة','Copy of the previous US visa','file',{who:'adult',showIf:{line:'usprev',equals:'yes'}});
const L_TRAVEL=D('travel','رحلاتك خارج العراق في آخر 5 سنوات','Trips outside Iraq in the last 5 years','repeat',{who:'adult'});
const L_PROPERTY=D('property','سند ملكية أو عقد إيجار','Property deed or rental contract','file',{who:'adult',required:false});
const E_DOCS=[L_PASS,L_PHOTO,L_EXPIRY,L_REFUSED,L_REFUSAL,L_BIRTH];
const N_DOCS=[L_PASS,L_PHOTO,L_EXPIRY,L_JOB,L_MARITAL,L_MARRIAGE,L_REFUSED,L_REFUSAL,L_BANK,L_BIRTH];
const EMB_DOCS=[L_PASS,L_PHOTO,L_EXPIRY,L_JOB,L_SALARY,L_SALARYNUM,L_MARITAL,L_MARRIAGE,L_BANK,L_REFUSED,L_REFUSAL,L_VISITED,L_BIRTH,L_CONSENT];
const JO_DOCS=[L_PASS,L_PHOTO,L_EXPIRY,L_JOB,L_TICKET,L_HOTEL,L_PREVJO,L_PREVJODATE,L_REFUSED,L_REFUSAL,L_BIRTH];
const US_DOCS=[L_PASS,L_USPHOTO,L_EXPIRY,L_DS160,L_PURPOSE,L_INVITE,L_JOB,L_SALARY,L_BANK,L_PROPERTY,L_MARITAL,L_MARRIAGE,L_USPREV,L_USPREVFILE,L_REFUSED,L_REFUSAL,L_TRAVEL,L_BIRTH,L_CONSENT];
/* BRD §3 — one visa card per country × type. Prices in IQD. Provider & costs live in the dashboard, never here. */
const REFUND_STD='قبل الإرسال إلى الجهة المصدرة: استرداد كامل. بعد الإرسال: يُخصم ما دُفع للجهة المصدرة ورسوم الخدمة.';
const REFUND_STD_EN='Before sending to the provider: full refund. After sending: provider fee and service fee are deducted.';
const REFUND_NONE='الرسوم غير قابلة للاسترداد بعد الإرسال إلى الجهة المصدرة، سواء صدرت التأشيرة أم رُفضت.';
const REFUND_NONE_EN='Fees are non-refundable after sending to the provider, whether the visa is issued or refused.';
const V=(id,country,type,o)=>Object.assign({id,country,type,refund:REFUND_STD,refundEn:REFUND_STD_EN},o);
const VISAS_DEFAULT=[
 V('tr-e','tr','electronic',{stay:'30 يوماً',issuing:'3 أيام عمل',validity:'180 يوماً',adult:95000,child:50000,docs:E_DOCS,notes:'التأشيرة الإلكترونية تصل على بريدك، ولا تحتاج زيارة السفارة. الدخول متعدد.',notesEn:'The e-visa arrives by email — no embassy visit needed. Multiple entry.'}),
 V('tr-n','tr','normal',{stay:'30 يوماً',issuing:'10 أيام عمل',validity:'90 يوماً',adult:180000,child:95000,docs:N_DOCS,notes:'تأشيرة ملصقة على الجواز. نستلم جوازك ونعيده مع التأشيرة.',notesEn:'Sticker visa on the passport. We collect your passport and return it with the visa.'}),
 V('jo-e','jo','electronic',{stay:'30 يوماً',issuing:'5 أيام عمل',validity:'90 يوماً',adult:120000,child:60000,docs:JO_DOCS,notes:'تأشيرة إلكترونية تصلك على بريدك، دخول مفرد.',notesEn:'E-visa delivered by email, single entry.'}),
 V('jo-1','jo','normal',{tier:'الأسرع',tierEn:'Fastest',stay:'30 يوماً',issuing:'24 ساعة',validity:'90 يوماً',adult:260000,child:130000,docs:JO_DOCS,notes:'المسار الأسرع — يُقدَّم الملف في نفس اليوم ويصدر خلال 24 ساعة. يلزم اكتمال المستندات قبل الساعة 11 صباحاً.',notesEn:'Fastest track — filed the same day, issued within 24 hours. Documents must be complete before 11 AM.'}),
 V('jo-2','jo','normal',{tier:'سريعة',tierEn:'Fast',stay:'30 يوماً',issuing:'3 أيام عمل',validity:'90 يوماً',adult:190000,child:95000,docs:JO_DOCS,notes:'المسار السريع — إصدار خلال 3 أيام عمل.',notesEn:'Fast track — issued within 3 working days.'}),
 V('jo-3','jo','normal',{tier:'بطيئة',tierEn:'Slow',stay:'30 يوماً',issuing:'7 أيام عمل',validity:'90 يوماً',adult:140000,child:70000,docs:JO_DOCS,notes:'المسار الاعتيادي — إصدار خلال أسبوع عمل.',notesEn:'Regular track — issued within one working week.'}),
 V('jo-4','jo','normal',{tier:'بطيئة جداً',tierEn:'Very slow',stay:'30 يوماً',issuing:'15 يوم عمل',validity:'90 يوماً',adult:105000,child:55000,docs:JO_DOCS,notes:'المسار الاقتصادي — للمسافر الذي لا يستعجل. إصدار خلال 15 يوم عمل.',notesEn:'Economy track — for travellers in no hurry. Issued within 15 working days.'}),
 V('ae-e','ae','electronic',{stay:'30 يوماً',issuing:'48 ساعة',validity:'60 يوماً',adult:160000,child:90000,docs:[L_PASS,L_PHOTO,L_EXPIRY,L_TICKET,L_REFUSED,L_REFUSAL,L_BIRTH],notes:'إمكانية التمديد داخل الدولة لمدة 30 يوماً إضافية.',notesEn:'Can be extended inside the country for an extra 30 days.'}),
 V('us-a','us','appointment',{stay:'تحدده السفارة',stayEn:'Set by the embassy',issuing:'3 – 6 أشهر للموعد',issuingEn:'3 – 6 months to the appointment',validity:'حسب قرار السفارة',validityEn:'Per the embassy decision',adult:450000,child:300000,docs:US_DOCS,refund:REFUND_NONE,refundEn:REFUND_NONE_EN,notes:'نحن لا نصدر تأشيرة أمريكا. نجهّز ملفك بالكامل (استمارة DS-160، الحجوزات، الترجمة) ونحجز لك موعد المقابلة. حضورك الشخصي في السفارة إلزامي، وتُدفع رسوم السفارة (MRV) بشكل منفصل. القرار النهائي للسفارة وحدها.',notesEn:'We do not issue a US visa. We prepare your full file (DS-160, reservations, translation) and book your interview appointment. Attending the embassy in person is mandatory, and the embassy MRV fee is paid separately. The final decision is the embassy’s alone.'}),
 V('ge-e','ge','electronic',{stay:'30 يوماً',issuing:'5 أيام عمل',validity:'90 يوماً',adult:110000,child:60000,docs:[L_PASS,L_PHOTO,L_EXPIRY,L_HOTEL,L_BANK,L_REFUSED,L_REFUSAL,L_BIRTH],notes:'تصدر عن وزارة الخارجية الجورجية إلكترونياً. دخول مفرد.',notesEn:'Issued electronically by the Georgian MFA. Single entry.'}),
 V('az-e','az','electronic',{stay:'30 يوماً',issuing:'3 أيام عمل',validity:'90 يوماً',adult:90000,child:45000,docs:E_DOCS,notes:'تأشيرة ASAN الإلكترونية، دخول لمرة واحدة.',notesEn:'ASAN e-visa, single entry.'}),
 V('eg-s','eg','embassy',{stay:'30 يوماً',issuing:'7 أيام عمل',validity:'90 يوماً',adult:80000,child:45000,docs:EMB_DOCS,refund:REFUND_NONE,refundEn:REFUND_NONE_EN,notes:'تُقدَّم عبر السفارة في بغداد. نحجز الموعد ونجهّز الملف، ونستلم الجواز.',notesEn:'Filed through the embassy in Baghdad. We book the appointment, prepare the file and collect the passport.'}),
 V('th-s','th','embassy',{stay:'60 يوماً',issuing:'7 أيام عمل',validity:'90 يوماً',adult:140000,child:75000,docs:EMB_DOCS,refund:REFUND_NONE,refundEn:REFUND_NONE_EN,notes:'تُقدَّم عبر السفارة في عمّان. نستلم الجواز ونعيده مع التأشيرة.',notesEn:'Filed through the embassy in Amman. We collect the passport and return it with the visa.'}),
 V('am-e','am','electronic',{stay:'21 يوماً',issuing:'4 أيام عمل',validity:'120 يوماً',adult:75000,child:40000,docs:[L_PASS,L_PHOTO,L_EXPIRY,L_HOTEL,L_REFUSED,L_REFUSAL,L_BIRTH],notes:'خيار مناسب للرحلات القصيرة والعطل الأسبوعية. دخول متعدد.',notesEn:'A good fit for short trips and weekends. Multiple entry.'})];
/* BRD §8 — the eight steps */
const FLOW=[
 {role:'customer',title:'تختار التأشيرة',hint:'ترى السعر والمدة وقائمة المستندات'},
 {role:'customer',title:'تعبّئ وترفع',hint:'فقط ما طلبناه منك — لا أكثر'},
 {role:'customer',title:'تدفع',hint:'بالبطاقة أو المحفظة أو نقداً في المكتب'},
 {role:'system',title:'يُرسَل إلى الجهة المصدرة',hint:'تلقائياً بعد الدفع واكتمال المستندات'},
 {role:'team',title:'نتابع ملفك',hint:'نجهّز الملف ونحدّث الحالة'},
 {role:'system',title:'يراقب الوقت',hint:'أي تأخير يصل لفريقنا فوراً'},
 {role:'team',title:'نرفع التأشيرة',hint:'أو تأكيد موعد السفارة'},
 {role:'customer',title:'تحمّلها',hint:'تصبح الحالة: جاهزة للتحميل'}];
/* BRD §8 — the same eight steps read as four stages. Grouping only:
   the order, the payment sequence, the roles and the conditions are untouched. */
const STAGES=[
 {title:'تختار التأشيرة',titleIsStage:true,steps:[{i:0}]},
 {title:'ترفع المستندات وتدفع',steps:[{i:1},{i:2}],
  note:'الدفع يسبق الإرسال: لا يُرسَل الملف إلى الجهة المصدرة قبل إتمام الدفع واكتمال المستندات.'},
 {title:'نتابع الطلب',steps:[{i:3},{i:4},{i:5}]},
 {title:'تستلم النتيجة',steps:[{i:6,outcomes:[{lead:'إمّا',text:'تأشيرة صادرة'},{lead:'أو',text:'تأكيد موعد سفارة'}]},{i:7}]}];

const PACKAGES=[
 {title:'إستانبول للعائلة',destination:'إستانبول',nights:'6 ليالٍ',groupType:'عائلي',departs:'كل خميس',price:'740 $',badge:'الأكثر طلباً',includes:['طيران ذهاب وعودة','إقامة 4 نجوم مع إفطار','جولة البوسفور','مرشد يتحدث العربية']},
 {title:'جورجيا الخضراء',destination:'تبليسي وباتومي',nights:'7 ليالٍ',groupType:'شبابي',departs:'كل سبت',price:'890 $',includes:['طيران ذهاب وعودة','إقامة في وسط المدينة','جولات يومية','تنقلات المطار']},
 {title:'دبي في نهاية الأسبوع',destination:'دبي',nights:'3 ليالٍ',groupType:'رجال أعمال',departs:'كل أربعاء',price:'590 $',includes:['طيران ذهاب وعودة','فندق 5 نجوم','تأشيرة زيارة','خدمة استقبال خاصة']},
 {title:'عمرة رمضان',destination:'مكة والمدينة',nights:'10 ليالٍ',groupType:'حج وعمرة',departs:'مواعيد محددة',price:'1250 $',badge:'مقاعد محدودة',includes:['طيران ذهاب وعودة','إقامة قريبة من الحرم','تنقلات بالباص','مشرف ديني']},
 {title:'ماليزيا وسنغافورة',destination:'كوالالمبور',nights:'9 ليالٍ',groupType:'عائلي',departs:'كل اثنين',price:'1390 $',includes:['طيران داخلي','إقامة 4 نجوم','جولات المدينتين','تذاكر الحدائق']},
 {title:'أذربيجان الشتوية',destination:'باكو',nights:'5 ليالٍ',groupType:'شبابي',departs:'كل جمعة',price:'640 $',includes:['طيران ذهاب وعودة','إقامة وسط باكو','جولة قوبوستان','تنقلات المطار']}];

const ACHIEVEMENTS=[
 {id:'forum',title:'ملتقى شركات السفر و السياحة',short:'ملتقى شركات السفر و السياحة',year:'2025',stamp:'بغداد',place:'معرض بغداد الدولي',photo:'ach-forum-baghdad.webp',
  body:['تفخر شركة قصر المرايا للسفر والسياحة بمشاركتها في ملتقى شركات السفر والسياحة ضمن فعاليات معرض بغداد الدولي، حيث نسعى إلى تعزيز شراكاتنا مع كبرى الشركات السياحية وتقديم أحدث العروض والخدمات لعملائنا الكرام.',
   'تمثل هذه المشاركة فرصة مثالية للتواصل مع رؤاد قطاع السياحة والسفر، وعرض خدماتنا المتميزة التي تشمل حجوزات الطيران، الإقامات الفندقية، استخراج التأشيرات، وتنظيم الجولات السياحية بأفضل الأسعار.']},
 {id:'fitur',title:'معرض فيتور للسفر والسياحة',short:'معرض فيتور — مدريد',year:'2025',stamp:'مدريد',place:'FITUR · مدريد، إسبانيا',photo:'ach-fitur-madrid.webp',
  body:['تشارك قصر المرايا للسفر والسياحة في معرض فيتور 2025، أحد أكبر وأهم المعارض العالمية في مجال السياحة والسفر، والذي يُقام سنويًا في مدريد، إسبانيا. تأتي هذه المشاركة ضمن جهودنا لتعزيز وجودنا في الأسواق الدولية، وبناء شراكات استراتيجية مع كبرى الشركات السياحية العالمية.',
   'من خلال جناحنا في المعرض، نقدم أحدث العروض السياحية، وبرامج السفر الفريدة، وخدمات متكاملة تشمل حجوزات الطيران، التأشيرات، وتنظيم الرحلات السياحية. كما نسعى إلى تسليط الضوء على العراق كوجهة سياحية غنية بالتراث والثقافة.']},
 {id:'turkish',title:'تكريمنا من الخطوط التركية',short:'تكريم الخطوط التركية',year:'2023',stamp:'تكريم',place:'مكتب قصر المرايا — بغداد',photo:'ach-turkish-airlines.webp',
  body:['تفخر شركة قصر المرايا للسفر والسياحة بحصولها على شهادة تقدير مرموقة من الخطوط الجوية التركية، تقديرًا لمساهمتها البارزة في تعزيز قطاع السفر والسياحة خلال عام 2023.',
   'هذا التكريم هو شهادة على احترافية فريقنا، الذي يعمل بلا كلل لضمان أعلى مستويات الجودة والخدمة في كل رحلة، مما يجعل قصر المرايا الوجهة الموثوقة لعشاق السفر والسياحة.']},
 {id:'salam',title:'تكريمنا من طيران السلام',short:'تكريم طيران السلام',year:'2024',stamp:'تكريم',place:'مكتب قصر المرايا — بغداد',photo:'ach-salam-air.webp',
  body:['يسر شركة قصر المرايا للسفر والسياحة أن تتلقى تكريمًا مميزًا من طيران السلام العماني تقديرًا لمساهمتها البارزة في دعم قطاع السفر وتعزيز تجربة العملاء.',
   'نحن فخورون بهذا التقدير ونتطلع إلى استمرار التعاون المثمر مع طيران السلام، وتقديم المزيد من الخدمات المتميزة التي تلبي تطلعات عملائنا في جميع أنحاء العالم.']},
 {id:'fans',title:'تفويج مشجعي منتخبنا الوطني',short:'تفويج مشجعي المنتخب',year:'2024',stamp:'تفويج',place:'انطلاق الأفواج — البصرة',photo:'ach-national-team.webp',
  body:['تفخر شركة قصر المرايا للسفر والسياحة بدورها في دعم الرياضة العراقية وجماهيرها العريقة، وذلك من خلال تنظيم رحلات خاصة لنقل مشجعي منتخبنا الوطني إلى مختلف البطولات والمباريات.',
   'نواصل التزامنا بدعم رياضتنا ومشجعينا، وسنبقى دائمًا شريككم في كل رحلة انتصار، لنرسم معًا لحظات الفخر ونصنع التاريخ بوقوفنا خلف منتخبنا العظيم!']}];

const NAV=[{id:'home',label:'الرئيسية'},{id:'flights',label:'الطيران والفنادق'},{id:'packages',label:'المجموعات والباقات'},{id:'visas',label:'التأشيرات'},{id:'guide',label:'دليل الوجهات'},{id:'jobs',label:'الوظائف'},{id:'faq',label:'الأسئلة الشائعة'},{id:'contact',label:'تواصل معنا'}];
const GROUPS=['الكل','عائلي','شبابي','رجال أعمال','حج وعمرة'];

export default function Site(props) {
  props = props || {};
  const router = useRouter();
  const [qaMobileMenuOpen, setQaMobileMenuOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = qaMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [qaMobileMenuOpen]);
  const ROUTE_MAP = { home: '/', packages: '/packages', flights: '/flights', visas: '/visa', guide: '/guide', jobs: '/jobs', faq: '/faq', contact: '/contact' };
  const [odooJobsData, setOdooJobsData] = useState(null);
  const contentJobs = (odooJobsData && odooJobsData.jobs && odooJobsData.jobs.length ? odooJobsData.jobs : null) || (props.content && props.content.jobs) || null;
  const contentFaq = (props.content && props.content.faq) || null;
  const contentContact = (props.content && props.content.contact) || null;
  const hasLegacyData = !!(
    props.content &&
    props.content.legacyCountries && props.content.legacyCountries.length &&
    props.content.legacyVisas && props.content.legacyVisas.length
  );
  // Only ever use the real admin-configured data once BOTH countries and visas
  // exist together — using one real list with the other still on defaults
  // causes lookups for a country with no matching visas (and vice versa).
  const legacyVisasRaw = hasLegacyData ? props.content.legacyVisas : VISAS_DEFAULT;
  const legacyCountriesRaw = hasLegacyData ? props.content.legacyCountries : COUNTRIES_DEFAULT;
  // Further guard: drop any country that ends up with zero visas (e.g. a
  // country added in the admin dashboard with no active visa card yet), so
  // the search widget never lands on a country it can't find a visa for.
  const filteredCountriesList = hasLegacyData
    ? legacyCountriesRaw.filter((c) => legacyVisasRaw.some((v) => v.country === c.code))
    : legacyCountriesRaw;
  const COUNTRIES = filteredCountriesList.length ? filteredCountriesList : COUNTRIES_DEFAULT;
  const VISAS = filteredCountriesList.length ? legacyVisasRaw : VISAS_DEFAULT;
  const DEFAULT_ACTIVE_COUNTRY = (COUNTRIES[0] && COUNTRIES[0].code) || 'tr';
  const [st, setSt] = useState(() => ({ lang: initialLang(), page: props.initialPage || 'home', active: DEFAULT_ACTIVE_COUNTRY, group: 'الكل', achievement: 'forum', pkg: '', loading: false, toast: '',
    travellers: 1, children: 0, tripDate: '', visaType: 'الكل', resultKind: 'الكل', visaDetailOpen: false, searched: false, visaId: '', appStage: 'form', ask: false, app: null, appError: '', appNo: '',
    countryPanelOpen: false, countryQuery: '',
    trackOpen: false, trackInput: '', trackQuery: '', trackSending: false, trackError: '', trackData: null,
    apply: null, applySent: false, applyError: '', applySending: false,
    af: { name: '', phone: '', email: '', bring: '' },
    files: { cv: '', cover: '', work: '' },
    fileUrls: { cv: '', cover: '', work: '' },
    fileUploading: { cv: false, cover: false, work: false },
    contact: { name: '', phone: '', email: '', company: '', subject: props.contactSubject || 'حجز طيران', message: '' },
    contactSending: false, contactSent: false, contactError: '' }));
  const patch = (o) => setSt((s) => (typeof o === 'function' ? { ...s, ...o(s) } : { ...s, ...o }));

  // Keep language in sync with the shared preference used by every other
  // page on the site (including the standalone /visa pages), so switching
  // language on one page stays consistent when navigating to another.
  // Jobs published in Odoo Recruitment (merged with dashboard jobs on the server)
  useEffect(() => {
    if (st.page !== 'jobs' || odooJobsData) return;
    fetch('/api/jobs').then((r) => r.json()).then((d) => setOdooJobsData(d && Array.isArray(d.jobs) ? d : { jobs: [] })).catch(() => setOdooJobsData({ jobs: [] }));
  }, [st.page]); // eslint-disable-line react-hooks/exhaustive-deps

  // ?topic=package (from "Request a custom package") pre-selects the contact
  // subject. Read in the browser so the contact page itself can stay cached.
  useEffect(() => {
    if (st.page !== 'contact') return;
    try {
      const TOPICS = { package: 'باقة أو جولة', visa: 'تأشيرة', hotel: 'حجز فندق', flight: 'حجز طيران' };
      const topic = new URLSearchParams(window.location.search).get('topic');
      if (topic && TOPICS[topic]) patch((s) => ({ contact: { ...s.contact, subject: TOPICS[topic] } }));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.page]);

  useEffect(() => {
    const stored = getStoredLang();
    if (stored !== st.lang) patch({ lang: stored });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onExternalLangChange(e) {
      const next = e?.detail;
      if ((next === 'ar' || next === 'en') && next !== st.lang) patch({ lang: next });
    }
    window.addEventListener('qa-lang-change', onExternalLangChange);
    return () => window.removeEventListener('qa-lang-change', onExternalLangChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.lang]);

  const goRef = useRef(null);
  const go = (page) => {
    if (page === st.page) return;
    patch({ loading: true });
    clearTimeout(goRef.current);
    goRef.current = setTimeout(() => {
      setSt((s) => ({ ...s, page, loading: false }));
      window.scrollTo(0, 0);
    }, 900);
  };
  useEffect(() => () => clearTimeout(goRef.current), []);

  // Arabic -> English runtime swap (public/qa-i18n*.js provide window.QA_I18N)
  const busy = useRef(false);
  // The dictionaries load deferred; re-render once they arrive so the
  // English swap (and the visa dictionary below) can run.
  const [, setI18nTick] = useState(0);
  useEffect(() => onI18nReady(() => setI18nTick((x) => x + 1)), []);
  // Same DOM swap as every other page (lib/i18n applyLangToDOM), sharing one
  // map of the original Arabic text so switching back always restores it.
  const applyLang = () => {
    busy.current = true;
    applyLangToDOM(st.lang);
    busy.current = false;
  };

  useEffect(() => {
    applyLang();
    const obs = new MutationObserver(() => {
      if (st.lang !== 'en' || busy.current) return;
      if (obs._raf) return;
      obs._raf = requestAnimationFrame(() => { obs._raf = 0; applyLang(); }); // before the next paint
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { obs.disconnect(); cancelAnimationFrame(obs._raf); };
  });

  const dictRef = useRef(false);
  const toastRef = useRef(null);

function   toWest(str){ return String(str || '').replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))); }

function   toArabic(n){ return String(n); } // site-wide Western digits

function   feeValue(fee){ const m = toWest(fee).match(/\d+/); return m ? +m[0] : 0; }

function   buildCalendar(departsLabel){
    const dowMap = { 'كل سبت': 6, 'كل خميس': 4, 'كل جمعة': 5, 'كل اثنين': 1, 'كل أربعاء': 3, 'مواعيد محددة': -1 };
    const targetDow = dowMap[departsLabel] ?? -1;
    const now = new Date(); const year = now.getFullYear(), month = now.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push({ n: '', w: 400, bg: 'transparent', ink: 'transparent' });
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      const on = targetDow >= 0 ? dow === targetDow : d % 6 === 0;
      cells.push({ n: toArabic(d), w: on ? 700 : 400, bg: on ? '#049dc5' : 'transparent', ink: on ? '#fff' : '#3d4650' });
    }
    return {
      label: first.toLocaleDateString('ar-u-nu-latn', { month: 'long', year: 'numeric' }),
      dow: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
      cells
    };
  }

function   flash(msg){
    patch({ toast: msg });
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => patch({ toast: '' }), 2400);
  }

function   copy(text, msg){
    const done = () => flash(msg);
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }

function   fallbackCopy(text, done){
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly','');
    ta.style.cssText = 'position:fixed;top:-1000px';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e){}
    document.body.removeChild(ta); done();
  }

function   pkgText(p){
    return [p.title + ' — ' + p.destination,
      'المدة: ' + p.nights,
      'المجموعة: ' + p.groupType,
      'الانطلاق: ' + p.departs,
      'السعر: ' + p.price,
      '',
      'تشمل الباقة:',
      ...(p.includes || []).map(i => '• ' + i),
      '',
      'قصر المرايا للسفر والسياحة — 6393 — sales@almarayagroup.com'
    ].join('\n');
  }

function   pkgPdf(p){
    const rows = [['الوجهة', p.destination],['المدة', p.nights],['المجموعة', p.groupType],['الانطلاق', p.departs],['السعر', p.price]];
    printDoc(p.title,
      '<h1>' + p.title + '</h1><div class="sub">برنامج باقة سياحية — ' + p.destination + '</div>' +
      '<h2>التفاصيل</h2><table>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</table>' +
      '<h2>تشمل الباقة</h2><ul>' + (p.includes || []).map(i => '<li>' + i + '</li>').join('') + '</ul>' +
      '<div class="note">السعر إرشادي للفرد في غرفة مزدوجة وقابل للتغيير حسب موعد السفر والتوفر. يؤكد فريقنا التفاصيل قبل الحجز.</div>');
  }

function   groupText(group, list){
    const lines = ['باقات وجولات — ' + (group === 'الكل' ? 'كل المجموعات' : group), ''];
    list.forEach(p => {
      lines.push(p.title + ' — ' + p.destination);
      lines.push('المدة: ' + p.nights + ' · الانطلاق: ' + p.departs + ' · السعر: ' + p.price);
      (p.includes || []).forEach(i => lines.push('• ' + i));
      lines.push('');
    });
    lines.push('قصر المرايا للسفر والسياحة — 6393 — sales@almarayagroup.com');
    return lines.join('\n');
  }

function   printDoc(title, bodyHtml){
    // Rendered in a hidden iframe on this page, never a pop-up window, so
    // pop-up blockers can't stop the download.
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0';
    document.body.appendChild(frame);
    const w = frame.contentWindow;
    if(!w){ flash('تعذّر تجهيز الملف'); frame.remove(); return; }
    w.document.open();
    w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>' + title + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=IBM+Plex+Sans:wght@600;700&display=swap" rel="stylesheet">' +
      '<style>@page{size:A4;margin:18mm}*{box-sizing:border-box}' +
      'body{margin:0;font-family:"IBM Plex Sans Arabic",system-ui,sans-serif;color:#1d2733;line-height:1.7}' +
      'header{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding-bottom:14px;border-bottom:3px solid #049dc5;margin-bottom:26px}' +
      '.brand{font-size:19px;font-weight:700;color:#049dc5}.sub{font-size:12.5px;color:#5f666e}' +
      'h1{margin:0 0 6px;font-size:27px;font-weight:700;color:#036f8c}' +
      'h2{margin:26px 0 10px;font-size:18px;font-weight:700;color:#1d2733}' +
      'table{width:100%;border-collapse:collapse;margin-top:6px}' +
      'td{padding:9px 12px;font-size:14px;border-bottom:1px solid #ececed}' +
      'td:first-child{width:38%;color:#5f666e;font-weight:600}' +
      'ul{margin:6px 0 0;padding-inline-start:20px;font-size:14px}li{margin-bottom:4px}' +
      '.note{margin-top:16px;padding:12px 16px;border-radius:var(--tw-radius-sm,10px);background:#fef3dc;color:#a06a00;font-size:13px}' +
      '.card{border:1px solid #ececed;border-radius:var(--tw-radius-sm,10px);padding:16px 18px;margin-bottom:14px;page-break-inside:avoid}' +
      '.card h3{margin:0 0 4px;font-size:17px;color:#036f8c}.meta{font-size:13px;color:#5f666e}' +
      'footer{margin-top:34px;padding-top:12px;border-top:1px solid #ececed;font-size:12px;color:#5f666e;display:flex;justify-content:space-between;gap:12px}' +
      '</style></head><body>' +
      '<header><span class="brand">قصر المرايا للسفر و السياحة<span class="sub" style="display:block">QASER ALMARAYA · FOR TRAVEL &amp; TOURISM</span></span>' +
      '<span class="sub">6393 · sales@almarayagroup.com</span></header>' +
      bodyHtml +
      '<footer><span>قصر المرايا للسفر و السياحة</span><span>+964 784 999 9600</span></footer>' +
      '</body></html>');
    w.document.close();
    setTimeout(() => {
      try { w.focus(); w.print(); } catch (e) {}
      setTimeout(() => frame.remove(), 60000);
    }, 700);
  }

function   renderVals(){
    const { page, active, group } = st;
    const navItems = NAV.map(n => {
      const isOn = page === n.id;
      return {
        label: n.id === 'packages' && st.lang === 'en' ? 'Groups & Packages' : n.id === 'guide' && st.lang === 'en' ? 'Travel guides' : n.label,
        noI18n: n.id === 'packages' || n.id === 'guide',
        weight: isOn ? 700 : 500,
        color: isOn ? '#049dc5' : '#3d4650',
        border: isOn ? '#049dc5' : 'transparent',
        go: ROUTE_MAP[n.id]
          ? e => { e.preventDefault(); router.push(ROUTE_MAP[n.id]); }
          : e => { e.preventDefault(); go(n.id); }
      };
    });
    const groups = GROUPS.map(g => ({
      label: g,
      on: group === g ? 'true' : 'false',
      go: () => patch({ group: g })
    }));
    const country0 = COUNTRIES.find(c => c.code === active) || COUNTRIES[0];
    const country = Object.assign({}, country0, { flagUrl: country0.flagUrl || ('/assets/flags/' + country0.code + '.png'), upper: country0.code.toUpperCase(), isAppointment: VISAS.some(v => v.country === country0.code && v.type === 'appointment') });
    const out = {
      navItems, groups,
      countries: COUNTRIES,
      active,
      country,
      group,
      countryOptions: COUNTRIES.map(c => ({ code: c.code, name: c.name })),
      pickCountry: e => { patch({ active: e.target.value, searched: true }); setTimeout(() => { const el = document.querySelector('[data-visa-results]'); if(el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 90, behavior: 'smooth' }); }, 60); },
      travellers: st.travellers,
      travellersAr: toArabic(st.travellers),
      children: st.children,
      childrenAr: toArabic(st.children),
      incChildren: e => { if(e) e.preventDefault(); patch({ children: Math.min(9, st.children + 1) }); },
      decChildren: e => { if(e) e.preventDefault(); patch({ children: Math.max(0, st.children - 1) }); },
      incTravellers: e => { if(e) e.preventDefault(); patch({ travellers: Math.min(9, st.travellers + 1) }); },
      decTravellers: e => { if(e) e.preventDefault(); patch({ travellers: Math.max(1, st.travellers - 1) }); },
      setTravellers: e => patch({ travellers: Math.min(9, Math.max(1, +e.target.value || 1)) }),
      tripDate: st.tripDate,
      setTripDate: e => patch({ tripDate: e.target.value }),
      tourSubject: st.pkg ? st.pkg : ('مجموعة: ' + group),
      packages: (group === 'الكل' ? PACKAGES : PACKAGES.filter(p => p.groupType === group))
        .map(p => ({ ...p, onDetails: () => { patch({ pkg: p.title }); go('tour-apply'); } })),
      loading: st.loading,
      isHome: page === 'home',
      isFlights: page === 'flights',
      isJobs: page === 'jobs',
      langLabel: st.lang === 'ar' ? 'EN' : 'ع',
      toggleLang: e => {
        if(e) e.preventDefault();
        const next = st.lang === 'ar' ? 'en' : 'ar';
        try { localStorage.setItem('qa_lang', next); } catch {}
        try { window.dispatchEvent(new CustomEvent('qa-lang-change', { detail: next })); } catch {}
        patch({ lang: next });
      },
      applyOpen: !!st.apply,
      applyJob: st.apply || '',
      applySent: st.applySent,
      applyForm: !st.applySent,
      applySending: st.applySending,
      applyError: !!st.applyError,
      applyErrorText: st.applyError,
      fileUploading: st.fileUploading,
      afName: st.af.name,
      afPhone: st.af.phone,
      afEmail: st.af.email,
      afBring: st.af.bring,
      cvName: st.files.cv || 'لم يتم اختيار ملف',
      coverName: st.files.cover || 'لم يتم اختيار ملف',
      workName: st.files.work || 'لم يتم اختيار ملف',
      openApply: e => { if(e) e.preventDefault(); const j = e && e.currentTarget ? e.currentTarget.getAttribute('data-job') : ''; const o = e && e.currentTarget ? e.currentTarget.getAttribute('data-odoo') : ''; patch({ apply: j || 'تقديم عام', applyOdoo: o || '', applySent: false, applyError: '' }); },
      closeApply: e => { if(e) e.preventDefault(); patch({ apply: null, applyOdoo: '', applySent: false, applyError: '' }); },
      stopClose: e => { if(e) e.stopPropagation(); },
      setAfName: e => patch({ af: Object.assign({}, st.af, { name: e.target.value }) }),
      setAfPhone: e => patch({ af: Object.assign({}, st.af, { phone: e.target.value }) }),
      setAfEmail: e => patch({ af: Object.assign({}, st.af, { email: e.target.value }) }),
      setAfBring: e => patch({ af: Object.assign({}, st.af, { bring: e.target.value }) }),
      pickCv: async e => { const f = e.target.files && e.target.files[0]; if (f) { patch((s) => ({ fileUploading: { ...s.fileUploading, cv: true }, applyError: '' })); try { const fd = new FormData(); fd.append('file', f); const res = await fetch('/api/jobs/upload', { method: 'POST', body: fd }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'فشل رفع الملف'); patch((s) => ({ files: { ...s.files, cv: f.name }, fileUrls: { ...s.fileUrls, cv: data.url }, fileUploading: { ...s.fileUploading, cv: false } })); } catch (err) { patch((s) => ({ applyError: err.message, fileUploading: { ...s.fileUploading, cv: false } })); } } },
      pickCover: async e => { const f = e.target.files && e.target.files[0]; if (f) { patch((s) => ({ fileUploading: { ...s.fileUploading, cover: true }, applyError: '' })); try { const fd = new FormData(); fd.append('file', f); const res = await fetch('/api/jobs/upload', { method: 'POST', body: fd }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'فشل رفع الملف'); patch((s) => ({ files: { ...s.files, cover: f.name }, fileUrls: { ...s.fileUrls, cover: data.url }, fileUploading: { ...s.fileUploading, cover: false } })); } catch (err) { patch((s) => ({ applyError: err.message, fileUploading: { ...s.fileUploading, cover: false } })); } } },
      pickWork: async e => { const f = e.target.files && e.target.files[0]; if (f) { patch((s) => ({ fileUploading: { ...s.fileUploading, work: true }, applyError: '' })); try { const fd = new FormData(); fd.append('file', f); const res = await fetch('/api/jobs/upload', { method: 'POST', body: fd }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'فشل رفع الملف'); patch((s) => ({ files: { ...s.files, work: f.name }, fileUrls: { ...s.fileUrls, work: data.url }, fileUploading: { ...s.fileUploading, work: false } })); } catch (err) { patch((s) => ({ applyError: err.message, fileUploading: { ...s.fileUploading, work: false } })); } } },
      submitApply: async e => {
        if(e) e.preventDefault();
        const a = st.af, f = st.files, missing = [];
        if(!a.name.trim()) missing.push('الاسم الكامل');
        if(!a.phone.trim()) missing.push('رقم الهاتف');
        if(!a.email.trim()) missing.push('البريد الإلكتروني');
        if(!a.bring.trim()) missing.push('ما يمكنك إضافته');
        if(!f.cv) missing.push('السيرة الذاتية');
        if(!f.cover) missing.push('رسالة التقديم');
        if(missing.length) { patch({ applyError: 'يرجى إكمال: ' + missing.join('، ') + '.' }); return; }
        if(st.fileUploading.cv || st.fileUploading.cover || st.fileUploading.work) { patch({ applyError: 'يرجى الانتظار حتى اكتمال رفع الملفات.' }); return; }
        patch({ applySending: true, applyError: '' });
        try {
          const res = await fetch('/api/jobs/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job: st.apply, odooJobId: st.applyOdoo || '', name: a.name, phone: a.phone, email: a.email, bring: a.bring, cvUrl: st.fileUrls.cv, coverUrl: st.fileUrls.cover, workUrl: st.fileUrls.work }),
          });
          if(!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'تعذر إرسال الطلب، حاول مرة أخرى'); }
          patch({ applySent: true, applyError: '', applySending: false });
        } catch(err) {
          patch({ applyError: err.message, applySending: false });
        }
      },
      isPrivacy: page === 'privacy',
      isTerms: page === 'terms',
      isAbout: page === 'about',
      goPrivacy: e => { if(e) e.preventDefault(); go('privacy'); },
      goTerms: e => { if(e) e.preventDefault(); go('terms'); },
      goAbout: e => { if(e) e.preventDefault(); go('about'); },
      isFaq: page === 'faq',
      isInsurance: page === 'insurance',
      isGroups: page === 'groups',
      goInsurance: e => { if(e) e.preventDefault(); go('insurance'); },
      goGroups: e => { if(e) e.preventDefault(); go('groups'); },
      goJobs: e => { if(e) e.preventDefault(); router.push('/jobs'); },
      goFaq: e => { if(e) e.preventDefault(); router.push('/faq'); },
      isContact: page === 'contact',
      contact: st.contact,
      contactSending: st.contactSending,
      contactSent: st.contactSent,
      // Same message, ready to send on WhatsApp (the 784 line feeds Zoho Desk)
      contactWaHref: st.contactLast ? waLink(['مرحباً قصر المرايا، أرسلت رسالة من الموقع:', 'الاسم: ' + st.contactLast.name, 'الهاتف: ' + st.contactLast.phone, 'الموضوع: ' + (st.contactLast.subject || '-'), st.contactLast.message].join('\n')) : null,
      contactError: st.contactError,
      setContactField: field => e => patch((s) => ({ contact: { ...s.contact, [field]: e.target.value }, contactError: '' })),
      submitContact: async e => {
        if(e) e.preventDefault();
        const c = st.contact;
        if(!c.name.trim() || !c.phone.trim() || !c.message.trim()) { patch({ contactError: 'يرجى تعبئة الاسم ورقم الهاتف والسؤال.' }); return; }
        if(c.phone.replace(/\D/g, '').length < 7) { patch({ contactError: 'يرجى كتابة رقم هاتف صحيح.' }); return; }
        patch({ contactSending: true, contactError: '' });
        try {
          const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) });
          if(!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'تعذر إرسال الرسالة، حاول لاحقاً'); }
          patch({ contactSent: true, contactSending: false, contactLast: c, contact: { name: '', phone: '', email: '', company: '', subject: 'حجز طيران', message: '' } });
        } catch(err) {
          patch({ contactError: err.message, contactSending: false });
        }
      },
      openWhatsapp: e => { if(e) e.preventDefault(); if(window.qaChime) window.qaChime(); window.open('https://wa.me/' + WHATSAPP_NUMBER, '_blank'); },
      goHome: e => { if(e) e.preventDefault(); router.push('/'); },
      goFlights: e => { if(e) e.preventDefault(); router.push('/flights'); },
      goContact: e => { if(e) e.preventDefault(); router.push('/contact'); },
      selectCountry: code => patch({ active: code }),
      achievements: (props.content && props.content.achievements) || ACHIEVEMENTS,
      achievement: st.achievement,
      selectAchievement: id => patch({ achievement: id }),
      exportOn: props.exportActions !== false,
      visaExportOn: page === 'visas' && props.exportActions !== false,
      trackOpen: st.trackOpen,
      trackForm: !st.trackQuery,
      trackResult: !!st.trackQuery,
      trackQuery: st.trackQuery,
      trackInput: st.trackInput,
      trackSending: st.trackSending,
      trackError: st.trackError,
      openTrack: e => { if(e) e.preventDefault(); patch({ trackOpen: true, trackQuery: '', trackInput: '', trackData: null, trackError: '' }); },
      closeTrack: e => { if(e) e.preventDefault(); patch({ trackOpen: false }); },
      stopTrack: e => { if(e) e.stopPropagation(); },
      setTrackInput: e => patch({ trackInput: e.target.value }),
      resetTrack: e => { if(e) e.preventDefault(); patch({ trackQuery: '', trackInput: '', trackData: null, trackError: '' }); },
      submitTrack: async e => {
        if(e) e.preventDefault();
        const v = st.trackInput.trim();
        if(!v) { flash('أدخل رقم هاتفك أو رقم الطلب'); return; }
        patch({ trackSending: true, trackError: '' });
        try {
          const res = await fetch('/api/visa/track?q=' + encodeURIComponent(v));
          const data = await res.json();
          if(!res.ok) throw new Error(data.error || 'تعذر التحقق من الطلب');
          patch({ trackQuery: v, trackData: data.applications || [], trackSending: false });
        } catch(err) {
          patch({ trackError: err.message, trackSending: false });
        }
      },
      trackSteps: (st.trackData || []).map((a) => ({
        label: (a.country_name_ar || '') + ' — ' + (a.visa_type_name_ar || ''),
        hint: 'الحالة: ' + (a.status_name_ar || 'قيد المعالجة') + ' · طلب رقم QA-' + String(a.id).padStart(6, '0'),
        icon: 'file-text',
      })),
      toastOn: !!st.toast,
      toastText: st.toast,
      isVisas: page === 'visas',
      isVisaApply: page === 'visa-apply',
      goVisaApply: e => { if(e) e.preventDefault(); go('visa-apply'); },
      goVisas: e => { if(e) e.preventDefault(); router.push('/visa'); },
      goPackages: e => { if(e) e.preventDefault(); router.push('/packages'); },
    };
    return Object.assign(out, visaVals(country));
  }

  /* ---------- Visa module (BRD v3) ---------- */

function   money(n){ const s = Number(n || 0).toLocaleString('en-US'); return st.lang === 'en' ? 'IQD ' + s : s + ' د.ع'; }

function   L(ar, en){ return st.lang === 'en' && en != null ? en : ar; }

function   typeOf(v){ return VISA_TYPES.find(t => t.id === (v && v.type)) || VISA_TYPES[0]; }

function   typeName(v){ const t = typeOf(v); return L(t.name, t.en) + (v.tier ? ' — ' + L(v.tier, v.tierEn) : ''); }

function   visasFor(code){ return VISAS.filter(v => v.country === code); }

function   storageKey(v){ return 'qa-visa-app:' + v.id; }

function   newApp(v){
    const trav = [];
    for(let i = 0; i < st.travellers; i++) trav.push({ uid: 'a' + i, kind: 'adult', name: '', answers: {}, files: {} });
    for(let i = 0; i < st.children; i++) trav.push({ uid: 'c' + i, kind: 'child', name: '', answers: {}, files: {} });
    return { visaId: v.id, phone: '', email: '', accept: false, travellers: trav, savedAt: 0 };
  }

function   loadApp(v){
    try { const raw = localStorage.getItem(storageKey(v)); if(raw){ const a = JSON.parse(raw); if(a && a.travellers && a.travellers.length){ flash(L('استعدنا طلبك المحفوظ — تابع من حيث توقفت', 'We restored your saved application — continue where you left off')); return a; } } } catch(e){}
    return newApp(v);
  }

function   saveApp(app){
    app.savedAt = Date.now();
    try { localStorage.setItem(storageKey({ id: app.visaId }), JSON.stringify(app)); } catch(e){}
    patch({ app, appError: '' });
  }

function   updApp(fn){ const a = JSON.parse(JSON.stringify(st.app)); fn(a); saveApp(a); }

function   lineVisible(line, tv){
    if(line.who !== 'all' && line.who !== tv.kind) return false;
    if(line.showIf){ const val = tv.answers[line.showIf.line]; if(val !== line.showIf.equals) return false; }
    return true;
  }

function   lineDone(line, tv){
    if(line.kind === 'file' || line.kind === 'photo') return !!tv.files[line.id];
    const v = tv.answers[line.id];
    if(line.kind === 'repeat') return Array.isArray(v) && v.some(x => String(x || '').trim());
    return v != null && String(v).trim() !== '';
  }

function   registerDict(){
    if(typeof window === 'undefined' || dictRef.current || !i18nReady()) return; dictRef.current = true;
    const m = {};
    COUNTRIES.forEach(c => { m[c.name] = c.en; });
    VISA_TYPES.forEach(t => { m[t.name] = t.en; });
    VISAS.forEach(v => { if(v.tier) m[v.tier] = v.tierEn; m[v.notes] = v.notesEn; m[v.refund] = v.refundEn; if(v.stayEn) m[v.stay] = v.stayEn; if(v.issuingEn) m[v.issuing] = v.issuingEn; if(v.validityEn) m[v.validity] = v.validityEn;
      v.docs.forEach(d => { m[d.ar] = d.en; if(d.rules) m[d.rules] = d.rulesEn; if(d.options) d.options.forEach((o, i) => { m[o] = d.optionsEn[i]; }); }); });
    window.QA_I18N.add(m);
  }

function   visaText(v, c){
    return ['ملف تأشيرة — ' + c.name, 'النوع: ' + typeName(v), 'مدة الإقامة: ' + v.stay, 'مدة الإصدار: ' + v.issuing, 'صلاحية قبل السفر: ' + v.validity,
      'سعر البالغ: ' + money(v.adult), 'سعر الطفل: ' + money(v.child), '', 'المستندات المطلوبة:',
      ...v.docs.map(d => '• ' + d.ar + (d.required ? ' (مطلوب)' : ' (اختياري)')), '', 'ملاحظات: ' + v.notes, 'سياسة الاسترداد: ' + v.refund, '', 'قصر المرايا للسفر والسياحة — 6293'].join('\n');
  }

function   visaVals(country){
    registerDict();
    const S = st, fees = props.showVisaFees !== false, page = S.page;
    const list = visasFor(country.code);
    const visa0 = list.find(v => v.id === S.visaId) || list[0];
    const type = typeOf(visa0);
    const visa = Object.assign({}, visa0, { typeName: typeName(visa0), isAppointment: type.id === 'appointment' });
    const total = visa.adult * S.travellers + visa.child * S.children;
    const scrollRes = () => setTimeout(() => { const el = document.querySelector('[data-visa-results]'); if(el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 90, behavior: 'smooth' }); }, 60);
    const pick = code => { patch({ active: code, visaId: '', searched: true, visaDetailOpen: false, countryPanelOpen: false, countryQuery: '' }); scrollRes(); };
    const qRaw = S.countryQuery.trim(), q = toWest(qRaw).toLowerCase();
    const matchesQuery = c => { if(!q) return true; const hay = toWest(c.name + ' ' + (c.en || '')).toLowerCase(); return hay.indexOf(q) >= 0; };
    const KIND = { file: ['رفع ملف', 'file-text'], photo: ['صورة بشروط', 'image'], text: ['سؤال كتابي', 'message-circle'], choice: ['اختيار من قائمة', 'check'], yesno: ['نعم / لا', 'info'], number: ['رقم', 'hash'], date: ['تاريخ', 'calendar-days'], repeat: ['بند متكرر', 'users'] };
    const WHO = { all: 'الجميع', adult: 'البالغين', child: 'الأطفال' };
    const condText = line => { if(!line.showIf) return ''; const src = visa.docs.find(d => d.id === line.showIf.line); const eq = line.showIf.equals; const val = eq === 'yes' ? L('نعم', 'Yes') : eq === 'no' ? L('لا', 'No') : (src && src.options ? L(eq, src.optionsEn[src.options.indexOf(eq)]) : eq); return (src ? L(src.ar, src.en) : '') + ' = ' + val; };
    const ticksOf = v => TYPE_TICKS.filter(t => typeOf(v)[t.key]).map(t => ({ icon: t.icon, label: t.label }));
    const minBy = (arr, f) => arr.reduce((m, x) => f(x) < f(m) ? x : m, arr[0]);
    const issuingDays = v => { const m = toWest(v.issuing).match(/\d+/); if(!m) return 999; return /ساعة/.test(v.issuing) ? +m[0] / 24 : /أشهر|شهر/.test(v.issuing) ? +m[0] * 30 : +m[0]; };
    const typesLabel = l => { const names = []; l.forEach(v => { const n = L(typeOf(v).name, typeOf(v).en); if(names.indexOf(n) < 0) names.push(n); }); return (l.length === 1 ? L('نوع واحد', '1 type') : l.length === 2 ? L('نوعان', '2 types') : toArabic(l.length) + ' ' + L('أنواع', 'types')) + ': ' + names.join(L('، ', ', ')); };
    const cheapest = l => minBy(l, v => v.adult);

    /* application */
    const app = S.app && S.app.visaId === visa.id ? S.app : newApp(visa);
    const app0 = () => (st.app && st.app.visaId === visa.id) ? st.app : newApp(visa);
    const ensure = fn => { if(!(st.app && st.app.visaId === visa.id)) { const a = newApp(visa); fn(a); saveApp(a); } else updApp(fn); };
    let doneAll = 0, totalAll = 0;
    const travellersList = app.travellers.map((tv, i) => {
      const lines = visa.docs.filter(d => lineVisible(d, tv));
      let done = 0; lines.forEach(d => { if(lineDone(d, tv)) done++; });
      doneAll += done; totalAll += lines.length;
      const set = (id, val) => ensure(a => { a.travellers[i].answers[id] = val; });
      return {
        n: toArabic(i + 1), name: tv.name, kindLabel: tv.kind === 'adult' ? L('بالغ', 'Adult') : L('طفل', 'Child'),
        kindBg: tv.kind === 'adult' ? '#eaf8fd' : '#fef3dc', kindInk: tv.kind === 'adult' ? '#036f8c' : '#a06a00',
        done: toArabic(done), total: toArabic(lines.length), canRemove: app.travellers.length > 1,
        remove: e => { if(e) e.preventDefault(); ensure(a => { a.travellers.splice(i, 1); }); },
        setName: e => { const v = e.target.value; ensure(a => { a.travellers[i].name = v; }); },
        lines: lines.map(d => {
          const isUp = d.kind === 'file' || d.kind === 'photo', val = tv.answers[d.id], file = tv.files[d.id] || '', ok = lineDone(d, tv);
          const items = Array.isArray(val) ? val : [];
          return {
            id: d.id, label: L(d.ar, d.en), rules: d.rules ? L(d.rules, d.rulesEn) : '', icon: KIND[d.kind][1],
            iconBg: ok ? '#049dc5' : '#f8f7f8', iconInk: ok ? '#fff' : '#5f666e',
            border: ok ? '#bfe9f6' : '#ececed', bg: ok ? '#f6fcfe' : '#fff',
            tagBg: d.required ? '#eaf8fd' : '#fef3dc', tagInk: d.required ? '#036f8c' : '#a06a00', tagLabel: d.required ? L('مطلوب', 'Required') : L('اختياري', 'Optional'),
            isUpload: isUp, isText: d.kind === 'text', isNumber: d.kind === 'number', isDate: d.kind === 'date', isChoice: d.kind === 'choice', isYesNo: d.kind === 'yesno', isRepeat: d.kind === 'repeat',
            accept: d.kind === 'photo' ? 'image/*' : 'image/*,.pdf', hasFile: file ? 'true' : '', fileLabel: file || (d.kind === 'photo' ? L('اختر صورة', 'Choose a photo') : L('اختر ملفاً', 'Choose a file')), fileInk: file ? '#1d2733' : '#5f666e', fileAction: file ? L('تغيير', 'Change') : L('رفع', 'Upload'),
            pickFile: e => { const f = e.target.files && e.target.files[0]; ensure(a => { a.travellers[i].files[d.id] = f ? f.name : ''; }); },
            value: val == null || Array.isArray(val) ? '' : val, set: e => set(d.id, e.target.value),
            options: (d.options || []).map((o, k) => ({ value: o, label: L(o, d.optionsEn[k]) })),
            yes: e => { if(e) e.preventDefault(); set(d.id, 'yes'); }, no: e => { if(e) e.preventDefault(); set(d.id, 'no'); },
            yesBg: val === 'yes' ? '#049dc5' : '#fff', yesInk: val === 'yes' ? '#fff' : '#3d4650', yesBorder: val === 'yes' ? '#049dc5' : '#cacbcc',
            noBg: val === 'no' ? '#049dc5' : '#fff', noInk: val === 'no' ? '#fff' : '#3d4650', noBorder: val === 'no' ? '#049dc5' : '#cacbcc',
            items: items.map((x, k) => ({ value: x, set: e => { const v = e.target.value; set(d.id, items.map((y, j) => j === k ? v : y)); }, remove: e => { if(e) e.preventDefault(); set(d.id, items.filter((y, j) => j !== k)); } })),
            add: e => { if(e) e.preventDefault(); set(d.id, items.concat([''])); }
          };
        })
      };
    });
    const adults = app.travellers.filter(t => t.kind === 'adult').length, kids = app.travellers.length - adults;
    const appTotal = visa.adult * adults + visa.child * kids;
    const notGuaranteed = !type.guaranteed;
    const submitApp = e => {
      if(e) e.preventDefault();
      const a = app0(); const problems = [];
      if(!a.phone.trim() || a.travellers.some(t => !t.name.trim())) problems.push(L('تأكد من رقم الهاتف واسم كل مسافر', 'Check the phone number and each traveller name'));
      let missing = 0; a.travellers.forEach(t => visa.docs.forEach(d => { if(lineVisible(d, t) && d.required && !lineDone(d, t)) missing++; }));
      if(missing) problems.push(L('البنود المطلوبة غير المكتملة: ', 'Required items still missing: ') + toArabic(missing));
      if(notGuaranteed && !a.accept) problems.push(L('يجب الموافقة على أن النتيجة غير مضمونة', 'You must accept that the result is not guaranteed'));
      if(problems.length){ patch({ appError: problems.join(' · ') }); return; }
      patch({ appStage: 'pay', appError: '' }); window.scrollTo(0, 0);
    };
    const fmtTime = ts => { if(!ts) return ''; const d = new Date(ts); return d.toLocaleTimeString(st.lang === 'en' ? 'en-GB' : 'ar-IQ', { hour: '2-digit', minute: '2-digit' }); };
    const STATUS = [
      { key: 'process', label: 'قيد المعالجة', hint: 'ملفك لدينا أو لدى الجهة المصدرة', icon: 'clock' },
      { key: 'action', label: 'إجراء مطلوب منك', hint: 'مستند ناقص أو معلومة نحتاجها', icon: 'info' },
      { key: 'ready', label: 'جاهزة للتحميل', hint: 'تأشيرتك جاهزة في حسابك', icon: 'check' }];
    const ROLE = { customer: ['أنت', '#049dc5', '#fff', '#fff', '#ececed'], team: ['فريقنا', '#eaf8fd', '#036f8c', '#fff', '#ececed'], system: ['النظام', '#fef3dc', '#a06a00', '#fffaf0', '#fdd27c'] };
    const stage = S.appStage;
    return {
      visa, notGuaranteed, stayLabel: L('إقامة ', 'Stay ') + visa.stay, issuingLabel: L('الإصدار ', 'Issuing ') + visa.issuing,
      typesLabel: typesLabel(list),
      fromAdult: money(cheapest(list).adult), fromChild: money(cheapest(list).child), fromIssuing: minBy(list, issuingDays).issuing,
      adultPrice: money(visa.adult), childPrice: money(visa.child), feeTotal: money(total),
      cardRows: [
        { label: 'الدولة', value: country.name }, { label: 'النوع', value: visa.typeName }, { label: 'مدة الإقامة', value: visa.stay },
        { label: 'مدة الإصدار', value: visa.issuing }, { label: 'صلاحية قبل السفر', value: visa.validity },
        { label: 'سعر البالغ', value: money(visa.adult), noI18n: 'true' }, { label: 'سعر الطفل', value: money(visa.child), noI18n: 'true' }
      ].map(r => Object.assign({ noI18n: '' }, r)),
      ticks: TYPE_TICKS.map(t => { const on = !!type[t.key]; return { icon: on ? t.icon : 'x', label: t.label, opacity: on ? '1' : '.55', bg: on ? '#049dc5' : '#f8f7f8', ink: on ? '#fff' : '#a6abb0', tagBg: on ? '#eaf8fd' : '#f8f7f8', tagInk: on ? '#036f8c' : '#a6abb0', status: on ? 'مشمول' : 'غير مشمول' }; }),
      docCount: toArabic(visa.docs.length),
      docRows: visa.docs.map(d => ({ label: L(d.ar, d.en), kindLabel: KIND[d.kind][0], icon: KIND[d.kind][1], who: WHO[d.who], rules: d.rules ? L(d.rules, d.rulesEn) : '', condition: condText(d),
        tagBg: d.required ? '#eaf8fd' : '#fef3dc', tagInk: d.required ? '#036f8c' : '#a06a00', tagLabel: d.required ? 'مطلوب' : 'اختياري' })),
      resultCount: toArabic(list.filter(v => S.resultKind === 'الكل' || typeOf(v).filter === S.resultKind).length),
      resultKinds: ['الكل'].concat(VISA_TYPES.filter(t => list.some(v => v.type === t.id)).map(t => t.filter)).map(k => ({
        label: k, bg: S.resultKind === k ? '#049dc5' : '#fff', ink: S.resultKind === k ? '#fff' : '#3d4650', border: S.resultKind === k ? '#049dc5' : '#cacbcc', go: () => patch({ resultKind: k }) })),
      results: list.filter(v => S.resultKind === 'الكل' || typeOf(v).filter === S.resultKind).map(v => { const t = typeOf(v); return {
        code: country.upper, flagUrl: country.flagUrl, tierLabel: v.tier ? L(v.tier, v.tierEn) : '', typeLabel: L(t.name, t.en), stay: v.stay, issuing: v.issuing, validity: v.validity,
        title: typeName(v) + ' — ' + L(country.name, country.en), stayLabel: L('إقامة ', 'Stay ') + v.stay, ticks: ticksOf(v), docCount: toArabic(v.docs.length),
        gBg: t.guaranteed ? '#eaf8fd' : '#fef3dc', gInk: t.guaranteed ? '#036f8c' : '#a06a00', gLabel: t.guaranteed ? 'النتيجة مضمونة' : 'الموافقة غير مضمونة',
        adult: money(v.adult), child: money(v.child),
        view: e => { if(e) e.preventDefault(); patch({ visaId: v.id, visaDetailOpen: true }); window.scrollTo(0, 0); } }; }),
      noResults: !list.some(v => S.resultKind === 'الكل' || typeOf(v).filter === S.resultKind),
      visaCount: toArabic(COUNTRIES.length), visaCardCount: toArabic(VISAS.length),
      visaTypes: ['الكل'].concat(VISA_TYPES.map(t => t.filter)).map(f => ({ label: f, on: S.visaType === f ? 'true' : 'false',
        count: toArabic(f === 'الكل' ? COUNTRIES.length : COUNTRIES.filter(c => visasFor(c.code).some(v => typeOf(v).filter === f)).length), go: () => patch({ visaType: f }) })),
      regionTiles: REGIONS.map(r => {
        const items = COUNTRIES.filter(c => c.region === r).filter(c => S.visaType === 'الكل' || visasFor(c.code).some(v => typeOf(v).filter === S.visaType)).map(c => {
          const l = visasFor(c.code), on = c.code === S.active, ch = cheapest(l);
          return { code: c.code, flagUrl: c.flagUrl || ('/assets/flags/' + c.code + '.png'), name: c.name, upper: c.code.toUpperCase(), types: typesLabel(l), issuing: minBy(l, issuingDays).issuing,
            feeK: fees ? toArabic(Math.round(ch.adult / 1000)) : '—', border: on ? '2px solid #049dc5' : '1px solid #ececed', shadow: on ? '0 18px 34px rgba(4,157,197,.26)' : 'var(--tw-card-shadow,0 2px 8px rgba(29,39,51,.07))',
            cta: on ? '#049dc5' : '#5f666e', action: on ? 'معروضة الآن' : 'اعرض التفاصيل', go: () => pick(c.code) };
        });
        return { label: r, count: toArabic(items.length), items };
      }).filter(r => r.items.length),
      pickCountry: e => pick(e.target.value),
      countryPanelOpen: S.countryPanelOpen, chevronRotate: S.countryPanelOpen ? 'rotate(180deg)' : 'none',
      toggleCountryPanel: e => { if(e) e.preventDefault(); patch({ countryPanelOpen: !S.countryPanelOpen, countryQuery: '' }); },
      closeCountryPanel: e => { if(e) e.preventDefault(); patch({ countryPanelOpen: false }); },
      countryQuery: S.countryQuery, setCountryQuery: e => patch({ countryQuery: e.target.value }),
      clearCountryQuery: e => { if(e) e.preventDefault(); patch({ countryQuery: '' }); },
      hasCountryMatches: COUNTRIES.some(matchesQuery), noCountryMatch: !!q && !COUNTRIES.some(matchesQuery),
      filteredCountries: COUNTRIES.filter(matchesQuery).map(c => { const l = visasFor(c.code), on = c.code === S.active; return {
        flagUrl: c.flagUrl || ('/assets/flags/' + c.code + '.png'), name: c.name, types: typesLabel(l), fromFee: money(cheapest(l).adult),
        border: on ? '1px solid #bfe9f6' : '1px solid transparent', bg: on ? '#f6fcfe' : '#fff', pick: e => { if(e) e.preventDefault(); pick(c.code); } }; }),
      suggestedCountries: COUNTRIES.slice(0, 4).map(c => { const l = visasFor(c.code); return {
        flagUrl: c.flagUrl || ('/assets/flags/' + c.code + '.png'), name: c.name, types: typesLabel(l), pick: e => { if(e) e.preventDefault(); pick(c.code); } }; }),
      runVisaSearch: e => { if(e) e.preventDefault(); patch({ visaDetailOpen: false, searched: true }); scrollRes(); flash(L('تأشيرات ', 'Visas for ') + country.name); },
      isVisaDetail: S.visaDetailOpen, searched: S.searched,
      showSearchPrompt: page === 'visas' && !S.searched && !S.visaDetailOpen,
      showResults: page === 'visas' && S.searched && !S.visaDetailOpen,
      showVisaRail: page === 'visas',
      closeVisaDetail: e => { if(e) e.preventDefault(); patch({ visaDetailOpen: false }); },
      goVisaApplyDetail: e => {
        if(e) e.preventDefault();
        if (APPLY_FLOW_ENABLED) { patch({ visaId: visa.id, app: loadApp(visa), appStage: 'form', appError: '', ask: false }); go('visa-apply'); return; }
        openWhatsApp(visaMessage({ type: visa.typeName, country: country.name, stay: visa.stay, issuing: visa.issuing, validity: visa.validity, travellers: st.travellers + ' بالغ' + (st.children ? '، ' + st.children + ' طفل' : ''), url: window.location.href }));
      },
      flowSteps: STAGES.map((g, i) => ({
        n: String(i + 1), title: g.title, note: g.note || '',
        items: g.steps.map(k => ({
          title: g.titleIsStage ? '' : FLOW[k.i].title, hint: FLOW[k.i].hint,
          role: ROLE[FLOW[k.i].role][0], roleBg: ROLE[FLOW[k.i].role][1], roleInk: ROLE[FLOW[k.i].role][2],
          outcomes: k.outcomes || [] }))
      })),
      stepsOn: page === 'visas' && props.visaSteps !== false,
      visaExportOn: page === 'visas' && props.exportActions !== false,
      copyVisa: e => { if(e) e.preventDefault(); copy(visaText(visa, country), L('تم نسخ تفاصيل التأشيرة', 'Visa details copied')); },
      pdfVisa: e => {
        if(e) e.preventDefault();
        const rows = [['النوع', visa.typeName], ['مدة الإقامة', visa.stay], ['مدة الإصدار', visa.issuing], ['صلاحية قبل السفر', visa.validity], ['سعر البالغ', money(visa.adult)], ['سعر الطفل', money(visa.child)]];
        printDoc('تأشيرة ' + country.name, '<h1>' + visa.typeName + ' — ' + country.name + '</h1><div class="sub">بطاقة التأشيرة — للاستخدام الإرشادي</div>' +
          '<h2>التفاصيل</h2><table>' + rows.map(r => '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>').join('') + '</table>' +
          '<h2>المستندات المطلوبة</h2><ul>' + visa.docs.map(d => '<li>' + d.ar + ' — <span class="sub">' + KIND[d.kind][0] + ' · ' + (d.required ? 'مطلوب' : 'اختياري') + ' · ' + WHO[d.who] + (d.showIf ? ' · يظهر فقط إذا: ' + condText(d) : '') + '</span></li>').join('') + '</ul>' +
          '<div class="note">' + visa.notes + '</div><div class="note">سياسة الاسترداد: ' + visa.refund + '</div>');
      },
      /* application */
      appSteps: [L('اختيار التأشيرة', 'Choose visa'), L('المسافرون والمستندات', 'Travellers & documents'), L('الدفع', 'Payment'), L('المتابعة', 'Follow up')].map((label, i) => {
        const idx = stage === 'form' ? 1 : stage === 'pay' ? 2 : 3; const st = i < idx ? 'done' : i === idx ? 'on' : 'todo';
        return { n: String(i + 1), label, bg: st === 'on' ? '#fff' : 'rgba(255,255,255,.14)', ink: st === 'on' ? '#036f8c' : '#fff', border: st === 'on' ? '#fff' : 'rgba(255,255,255,.3)',
          dotBg: st === 'done' ? '#faab18' : st === 'on' ? '#049dc5' : 'rgba(255,255,255,.25)', dotInk: '#fff' };
      }),
      appForm: stage === 'form', appPay: stage === 'pay', appDone: stage === 'done',
      appPhone: app.phone, appEmail: app.email,
      setAppPhone: e => { const v = e.target.value; ensure(a => { a.phone = v; }); },
      setAppEmail: e => { const v = e.target.value; ensure(a => { a.email = v; }); },
      travellersList,
      askKind: S.ask, notAsking: !S.ask,
      openAsk: e => { if(e) e.preventDefault(); patch({ ask: true }); },
      cancelAsk: e => { if(e) e.preventDefault(); patch({ ask: false }); },
      addAdult: e => { if(e) e.preventDefault(); ensure(a => { a.travellers.push({ uid: 'a' + Date.now(), kind: 'adult', name: '', answers: {}, files: {} }); }); patch({ ask: false }); },
      addChild: e => { if(e) e.preventDefault(); ensure(a => { a.travellers.push({ uid: 'c' + Date.now(), kind: 'child', name: '', answers: {}, files: {} }); }); patch({ ask: false }); },
      priceRows: [{ count: toArabic(adults), label: L('بالغ', 'adult'), value: money(visa.adult * adults) }].concat(kids ? [{ count: toArabic(kids), label: L('طفل', 'child'), value: money(visa.child * kids) }] : []),
      appTotal: money(appTotal), appDoneCount: toArabic(doneAll), appTotalLines: toArabic(totalAll), appProgress: (totalAll ? Math.round(doneAll / totalAll * 100) : 0) + '%',
      appAccept: !!app.accept, toggleAccept: e => { const v = e.target.checked; ensure(a => { a.accept = v; }); },
      appErrorOn: !!S.appError, appError: S.appError, submitApp,
      appSavedAt: fmtTime(app.savedAt),
      backToForm: e => { if(e) e.preventDefault(); patch({ appStage: 'form' }); },
      onPaid: () => { const no = 'QA-' + String(Math.floor(100000 + Math.random() * 900000)); try { localStorage.removeItem(storageKey(visa)); } catch(e){} patch({ appStage: 'done', appNo: no }); window.scrollTo(0, 0); },
      appNo: S.appNo, appTravellerCount: toArabic(app.travellers.length),
      statusLegend: STATUS.map((s, i) => ({ label: s.label, hint: s.hint, icon: s.icon, now: i === 0, bg: i === 0 ? '#eaf8fd' : '#fff', border: i === 0 ? '#bfe9f6' : '#ececed', dotBg: i === 0 ? '#049dc5' : '#f8f7f8', dotInk: i === 0 ? '#fff' : '#5f666e' }))
    };
  }

  const V = renderVals();
  const { achievement, achievements, addAdult, addChild, adultPrice, afBring, afEmail, afName, afPhone, appAccept, appDone, appDoneCount, appEmail, appError, appErrorOn, appForm, appNo, appPay, appPhone, appProgress, appSavedAt, appSteps, appTotal, appTotalLines, appTravellerCount, applyError, applyErrorText, applyForm, applyJob, applyOpen, applySending, applySent, askKind, backToForm, cancelAsk, cardRows, chevronRotate, childPrice, childrenAr, clearCountryQuery, closeApply, closeCountryPanel, closeTrack, closeVisaDetail, copyGroup, copyVisa, country, countryPanelOpen, countryQuery, coverName, cvName, decChildren, decTravellers, docCount, docRows, exportOn, featured, feeTotal, fileUploading, filteredCountries, flowSteps, fromAdult, fromChild, fromIssuing, goAbout, goContact, goFaq, goFlights, goGroups, goHome, goInsurance, goJobs, goPrivacy, goTerms, goVisaApplyDetail, goVisas, goPackages, groupLabel, groups, hasCountryMatches, hasFeatured, hotelQuery, incChildren, incTravellers, isAbout, isContact, isFaq, isFlights, isGroups, isHome, isInsurance, isJobs, isPackages, isPrivacy, isTerms, isVisaApply, isVisaDetail, isVisas, issuingLabel, langLabel, loading, navItems, noCountryMatch, noPackages, noResults, notAsking, notGuaranteed, onPaid, openApply, openAsk, openTrack, packages, pdfGroup, pdfVisa, pickCover, pickCv, pickWork, priceRows, regionTiles, resetTrack, resultCount, resultKinds, results, roomType, runVisaSearch, scrollToPackages, selectAchievement, setAfBring, setAfEmail, setAfName, setAfPhone, setAppEmail, setAppPhone, setCountryQuery, setHotelQuery, setRoomType, setTrackInput, setTripDate, showResults, showSearchPrompt, showVisaRail, statusLegend, stayLabel, stepsOn, stopClose, stopTrack, submitApp, submitApply, submitTrack, suggestedCountries, ticks, toggleAccept, toggleCountryPanel, toggleLang, trackData, trackError, trackForm, trackInput, trackOpen, trackQuery, trackResult, trackSending, trackSteps, travellersAr, travellersList, tripDate, typesLabel, upcomingEvents, visa, visaCardCount, visaCount, visaExportOn, visaTypes, workName,
    contact, contactSending, contactSent, contactError, setContactField, submitContact, openWhatsapp, contactWaHref } = V;

  return (
    <>



<div dir="rtl" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
<header style={{ position: "sticky", top: "0", zIndex: "40", background: "#fff", borderBottom: "1px solid var(--qs-line,#ececed)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<SeasonDecor />
<div className="qa-head" style={{ maxWidth: "1240px", margin: "0 auto", padding: "12px 32px", display: "flex", alignItems: "center", gap: "24px" }}>
<a href="#" onClick={goHome} aria-label="قصر المرايا للسفر و السياحة" className="qa-logo" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flex: "none" }}>
<img src="/assets/logo-mark-tight.webp" alt="" style={{ height: "38px", width: "38px", objectFit: "contain", display: "block", flex: "none" }} />
<span style={{ display: "flex", flexDirection: "column", gap: "1px", lineHeight: "1.05" }}>
<span style={{ fontSize: "19px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)", whiteSpace: "nowrap" }}>قصر المرايا</span>
<span style={{ fontSize: "10px", fontWeight: "600", color: "var(--qs-ink-2,#5f666e)", whiteSpace: "nowrap" }}>للسفر و السياحة</span>
</span>
</a>
<nav className="qa-navrow" style={{ display: "flex", alignItems: "center", gap: "20px", flex: "1", flexWrap: "wrap", fontSize: "16px" }}>
{(navItems || []).map((item, $index) => (<React.Fragment key={$index}>
<a href="#" className="qa-nav" data-i18n-short={item.noI18n ? undefined : ""} data-no-i18n={item.noI18n ? "" : undefined} onClick={item.go} style={{ fontWeight: item.weight, color: item.color, paddingBottom: "2px", borderBottom: `2px solid ${item.border}`, cursor: "pointer" }}>{item.label}</a>
</React.Fragment>))}
</nav>
<button type="button" onClick={toggleLang} aria-label="Language" title="Language" className="qa-langbtn" style={{ flex: "none", display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "999px", background: "#fff", fontFamily: "inherit", fontSize: "13px", fontWeight: "700", letterSpacing: ".04em", color: "var(--qs-brand-deep,#22a9d4)", cursor: "pointer" }}>
<Icon name="globe" size={17} strokeWidth={1.8} />
<span data-no-i18n="">{langLabel}</span>
</button>
<button className="qa-btn qa-cyan qa-headcta" style={{ flex: "none", padding: "8px 16px", fontSize: "14px" }} onClick={goContact}>تواصل معنا</button>
<button
  type="button"
  onClick={() => setQaMobileMenuOpen(true)}
  aria-label="القائمة"
  aria-expanded={qaMobileMenuOpen}
  className="qa-burger"
  style={{ display: "none", flex: "none", alignItems: "center", justifyContent: "center", width: 42, height: 42, border: 0, borderRadius: 'var(--tw-radius-sm,10px)', background: "var(--qs-band,#049dc5)", color: "#fff", cursor: "pointer", marginInlineStart: "auto" }}
>
  <Icon name="menu" size={22} strokeWidth={2.2} />
</button>
</div>
</header>

{qaMobileMenuOpen && (
  <div className="qa-mobilemenu" style={{ position: "fixed", inset: 0, zIndex: 50, background: "var(--qs-band,#049dc5)", display: "flex", flexDirection: "column", overflowY: "auto" }}>
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 16px" }}>
      <button type="button" onClick={() => setQaMobileMenuOpen(false)} aria-label="إغلاق" style={{ width: 42, height: 42, borderRadius: 'var(--tw-radius-sm,10px)', border: 0, background: "rgba(255,255,255,.18)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <Icon name="x" size={20} strokeWidth={2.4} />
      </button>
    </div>
    <nav style={{ display: "flex", flexDirection: "column", padding: "4px 24px 20px" }}>
      {(navItems || []).map((item, $index) => (
        <a
          key={$index}
          href="#"
          data-i18n-short=""
          onClick={(e) => { setQaMobileMenuOpen(false); item.go(e); }}
          style={{ color: "#fff", fontSize: 20, fontWeight: item.weight >= 700 ? 800 : 600, padding: "16px 4px", borderBottom: "1px solid rgba(255,255,255,.18)", textDecoration: "none" }}
        >
          {item.label}
        </a>
      ))}
    </nav>
    <div style={{ marginTop: "auto", padding: "16px 24px 28px", display: "flex", alignItems: "center", gap: 12 }}>
      <button type="button" onClick={toggleLang} data-no-i18n="" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", border: "1px solid rgba(255,255,255,.35)", borderRadius: 999, background: "transparent", fontFamily: "inherit", fontSize: 13, fontWeight: 700, letterSpacing: ".04em", color: "#fff", cursor: "pointer" }}>
        <Icon name="globe" size={17} strokeWidth={1.8} />
        <span>{langLabel}</span>
      </button>
      <button
        type="button"
        onClick={(e) => { setQaMobileMenuOpen(false); goContact(e); }}
        style={{ flex: 1, textAlign: "center", padding: "12px 16px", borderRadius: 999, background: "#fff", color: "var(--qs-brand-deep,#049dc5)", fontWeight: 700, fontSize: 15, border: 0, cursor: "pointer" }}
      >
        تواصل معنا
      </button>
    </div>
  </div>
)}

<main style={{ flex: "1" }}>

{isHome ? (<>
<div className="qa-page">
<HomeHero hero={props.content && props.content.hero} lang={st.lang} onPrimary={goPackages}>
<section style={{ position: "relative", background: "var(--tw-band,var(--qs-band,#34bbe1))" }}>
<img src="/assets/cover-website.webp" alt="ذكرياتك تبدأ معنا — قصر المرايا للسفر و السياحة" style={{ display: "block", width: "100%", height: "auto" }} />
<div className="qa-cover-copy" style={{ position: "absolute", right: "3%", top: "50%", transform: "translateY(-50%)", width: "34%", maxHeight: "94%", display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "start", gap: "clamp(12px,1.3vw,22px)" }}>
<h1 style={{ margin: "0", fontSize: "clamp(30px,3.4vw,62px)", fontWeight: "700", lineHeight: "1.12", color: "#0e88ad", textWrap: "pretty" }}>رحلتك تبدأ معنا!</h1>
<p style={{ margin: "0", fontSize: "clamp(16px,1.25vw,24px)", lineHeight: "1.65", color: "#1d5f76", fontWeight: "500", textWrap: "pretty" }}>مع قصر المرايا للسفر والسياحة، نأخذك في رحلات لا تُنسى، بخدمات احترافية وتجارب مصممة خصيصًا لك.</p>
<button className="qa-btn qa-amber" onClick={goPackages} style={{ alignSelf: "center", display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", gap: "8px", color: "var(--qs-ink,#012a37)", fontWeight: "700", fontSize: "clamp(15px,1.05vw,19px)", padding: "clamp(11px,.9vw,16px) clamp(24px,2vw,38px)" }}>ابدأ رحلتك الآن
<Icon name="chevron-left" size={14} strokeWidth={2.6} />
</button>
</div>
</section>
</HomeHero>
<BookingPanel lang={st.lang} />
<OfferStories lang={st.lang} />
<HomeOffers lang={st.lang} />
<DeparturesBoard lang={st.lang} />
<HomeDestinations lang={st.lang} />
<HomeServices lang={st.lang} />
<VisaChecker lang={st.lang} />
<HomeOffers lang={st.lang} variant="events" />
<SeasonSpotlight lang={st.lang} />
<TripFinder lang={st.lang} />
<HomeWhy lang={st.lang} milestones={ACHIEVEMENTS} />
<section className="qs-band qs-dark qs-on-dark" data-no-i18n="" dir={st.lang === 'en' ? 'ltr' : 'rtl'}>
<div className="qs-wrap qs-head" style={{ marginBottom: "16px" }}>
<div>
<span className="qs-kicker">{L('شراكات موثوقة', 'Trusted partners')}</span>
<h2 className="qs-h2">{L('نحن وكلاء معتمدون', 'We are authorised agents')}</h2>
<p className="qs-lead">{L('وكيل معتمد للعديد من شركات الطيران والفنادق والوجهات السياحية المرموقة عالميًا.', 'An authorised agent for many leading international airlines, hotels and destinations.')}</p>
</div>
</div>
<PartnersWall />
</section>
<HomeVoices lang={st.lang} />
<HomeInstagram lang={st.lang} />
<HomeContact lang={st.lang} contact={contentContact} />
</div>
</>) : null}

{isFlights ? (<>
<div className="qa-page">
<section className="qa-sec" style={{ paddingTop: "16px", paddingBottom: "0", display: "flex", flexDirection: "column", gap: "6px", textAlign: "center", alignItems: "center" }}>
<h1 style={{ fontSize: "52px", fontWeight: "700", lineHeight: "1.15" }}>الطيران والفنادق</h1>
<p style={{ fontSize: "20px", lineHeight: "1.55", color: "var(--qs-brand-deep,#22a9d4)", maxWidth: "820px" }}>قصر المرايا هي الشريك الرسمي لـ Flamingo — كل حجوزات الطيران والفنادق تُتمّ عبر منصة فلامنغو، ويبقى فريقنا معك من أول بحث حتى بطاقة الصعود.</p>
</section>
<section className="qa-sec" style={{ paddingTop: "20px" }}>
<div style={{ position: "relative", width: "100vw", marginInline: "calc(50% - 50vw)", overflow: "hidden", background: "var(--tw-band-deep,var(--qs-band,#049dc5))" }} data-partner-band="">
<div style={{ position: "relative" }}>
<div style={{ position: "relative", overflow: "hidden" }}><img src="/assets/partners-flamingo-skylo-v3.jpg" alt="فلامنغو وقصر المرايا — شركاء وأصدقاء" style={{ display: "block", width: "100%", height: "auto" }} /></div>
<div className="qa-2col qa-partner" style={{ display: "grid", gridTemplateColumns: "1.08fr .92fr", gap: "40px", alignItems: "center", padding: "44px 48px 48px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
<img src="/assets/logo-mark.webp" alt="قصر المرايا" style={{ height: "64px", width: "auto", background: "#fff", borderRadius: "50%", padding: "6px" }} />
<span style={{ fontSize: "34px", fontWeight: "300", color: "rgba(255,255,255,.75)" }}>×</span>
<img src="/assets/logo-flamingo.webp" alt="Flamingo" style={{ height: "42px", width: "auto" }} />
</div>
<h2 style={{ fontSize: "36px", fontWeight: "700", color: "#fff", lineHeight: "1.25" }}>شريك واحد… وكل رحلات العالم</h2>
<p style={{ fontSize: "18px", lineHeight: "1.75", color: "rgba(255,255,255,.92)" }}>إذا رغبت بإتمام الحجز بنفسك، اكمل حجز الطيران والفنادق مباشرة عبر فلامنغو — نفس الأسعار التعاقدية، ونفس فريق قصر المرايا خلف الكواليس.</p>
<p style={{ fontSize: "13px", color: "rgba(255,255,255,.78)" }}>أو اتصل بالرقم المختصر 6393 وسنحجز لك نحن.</p>
</div>
<a href="https://flamingo.iq" target="_blank" rel="noopener" className="qa-ticket">
<span style={{ flex: "1", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "8px", minWidth: "0" }}>
<span style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "10px", letterSpacing: ".1em", whiteSpace: "nowrap", color: "var(--qs-ink-2,#5f666e)" }}>BOOK DIRECT AT<span style={{ flex: "1", height: "1px", background: "var(--qs-line,#ececed)" }}></span></span>
<img src="/assets/logo-flamingo.webp" alt="flamingo.iq" className="qa-ticket-url" style={{ height: "38px", width: "auto", alignSelf: "flex-start" }} />
</span>
<span aria-hidden="true" style={{ flex: "none", width: "1px", margin: "16px 0", background: "var(--qs-line,#ececed)" }}></span>
<span style={{ flex: "none", padding: "0 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}>
<span className="qa-ticket-go" style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#faab18", color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 6px 16px rgba(250,171,24,.28)" }}>
<Icon name="chevron-left" size={24} strokeWidth={2.4} />
</span>
<span style={{ fontSize: "13px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>احجز الآن</span>
</span>
</a>
</div>
</div>
</div>
</section>
<section className="qa-sec" style={{ paddingTop: "0", display: "flex", flexDirection: "column", gap: "24px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "var(--q-s3,24px)" }}>
<div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: "var(--q-s2,16px)" }}>
<span aria-hidden="true" style={{ position: "absolute", insetInlineStart: "13px", top: "28px", bottom: "calc(-1 * var(--q-s3,24px))", width: "2px", background: "var(--q-line,var(--qs-line,#e6e9eb))" }}></span>
<span style={{ position: "relative", zIndex: "1", flex: "none", display: "grid", placeItems: "center", width: "28px", height: "28px", borderRadius: "999px", background: "var(--q-cyan,var(--qs-band,#049dc5))", color: "#fff", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "var(--q-t6,13px)", fontWeight: "700", lineHeight: "1" }}>1</span>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 auto", minWidth: "0" }}>
<h4 style={{ margin: "0", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>ابحث على <img src="/assets/logo-flamingo.webp" alt="flamingo.iq" style={{ height: "22px", width: "auto" }} /></h4>
<p style={{ margin: "0", fontSize: "var(--q-t5,15px)", lineHeight: "1.7", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))" }}>كل شركات الطيران وسلاسل الفنادق التي نتعامل معها متاحة على المنصة بأسعارنا التعاقدية.</p>
</div>
</div>
<div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: "var(--q-s2,16px)" }}>
<span aria-hidden="true" style={{ position: "absolute", insetInlineStart: "13px", top: "28px", bottom: "calc(-1 * var(--q-s3,24px))", width: "2px", background: "var(--q-line,var(--qs-line,#e6e9eb))" }}></span>
<span style={{ position: "relative", zIndex: "1", flex: "none", display: "grid", placeItems: "center", width: "28px", height: "28px", borderRadius: "999px", background: "var(--q-cyan,var(--qs-band,#049dc5))", color: "#fff", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "var(--q-t6,13px)", fontWeight: "700", lineHeight: "1" }}>2</span>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 auto", minWidth: "0" }}>
<h4 style={{ margin: "0", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>أكمل الحجز</h4>
<p style={{ margin: "0", fontSize: "var(--q-t5,15px)", lineHeight: "1.7", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))" }}>دفع آمن وتأكيد فوري على بريدك الإلكتروني وواتساب.</p>
</div>
</div>
<div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: "var(--q-s2,16px)" }}>
<span style={{ position: "relative", zIndex: "1", flex: "none", display: "grid", placeItems: "center", width: "28px", height: "28px", borderRadius: "999px", background: "var(--q-cyan,var(--qs-band,#049dc5))", color: "#fff", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "var(--q-t6,13px)", fontWeight: "700", lineHeight: "1" }}>3</span>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 auto", minWidth: "0" }}>
<h4 style={{ margin: "0", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>نتابع نحن الباقي</h4>
<p style={{ margin: "0", fontSize: "var(--q-t5,15px)", lineHeight: "1.7", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))" }}>تغيير موعد، أمتعة إضافية، أو تأشيرة — كلّم قصر المرايا وسنتولى الأمر.</p>
</div>
</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", background: "var(--qs-brand-soft,#e4f5fb)", border: "1px solid var(--qs-line-2,#bfe9f6)", borderRadius: "var(--tw-radius,16px)", padding: "24px 28px" }}>
<span style={{ flex: "none", width: "132px", height: "132px", borderRadius: "50%", background: "#fff", overflow: "hidden", display: "grid", placeItems: "center", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}><img src="/assets/mascot-skylo-passport-hq.webp" alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></span>
<p style={{ flex: "1", minWidth: "260px", fontSize: "18px", lineHeight: "1.75", color: "#1b93b8" }}>تحتاج مساعدة قبل الحجز؟ اتصل بالرقم المختصر <b>6393</b> أو راسلنا على واتساب، وسنرتب لك أفضل خيار سعراً وتوقيتاً.</p>
<button className="qa-btn qa-cyan" onClick={goContact}>تواصل معنا</button>
</div>
</section>
</div>
</>) : null}



{isVisas ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band,var(--qs-band,#34bbe1))", position: "relative", overflow: "hidden", paddingBottom: "96px" }}>
<div className="qa-sec qa-2col" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.06fr .94fr", gap: "8px", alignItems: "center", paddingBlock: "0" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<h1 style={{ fontSize: "54px", fontWeight: "700", lineHeight: "1.15", color: "#fff" }}>التأشيرات</h1>
<p style={{ fontSize: "20px", lineHeight: "1.55", color: "rgba(255,255,255,.92)", maxWidth: "620px" }}>اختر الدولة من الشريط أدناه لتظهر لك نوع التأشيرة ورسومها ومدة الإنجاز والمستندات المطلوبة.</p>
</div>

</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
<div style={{ position: "relative", zIndex: "2", marginTop: "-118px", display: "flex", background: "#fff", borderRadius: "var(--tw-radius,16px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<div style={{ flex: "none", width: "118px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "20px 10px", background: "var(--qs-brand-deep,#036f8c)", borderRadius: "var(--tw-radius,16px) 0 0 var(--tw-radius,16px)", position: "relative", overflow: "hidden" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineStart: "-30px", bottom: "-30px", width: "110px", opacity: ".14" }} />
<span style={{ position: "relative", display: "grid", placeItems: "center", width: "66px", height: "66px", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.6)", color: "#fff" }}>
<span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
<Icon name="stamp" size={15} />
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "13px", fontWeight: "500" }}>6393</span>
</span>
</span>
<span style={{ position: "relative", fontSize: "11px", fontWeight: "500", color: "rgba(255,255,255,.92)" }}>اتصل بنا</span>
<button type="button" onClick={openTrack} aria-label="تحقق من حالة طلبك" title="تحقق من حالة طلبك" style={{ position: "relative", display: "grid", placeItems: "center", width: "34px", height: "34px", marginTop: "2px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(255,255,255,.55)", background: "rgba(255,255,255,.16)", cursor: "pointer", padding: "0" }}>
<img src="/assets/mascot-skylo-head.webp" alt="سكايلو" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
</button>
</div>


<div style={{ flex: "1", display: "flex", flexDirection: "column", minWidth: "0" }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "12px 24px", borderBottom: "1px dashed var(--qs-line,#ececed)" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
<span style={{ fontSize: "15px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>طلب تأشيرة</span>
</span>
</div>

<div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch" }}>
<span style={{ position: "relative", flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "4px", padding: "16px 20px" }}>
<span style={{ fontSize: "12px", fontWeight: "500", color: "var(--qs-ink-3,#a6abb0)" }}>إلى أين تسافر؟</span>
<button type="button" onClick={toggleCountryPanel} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "0", padding: "0", fontFamily: "inherit", cursor: "pointer", textAlign: "start", width: "100%" }}>
<span aria-hidden="true" style={{ flex: "none", width: "24px", height: "24px", borderRadius: "50%", backgroundImage: `url(${country.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}></span>
<span style={{ flex: "1", minWidth: "0", fontSize: "18px", fontWeight: "700", color: "var(--qs-ink,#1d2733)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{country.name}</span>
<span aria-hidden="true" style={{ flex: "none", color: "var(--qs-ink-3,#a6abb0)", transform: chevronRotate, transition: "transform .18s" }}>
<Icon name="chevron-down" size={15} />
</span>
</button>
<span style={{ fontSize: "12px", color: "var(--qs-ink-3,#a6abb0)" }}>{typesLabel}</span>
{countryPanelOpen ? (<>
<div onClick={closeCountryPanel} style={{ position: "fixed", inset: "0", zIndex: "44", cursor: "default" }}></div>
<div style={{ position: "absolute", zIndex: "45", top: "calc(100% + 8px)", insetInlineStart: "0", width: "min(380px,92vw)", background: "#fff", borderRadius: "var(--tw-radius,16px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", border: "1px solid var(--qs-line,#ececed)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
<div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: "1px solid var(--qs-line,#ececed)" }}>
<span aria-hidden="true" style={{ flex: "none", display: "grid", placeItems: "center", width: "30px", height: "30px", borderRadius: "50%", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#049dc5)" }}>
<Icon name="search" size={15} />
</span>
<input type="text" autoFocus={true} value={countryQuery} onChange={setCountryQuery} placeholder="اكتب اسم الدولة… تركيا، أمريكا، مصر" style={{ flex: "1", minWidth: "0", border: "0", background: "none", fontFamily: "inherit", fontSize: "15px", fontWeight: "600", color: "var(--qs-ink,#1d2733)", outline: "none" }} />
{countryQuery ? (<>
<button type="button" onClick={clearCountryQuery} aria-label="مسح" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", border: "0", background: "#f2f3f4", color: "var(--qs-ink-2,#5f666e)", cursor: "pointer" }}>
<Icon name="x" size={12} />
</button>
</>) : null}
</div>
<div style={{ maxHeight: "360px", overflowY: "auto", display: "flex", flexDirection: "column", padding: "8px" }}>
{noCountryMatch ? (<>
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center", padding: "24px 20px 10px" }}>
<span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: "56px", height: "56px", borderRadius: "50%", border: "2px dashed var(--qs-line-2,#cacbcc)", color: "var(--qs-ink-3,#a6abb0)", transform: "rotate(-6deg)" }}>
<Icon name="map-pinned" size={24} />
</span>
<span style={{ fontSize: "15px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>لم نجد "<span data-no-i18n="">{countryQuery}</span>" في قائمة تأشيراتنا</span>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)", lineHeight: "1.6" }}>جرّب هذه الدول المتاحة بدلاً منها</span>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "4px 8px 10px" }}>
{(suggestedCountries || []).map((sc, $index) => (<React.Fragment key={$index}>
<button type="button" onClick={sc.pick} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 10px", borderRadius: "var(--tw-radius-sm,10px)", border: "0", background: "#fff", cursor: "pointer", textAlign: "start", fontFamily: "inherit" }}>
<span aria-hidden="true" style={{ flex: "none", width: "30px", height: "30px", borderRadius: "50%", backgroundImage: `url(${sc.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}></span>
<span style={{ flex: "1", fontSize: "14px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>{sc.name}</span>
<span style={{ fontSize: "12px", color: "var(--qs-ink-3,#a6abb0)" }}>{sc.types}</span>
</button>
</React.Fragment>))}
</div>
</>) : null}
{hasCountryMatches ? (<>
{(filteredCountries || []).map((fc, $index) => (<React.Fragment key={$index}>
<button type="button" onClick={fc.pick} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 10px", borderRadius: "var(--tw-radius-sm,10px)", border: fc.border, background: fc.bg, cursor: "pointer", textAlign: "start", fontFamily: "inherit" }}>
<span aria-hidden="true" style={{ flex: "none", width: "34px", height: "34px", borderRadius: "50%", backgroundImage: `url(${fc.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}></span>
<span style={{ flex: "1", display: "flex", flexDirection: "column", gap: "1px", minWidth: "0" }}>
<span style={{ fontSize: "15px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{fc.name}</span>
<span style={{ fontSize: "12px", color: "var(--qs-ink-2,#5f666e)" }}>{fc.types}</span>
</span>
<span style={{ flex: "none", fontSize: "13px", fontWeight: "500", color: "var(--qs-brand-deep,#036f8c)" }}>من <span data-no-i18n="">{fc.fromFee}</span></span>
</button>
</React.Fragment>))}
</>) : null}
</div>
</div>
</>) : null}
</span>
<span style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "4px", padding: "16px 20px" }}>
<span style={{ fontSize: "12px", fontWeight: "500", color: "var(--qs-ink-3,#a6abb0)" }}>جنسيتك</span>
<span style={{ fontSize: "18px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>العراق</span>
<span style={{ fontSize: "12px", color: "var(--qs-ink-3,#a6abb0)" }}>بلد التقديم</span>
</span>
<span aria-hidden="true" style={{ flex: "none", width: "1px", alignSelf: "stretch", marginBlock: "12px", background: "#e2e5e7" }}></span>
<span style={{ flex: "1 1 150px", display: "flex", flexDirection: "column", gap: "4px", padding: "16px 20px" }}>
<span style={{ fontSize: "12px", fontWeight: "500", color: "var(--qs-ink-3,#a6abb0)" }}>تاريخ السفر المتوقع</span>
<input type="date" value={tripDate} onChange={setTripDate} dir="ltr" data-no-i18n="" style={{ width: "100%", appearance: "none", background: "transparent", border: "0", padding: "0", fontFamily: "inherit", fontSize: "16px", fontWeight: "700", color: "var(--qs-ink,#1d2733)", cursor: "pointer" }} />
<span style={{ fontSize: "12px", color: "var(--qs-ink-3,#a6abb0)" }}>الإصدار من {fromIssuing}</span>
</span>
<span aria-hidden="true" style={{ flex: "none", width: "1px", alignSelf: "stretch", marginBlock: "12px", background: "#e2e5e7" }}></span>
<span style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "4px", padding: "16px 20px" }}>
<span style={{ fontSize: "12px", fontWeight: "500", color: "var(--qs-ink-3,#a6abb0)" }}>عدد المسافرين</span>
<span style={{ display: "flex", alignItems: "center", gap: "14px" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
<span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
<button type="button" onClick={incTravellers} aria-label="أكثر بالغين" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-brand-deep,#036f8c)", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", lineHeight: "1", cursor: "pointer" }}>+</button>
<span data-no-i18n="" style={{ minWidth: "14px", textAlign: "center", fontSize: "16px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{travellersAr}</span>
<button type="button" onClick={decTravellers} aria-label="أقل بالغين" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-brand-deep,#036f8c)", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", lineHeight: "1", cursor: "pointer" }}>−</button>
<span style={{ fontSize: "12px", color: "var(--qs-ink-2,#5f666e)" }}>بالغ</span>
</span>
<span style={{ fontSize: "12px", color: "var(--qs-ink-3,#a6abb0)" }}>من <span data-no-i18n="">{fromAdult}</span> للبالغ</span>
</span>
<span aria-hidden="true" style={{ width: "1px", height: "20px", background: "var(--qs-line,#ececed)" }}></span>
<span style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
<span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
<button type="button" onClick={incChildren} aria-label="أكثر أطفال" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-brand-deep,#036f8c)", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", lineHeight: "1", cursor: "pointer" }}>+</button>
<span data-no-i18n="" style={{ minWidth: "14px", textAlign: "center", fontSize: "16px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{childrenAr}</span>
<button type="button" onClick={decChildren} aria-label="أقل أطفال" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-brand-deep,#036f8c)", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", lineHeight: "1", cursor: "pointer" }}>−</button>
<span style={{ fontSize: "12px", color: "var(--qs-ink-2,#5f666e)" }}>طفل</span>
</span>
<span style={{ fontSize: "12px", color: "var(--qs-ink-3,#a6abb0)" }}>من <span data-no-i18n="">{fromChild}</span> للطفل</span>
</span>
</span>
</span>
</div>

<div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "0 14px 14px", padding: "12px 20px", borderRadius: "var(--tw-radius,16px)", background: "var(--qs-brand-soft,#eaf8fd)" }}>
<span style={{ flex: "1", display: "flex", flexDirection: "column", gap: "2px" }}>
<span style={{ fontSize: "12px", fontWeight: "600", color: "#4ea9c6" }}>الإجمالي التقديري</span>
<span data-no-i18n="" style={{ fontSize: "23px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)" }}>{feeTotal}</span>
</span>
<button type="button" onClick={runVisaSearch} className="qa-btn qa-cyan" style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", fontSize: "15px" }}>
<Icon name="search" size={16} />
عرض التفاصيل
</button>
</div>
</div>
</div>

{isVisaDetail ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
<button type="button" onClick={closeVisaDetail} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", background: "none", border: "0", padding: "0", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}>
<Icon name="chevron-right" size={15} />
رجوع إلى النتائج
</button>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: "24px", alignItems: "start" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
<span aria-hidden="true" style={{ flex: "none", width: "52px", height: "52px", borderRadius: "50%", backgroundImage: `url(${country.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}></span>
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h2 style={{ margin: "0", fontSize: "27px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{country.name}</h2>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>{visa.typeName} · {stayLabel}</span>
</div>
</div>
<div style={{ position: "relative", height: "220px", borderRadius: "var(--tw-radius,18px)", overflow: "hidden", background: "var(--qs-brand-deep,#036f8c)" }}>
<span aria-hidden="true" style={{ position: "absolute", inset: "0", backgroundImage: `url(${country.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(18px) saturate(1.2)", opacity: ".55", transform: "scale(1.2)" }}></span>
<span aria-hidden="true" style={{ position: "absolute", inset: "0", background: "linear-gradient(to top,rgba(1,42,55,.72),rgba(1,42,55,.05))" }}></span>
<span aria-hidden="true" style={{ position: "absolute", insetInlineStart: "24px", top: "50%", transform: "translateY(-50%) rotate(-4deg)", width: "190px", height: "126px", borderRadius: "var(--tw-radius-sm,10px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", backgroundImage: `url(${country.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}></span>
<span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: "22px", top: "20px", display: "grid", placeItems: "center", width: "64px", height: "64px", borderRadius: "50%", border: "2px dashed rgba(255,255,255,.85)", color: "#fff", transform: "rotate(10deg)" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "13px", fontWeight: "500", letterSpacing: ".08em" }}>{country.upper}</span>
</span>
<span style={{ position: "absolute", insetInlineEnd: "22px", bottom: "18px", padding: "6px 14px", borderRadius: "999px", background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.4)", color: "#fff", fontSize: "13px", fontWeight: "500" }}>صورة التأشيرة</span>
</div>
{visa.isAppointment ? (<>
<div style={{ display: "flex", alignItems: "flex-start", gap: "14px", background: "#fef3dc", border: "1px solid #fdd27c", borderRadius: "var(--tw-radius,18px)", padding: "20px 24px" }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "44px", height: "44px", borderRadius: "50%", background: "#faab18", color: "#fff" }}><Icon name="calendar-check" size={20} /></span>
<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "#7a5200" }}>هذه خدمة موعد سفارة — وليست إصدار تأشيرة</span>
<p style={{ margin: "0", fontSize: "14px", lineHeight: "1.75", color: "#7a5200", textWrap: "pretty" }}>نحن لا نصدر تأشيرة أمريكا. نجهّز ملفك بالكامل — استمارة DS-160، الحجوزات، الترجمة — ونحجز لك موعد المقابلة في السفارة. عليك حضور الموعد شخصياً مع جوازك والمستندات الأصلية، والقرار النهائي يعود للسفارة وحدها.</p>
</div>
</div>
</>) : null}
<div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#fff", border: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", borderRadius: "var(--q-r,12px)", padding: "24px 24px" }}>
<h3 style={{ margin: "0", fontSize: "19px", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>بطاقة التأشيرة</h3>
<dl style={{ margin: "0", display: "flex", flexDirection: "column" }}>
{(cardRows || []).map((row, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "2px var(--q-s2,16px)", paddingBlock: "10px", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<dt style={{ fontSize: "var(--q-t5,15px)", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))" }}>{row.label}</dt>
<dd data-no-i18n={row.noI18n} style={{ margin: "0", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", textAlign: "end" }}>{row.value}</dd>
</div>
</React.Fragment>))}
</dl>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px" }}>
<h3 style={{ margin: "0", fontSize: "19px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>ما يشمله هذا النوع</h3>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
{(ticks || []).map((tk, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-sm,10px)", opacity: tk.opacity }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "30px", height: "30px", borderRadius: "50%", background: tk.bg, color: tk.ink }}><Icon name={tk.icon} size={14} /></span>
<span style={{ flex: "1", fontSize: "14px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>{tk.label}</span>
<span style={{ flex: "none", padding: "3px 10px", borderRadius: "999px", background: tk.tagBg, color: tk.tagInk, fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" }}>{tk.status}</span>
</div>
</React.Fragment>))}
</div>
{notGuaranteed ? (<>
<div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#fef3dc", border: "1px solid #fdd27c", borderRadius: "var(--tw-radius-sm,10px)", padding: "12px 14px", color: "#a06a00", fontSize: "14px", lineHeight: "1.6" }}><Icon name="info" size={15} /><span>الموافقة غير مضمونة لهذا النوع — سنطلب موافقتك على ذلك قبل الدفع.</span></div>
</>) : null}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px" }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
<h3 style={{ margin: "0", fontSize: "19px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>المستندات المطلوبة</h3>
<span style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" }}><span data-no-i18n="">{docCount}</span> بند</span>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
{(docRows || []).map((r, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-sm,10px)" }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "30px", height: "30px", borderRadius: "50%", background: "var(--qs-paper,#f8f7f8)", color: "var(--qs-ink-2,#5f666e)" }}><Icon name={r.icon} size={14} /></span>
<span style={{ flex: "1", display: "flex", flexDirection: "column", gap: "2px", minWidth: "0" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>{r.label}</span>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>{r.kindLabel} · {r.who}</span>
{r.rules ? (<><span style={{ fontSize: "13px", color: "var(--qs-brand-deep,#036f8c)" }}>{r.rules}</span></>) : null}
{r.condition ? (<><span style={{ fontSize: "13px", color: "#a06a00" }}>يظهر فقط إذا: <span data-no-i18n="">{r.condition}</span></span></>) : null}
</span>
<span style={{ flex: "none", padding: "3px 10px", borderRadius: "999px", background: r.tagBg, color: r.tagInk, fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" }}>{r.tagLabel}</span>
</div>
</React.Fragment>))}
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px" }}>
<h3 style={{ margin: "0", fontSize: "19px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>ملاحظات الحجز</h3>
<p style={{ margin: "0", fontSize: "14px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)", textWrap: "pretty" }}>{visa.notes}</p>
<span style={{ fontSize: "14px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)", paddingTop: "6px", borderTop: "1px solid var(--qs-line,#ececed)" }}>سياسة الاسترداد</span>
<p style={{ margin: "0", fontSize: "14px", lineHeight: "1.75", color: "var(--qs-body,#3d4650)", textWrap: "pretty" }}>{visa.refund}</p>
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "96px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px", boxShadow: "var(--tw-card-shadow,0 2px 8px rgba(29,39,51,.07))" }}>
<span style={{ fontSize: "16px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{visa.typeName} — {country.name}</span>
<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
<span style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}><span>مدة الإقامة</span><span style={{ color: "var(--qs-ink,#1d2733)", fontWeight: "600" }}>{visa.stay}</span></span>
<span style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}><span>مدة الإصدار</span><span style={{ color: "var(--qs-ink,#1d2733)", fontWeight: "600" }}>{visa.issuing}</span></span>
<span style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}><span>صلاحية قبل السفر</span><span style={{ color: "var(--qs-ink,#1d2733)", fontWeight: "600" }}>{visa.validity}</span></span>
</div>
<div style={{ display: "flex", gap: "16px", paddingTop: "10px", borderTop: "1px solid var(--qs-line,#ececed)" }}>
<div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "2px" }}>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>البالغ</span>
<span data-no-i18n="" style={{ fontSize: "22px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)" }}>{adultPrice}</span>
</div>
<div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "2px", paddingInlineStart: "16px", borderInlineStart: "1px solid var(--qs-line,#ececed)" }}>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>الطفل</span>
<span data-no-i18n="" style={{ fontSize: "22px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)" }}>{childPrice}</span>
</div>
</div>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}><span data-no-i18n="">{feeTotal}</span> الإجمالي لـ <span data-no-i18n="">{travellersAr}</span> بالغ و <span data-no-i18n="">{childrenAr}</span> طفل</span>
<button type="button" onClick={goVisaApplyDetail} className="qa-btn" style={{ justifyContent: "center", alignItems: "center", gap: "10px", fontSize: "16px", padding: "16px", background: "#25d366", color: "#fff", border: 0 }}>{WA_ICON}<span>تواصل معنا على واتساب للتقديم</span></button>
<span style={{ fontSize: "13px", color: "var(--qs-ink-3,#a6abb0)", textAlign: "center" }}>السعر بالدينار العراقي، ويُثبَّت عند تقديم الطلب.</span>
</div>
<div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "12px", background: "var(--qs-brand-deep,#036f8c)", borderRadius: "var(--tw-radius,18px)", padding: "24px", overflow: "hidden" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineEnd: "-40px", bottom: "-40px", width: "150px", opacity: ".14" }} />
<span style={{ fontSize: "15px", fontWeight: "700", color: "#fff" }}>لماذا قصر المرايا؟</span>
<span style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: "10px" }}>
<span data-no-i18n="" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,.2)", color: "#fff", fontSize: "11px", fontWeight: "500" }}>01</span>
<span style={{ fontSize: "14px", lineHeight: "1.7", color: "rgba(255,255,255,.94)" }}>مراجعة كاملة لمستنداتك قبل التقديم</span>
</span>
<span style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: "10px" }}>
<span data-no-i18n="" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,.2)", color: "#fff", fontSize: "11px", fontWeight: "500" }}>02</span>
<span style={{ fontSize: "14px", lineHeight: "1.7", color: "rgba(255,255,255,.94)" }}>متابعة حالة الطلب حتى الإصدار</span>
</span>
<span style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: "10px" }}>
<span data-no-i18n="" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", background: "#faab18", color: "#fff", fontSize: "11px", fontWeight: "500" }}>03</span>
<span style={{ fontSize: "14px", lineHeight: "1.7", color: "rgba(255,255,255,.94)" }}>دعم على مدار الساعة عبر 6393</span>
</span>
</div>
</div>
</div>
</div>
</>) : null}
{showSearchPrompt ? (<>
<button type="button" onClick={openTrack} style={{ position: "relative", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", justifyContent: "space-between", background: "var(--qs-band,#049dc5)", border: "0", borderRadius: "var(--tw-radius,18px)", padding: "20px 24px", boxShadow: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "start", width: "100%" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: "220px" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "#fff" }}>هل تقدمت بطلب تأشيرة معنا؟</span>
<span style={{ fontSize: "14px", color: "rgba(255,255,255,.88)" }}>اضغط هنا للتحقق من حالة طلبك برقم هاتفك أو رقم الطلب</span>
</span>
<span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#fff", fontSize: "15px", fontWeight: "700" }}>
تحقق من حالة طلبك
<Icon name="chevron-left" size={16} />
</span>
</button>
<div style={{ position: "relative", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", background: "var(--qs-brand-soft,#eaf8fd)", border: "1px solid var(--qs-line-2,#bfe9f6)", borderRadius: "var(--tw-radius,18px)", padding: "28px 28px", overflow: "hidden" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineEnd: "-40px", top: "-40px", width: "150px", opacity: ".18" }} />
<span aria-hidden="true" style={{ position: "relative", flex: "none", display: "grid", placeItems: "center", width: "64px", height: "64px", borderRadius: "50%", background: "#fff", border: "1px solid var(--qs-line-2,#bfe9f6)", color: "var(--qs-brand-deep,#049dc5)" }}>
<Icon name="stamp" size={26} />
</span>
<span style={{ position: "relative", flex: "1", minWidth: "220px", fontSize: "16px", lineHeight: "1.7", color: "#046f8c" }}>اختر دولتك وتاريخ سفرك أعلاه، ثم اضغط <b style={{ color: "var(--qs-brand-deep,#036f8c)" }}>"عرض التفاصيل"</b> لتظهر لك نتائج التأشيرة هنا.</span>
</div>
</>) : null}
{showResults ? (<>
<div data-visa-results="" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
<h3 style={{ margin: "0", fontSize: "20px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}><span data-no-i18n="">{resultCount}</span> تأشيرة متاحة لـ {country.name}</h3>
<div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
{(resultKinds || []).map((rk, $index) => (<React.Fragment key={$index}>
<button type="button" onClick={rk.go} style={{ padding: "8px 16px", borderRadius: "999px", fontFamily: "inherit", fontSize: "13px", fontWeight: "600", cursor: "pointer", background: rk.bg, color: rk.ink, border: `1px solid ${rk.border}` }}>{rk.label}</button>
</React.Fragment>))}
</div>
</div>
{country.isAppointment ? (<>
<div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fef3dc", border: "1px solid #fdd27c", borderRadius: "var(--tw-radius,18px)", padding: "14px 16px", color: "#7a5200", fontSize: "14px", lineHeight: "1.6" }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "36px", height: "36px", borderRadius: "50%", background: "#faab18", color: "#fff" }}><Icon name="calendar-check" size={16} /></span>
<span>لأمريكا لا نصدر تأشيرة — نجهّز ملفك ونحجز لك موعد المقابلة في السفارة، وعليك حضوره شخصياً.</span>
</div>
</>) : null}
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
{(results || []).map((result, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", flexWrap: "wrap", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", boxShadow: "var(--tw-card-shadow,0 2px 8px rgba(29,39,51,.07))", overflow: "hidden" }}>
<div style={{ position: "relative", flex: "none", width: "200px", minHeight: "150px", background: "var(--qs-brand-deep,#036f8c)" }}>
<span aria-hidden="true" style={{ position: "absolute", inset: "0", backgroundImage: `url(${result.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: ".9" }}></span>
<span aria-hidden="true" style={{ position: "absolute", inset: "0", background: "linear-gradient(to top,rgba(1,42,55,.6),rgba(1,42,55,0) 60%)" }}></span>
<span aria-hidden="true" style={{ position: "absolute", top: "10px", insetInlineEnd: "10px", display: "grid", placeItems: "center", width: "40px", height: "40px", borderRadius: "50%", border: "2px dashed rgba(255,255,255,.85)", color: "#fff", background: "rgba(1,42,55,.28)", transform: "rotate(-10deg)" }}>
<span style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "9px", fontWeight: "500", letterSpacing: ".06em" }} data-no-i18n="">{result.code}</span>
</span>
<span style={{ position: "absolute", bottom: "12px", insetInlineStart: "14px", color: "#fff", fontSize: "13px", fontWeight: "500" }}>{result.tierLabel}</span>
</div>
<div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "8px", padding: "16px 24px", minWidth: "0" }}>
<div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
<span style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" }}>{result.typeLabel}</span>
<span style={{ padding: "4px 12px", borderRadius: "999px", background: "var(--qs-paper,#f8f7f8)", color: "var(--qs-body,#3d4650)", fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" }}>{result.stayLabel}</span>
<span style={{ padding: "4px 12px", borderRadius: "999px", background: result.gBg, color: result.gInk, fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" }}>{result.gLabel}</span>
</div>
<h4 style={{ margin: "0", fontSize: "18px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{result.title}</h4>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px" }}>
{(result.ticks || []).map((tk, $index) => (<React.Fragment key={$index}>
<span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--qs-body,#3d4650)", whiteSpace: "nowrap" }}><span style={{ display: "grid", placeItems: "center", width: "20px", height: "20px", borderRadius: "50%", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#049dc5)" }}><Icon name={tk.icon} size={11} /></span>{tk.label}</span>
</React.Fragment>))}
</div>
<div style={{ display: "flex", flexWrap: "wrap", gap: "16px", paddingTop: "2px", fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>
<span>مدة الإصدار: <b style={{ color: "var(--qs-ink,#1d2733)" }}>{result.issuing}</b></span>
<span>صلاحية قبل السفر: <b style={{ color: "var(--qs-ink,#1d2733)" }}>{result.validity}</b></span>
<span>المستندات: <b style={{ color: "var(--qs-ink,#1d2733)" }} data-no-i18n="">{result.docCount}</b></span>
</div>
</div>
<div style={{ flex: "none", width: "190px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "16px 16px", background: "var(--qs-paper,#f8f7f8)" }}>
<span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
<span data-no-i18n="" style={{ fontSize: "20px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)" }}>{result.adult}</span>
<span style={{ fontSize: "12px", color: "var(--qs-ink-2,#5f666e)", whiteSpace: "nowrap" }}>للبالغ<span> · </span><span data-no-i18n="">{result.child}</span> للطفل</span>
</span>
<button type="button" onClick={result.view} className="qa-btn qa-cyan" style={{ width: "100%", justifyContent: "center", fontSize: "14px", padding: "12px" }}>عرض التفاصيل</button>
</div>
</div>
</React.Fragment>))}
{noResults ? (<>
<div style={{ padding: "24px", border: "1px dashed var(--qs-line-2,#cacbcc)", borderRadius: "var(--tw-radius,18px)", textAlign: "center", color: "var(--qs-ink-2,#5f666e)", fontSize: "14px" }}>لا توجد تأشيرة من هذا النوع لهذه الدولة حالياً.</div>
</>) : null}
</div>
{visaExportOn ? (<>
<div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "space-between", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "16px 20px", boxShadow: "var(--tw-card-shadow,0 2px 8px rgba(29,39,51,.07))" }}>
<span style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "220px" }}>
<span style={{ display: "grid", placeItems: "center", width: "38px", height: "38px", borderRadius: "50%", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#049dc5)" }}><Icon name="file-text" size={19} /></span>
<span style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
<span style={{ fontSize: "16px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>ملف تأشيرة {country.name}</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>انسخ التفاصيل أو حمّلها كملف PDF لمشاركتها</span>
</span>
</span>
<span style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
<button type="button" onClick={copyVisa} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "999px", border: "1px solid var(--qs-line-2,#bfe9f6)", background: "var(--qs-brand-soft,#eaf8fd)", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}>نسخ التفاصيل</button>
<button type="button" onClick={pdfVisa} className="qa-btn qa-cyan" style={{ padding: "12px 24px", fontSize: "14px" }}>تحميل PDF</button>
</span>
</div>
</>) : null}
<div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#fef3dc", border: "1px solid #fdd27c", borderRadius: "var(--tw-radius,18px)", padding: "16px 24px", color: "#c07f00", fontSize: "15px", fontWeight: "500", lineHeight: "1.5" }}>الأسعار بالدينار العراقي وتُثبَّت عند تقديم الطلب. المتطلبات يحدّثها فريقنا فور تغيّر تعليمات السفارات.</div>
</div>
</>) : null}
{showVisaRail ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", textAlign: "center" }}>
<span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: "52px", height: "52px", borderRadius: "50%", border: "2px dashed var(--qs-brand-deep,#049dc5)", color: "var(--qs-brand-deep,#049dc5)", transform: "rotate(-6deg)" }}><Icon name="map-pinned" size={22} /></span>
<span style={{ fontSize: "14px", fontWeight: "600", color: "#faab18" }}>الدول</span>
<h2 style={{ margin: "0", fontSize: "32px", fontWeight: "700", color: "var(--qs-brand-deep,#049dc5)" }}>الدول المتاحة للتأشيرة</h2>
<span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "999px", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "14px", fontWeight: "700" }}><span data-no-i18n="">{visaCount}</span> دولة · <span data-no-i18n="">{visaCardCount}</span> تأشيرة</span>
</div>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
{(visaTypes || []).map((vt, $index) => (<React.Fragment key={$index}>
<button className="qa-chip" onClick={vt.go} data-on={vt.on} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer", background: "#fff", color: "var(--qs-body,#3d4650)", border: "1px solid var(--qs-line-2,#cacbcc)", transition: "background .14s,color .14s,border-color .14s" }}>{vt.label}<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "13px", fontWeight: "500", opacity: ".62" }}>{vt.count}</span></button>
</React.Fragment>))}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
{(regionTiles || []).map((reg, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
<span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: "30px", height: "30px", borderRadius: "50%", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#049dc5)" }}><Icon name="map-pin" size={15} /></span>
<span style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{reg.label}</span>
<span aria-hidden="true" style={{ flex: "1", height: "1px", background: "var(--qs-line,#ececed)" }}></span>
<span style={{ fontSize: "13px", fontWeight: "500", color: "var(--qs-ink-3,#a6abb0)" }}><span data-no-i18n="">{reg.count}</span> دولة</span>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(196px,1fr))", gap: "16px" }}>
{(reg.items || []).map((t, $index) => (<React.Fragment key={$index}>
<button type="button" onClick={t.go} style={{ position: "relative", display: "flex", flexDirection: "column", gap: "0", padding: "0", overflow: "hidden", textAlign: "start", background: "#fff", border: t.border, borderRadius: "var(--tw-radius,18px)", boxShadow: t.shadow, cursor: "pointer", fontFamily: "inherit", transition: "border-color .14s,box-shadow .22s,transform .22s cubic-bezier(.2,.8,.3,1)" }}>
<span style={{ position: "relative", display: "block", height: "104px", background: "linear-gradient(150deg,#5fd0ef,var(--qs-band,#049dc5) 70%,var(--qs-brand-deep,#036f8c))" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineEnd: "-18px", top: "-14px", height: "118px", opacity: ".16" }} />
<span aria-hidden="true" style={{ position: "absolute", insetInlineStart: "16px", bottom: "-24px", width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#fff", backgroundImage: `url(${t.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center", border: "3px solid #fff", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}></span>
<span aria-hidden="true" style={{ position: "absolute", insetInlineEnd: "10px", top: "10px", display: "grid", placeItems: "center", width: "50px", height: "50px", borderRadius: "50%", border: "2px dashed rgba(255,255,255,.85)", color: "#fff", transform: "rotate(-8deg)" }}>
<span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: "1.1" }}><span data-no-i18n="" style={{ fontSize: "13px", fontWeight: "500" }}>{t.feeK}</span><span style={{ fontSize: "8px", fontWeight: "500", opacity: ".9" }}>ألف د.ع</span></span>
</span>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "32px 16px 16px" }}>
<span style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
<span style={{ fontSize: "18px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{t.name}</span>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "12px", fontWeight: "500", letterSpacing: ".08em", color: "var(--qs-ink-3,#a6abb0)" }}>{t.upper}</span>
</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>{t.types}</span>
<span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "4px", paddingTop: "10px", borderTop: "1px solid var(--qs-line,#ececed)" }}>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>الإصدار من {t.issuing}</span>
<span style={{ fontSize: "14px", fontWeight: "700", color: t.cta }}>{t.action}</span>
</span>
</span>
</button>
</React.Fragment>))}
</div>
</div>
</React.Fragment>))}
</div>
</div>
</>) : null}

{stepsOn ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "var(--q-s3)", background: "#fff", border: "1px solid var(--qs-line,#e6e9eb)", borderRadius: "12px", padding: "var(--q-s4)", marginTop: "8px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "start" }}>
<span style={{ fontSize: "13px", fontWeight: "500", color: "var(--qs-brand-deep,#049dc5)" }}>من الاختيار إلى التحميل</span>
<h2 style={{ margin: "0", fontSize: "30px", fontWeight: "700", color: "var(--qs-ink,#1d2733)", lineHeight: "1.25" }}>كيف تُباع التأشيرة وتُنجز؟</h2>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "var(--q-s3)" }}>
{(flowSteps || []).map((sg, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
<div style={{ position: "relative", alignSelf: "stretch", flex: "none", width: "clamp(28px,3.4vw,36px)" }}>
<span data-no-i18n="" style={{ position: "relative", zIndex: "1", display: "flex", alignItems: "center", justifyContent: "center", width: "clamp(28px,3.4vw,36px)", height: "clamp(28px,3.4vw,36px)", borderRadius: "999px", background: "var(--qs-band,#049dc5)", color: "#fff", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "clamp(13px,1.1vw,15px)", fontWeight: "700", lineHeight: "1" }}>{sg.n}</span>
{$index < (flowSteps || []).length - 1 ? (<span aria-hidden="true" style={{ position: "absolute", insetInlineStart: "calc(50% - 1px)", top: "clamp(28px,3.4vw,36px)", bottom: "calc(-1 * var(--q-s3))", width: "2px", background: "var(--qs-line,#e6e9eb)" }} />) : null}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1 1 auto", minWidth: "0", paddingTop: "3px" }}>
<h3 style={{ margin: "0", fontSize: "var(--q-t3)", fontWeight: "700", color: "var(--qs-ink,#1d2733)", lineHeight: "1.3" }}>{sg.title}</h3>
{(sg.items || []).map((it, $i) => (<React.Fragment key={$i}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px", minWidth: "0" }}>
<span style={{ flex: "none", padding: "2px 8px", borderRadius: "999px", background: it.roleBg, color: it.roleInk, fontSize: "12px", fontWeight: "500" }}>{it.role}</span>
{it.title ? (<span style={{ fontSize: "15px", fontWeight: "600", color: "var(--qs-body,#3d4650)" }}>{it.title}</span>) : null}
<span style={{ fontSize: "14px", lineHeight: "1.6", color: "var(--qs-ink-2,#5f666e)" }}>{it.hint}</span>
</div>
{(it.outcomes || []).map((o, $o) => (<React.Fragment key={$o}>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px", paddingInlineStart: "10px", minWidth: "0" }}>
<span style={{ flex: "none", fontSize: "13px", fontWeight: "500", color: "var(--qs-ink-3,#9aa0a6)" }}>{o.lead}</span>
<span style={{ fontSize: "15px", fontWeight: "600", color: "var(--qs-body,#3d4650)" }}>{o.text}</span>
</div>
</React.Fragment>))}
</React.Fragment>))}
{sg.note ? (<p style={{ margin: "0", fontSize: "14px", fontWeight: "600", lineHeight: "1.6", color: "var(--qs-body,#3d4650)" }}>{sg.note}</p>) : null}
</div>
</div>
</React.Fragment>))}
</div>
<p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "var(--qs-ink-2,#5f666e)" }}>الخطوات لا تتغير — ما يتغير هو المحتوى: الدول والمستندات والأسعار والحالات.</p>
</div>
</>) : null}
</section>
</div>
</>) : null}

{isPackages ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band,var(--qs-band,#34bbe1))", position: "relative", overflow: "hidden", paddingBottom: "70px" }}>
<div className="qa-sec" style={{ position: "relative", paddingBlock: "0" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<h1 style={{ fontSize: "54px", fontWeight: "700", lineHeight: "1.15", color: "#fff" }}>الباقات والجولات</h1>
<p style={{ fontSize: "20px", lineHeight: "1.55", color: "rgba(255,255,255,.92)", maxWidth: "620px" }}>كل باقة تُبنى حول مجموعة محددة — عائلية، شبابية، رجال أعمال، أو حج وعمرة — ولكل مجموعة برنامجها وإيقاعها وميزانيتها.</p>
</div>
</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
<div style={{ position: "relative", zIndex: "2", marginTop: "-96px", display: "flex", flexDirection: "column", gap: "16px", background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px 24px", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
{(groups || []).map((g, $index) => (<React.Fragment key={$index}>
<button className="qa-chip" onClick={g.go} data-on={g.on} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "999px", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer", background: "#fff", color: "var(--qs-body,#3d4650)", border: "1px solid var(--qs-line-2,#cacbcc)", transition: "background .14s,color .14s,border-color .14s,transform .22s cubic-bezier(.2,.8,.3,1)" }}>{g.label}<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "13px", fontWeight: "500", opacity: ".62" }}>{g.count}</span></button>
</React.Fragment>))}
</div>
<div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", gap: "0", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,16px)", overflow: "hidden" }}>
<span style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: "3px", padding: "14px 16px", borderInlineEnd: "1px solid var(--qs-line,#ececed)" }}>
<span style={{ fontSize: "12px", fontWeight: "600", color: "var(--qs-ink-2,#5f666e)" }}>إلى أين تريد السفر؟</span>
<input type="text" value={hotelQuery} onChange={setHotelQuery} placeholder="ابحث عن وجهة أو باقة" style={{ border: "0", padding: "0", background: "transparent", fontFamily: "inherit", fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }} />
</span>
<span style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "3px", padding: "14px 16px", borderInlineEnd: "1px solid var(--qs-line,#ececed)" }}>
<span style={{ fontSize: "12px", fontWeight: "600", color: "var(--qs-ink-2,#5f666e)" }}>عدد المسافرين</span>
<span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
<button type="button" onClick={incTravellers} aria-label="أكثر" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-brand-deep,#036f8c)", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", lineHeight: "1", cursor: "pointer" }}>+</button>
<span data-no-i18n="" style={{ minWidth: "14px", textAlign: "center", fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{travellersAr}</span>
<button type="button" onClick={decTravellers} aria-label="أقل" style={{ flex: "none", display: "grid", placeItems: "center", width: "24px", height: "24px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-brand-deep,#036f8c)", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", lineHeight: "1", cursor: "pointer" }}>−</button>
</span>
</span>
<span style={{ flex: "1 1 180px", display: "flex", flexDirection: "column", gap: "3px", padding: "14px 16px", borderInlineEnd: "1px solid var(--qs-line,#ececed)", cursor: "pointer" }}>
<span style={{ fontSize: "12px", fontWeight: "600", color: "var(--qs-ink-2,#5f666e)" }}>نوع الغرفة</span>
<select value={roomType} onChange={setRoomType} style={{ appearance: "none", background: "transparent", border: "0", padding: "0", fontFamily: "inherit", fontSize: "16px", fontWeight: "700", color: "var(--qs-ink,#1d2733)", cursor: "pointer" }}>
<option value="مزدوجة">غرفة مزدوجة</option>
<option value="مفردة">غرفة مفردة</option>
<option value="ثلاثية">غرفة ثلاثية</option>
<option value="جناح">جناح عائلي</option>
</select>
</span>
<button type="button" onClick={scrollToPackages} className="qa-btn qa-cyan" style={{ flex: "none", margin: "8px", justifyContent: "center", gap: "8px" }}>
<Icon name="search" size={17} />
استعرض الباقات
</button>
</div>
</div>
{noPackages ? (<>
<div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#fff", border: "1px dashed var(--qs-line-2,#bfe9f6)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px", fontSize: "16px", color: "var(--qs-ink-2,#5f666e)" }}>لا توجد باقات جاهزة لهذه المجموعة حاليًا — أخبرنا بتفاصيل رحلتك وسنبنيها لك.</div>
</>) : null}
{hasFeatured ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>الأكثر طلباً في {groupLabel}</span>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "16px" }}>
{(featured || []).map((f, $index) => (<React.Fragment key={$index}>
<button type="button" onClick={f.go} style={{ position: "relative", display: "flex", flexDirection: "column", height: "190px", padding: "16px", border: "0", borderRadius: "var(--tw-radius,18px)", background: f.gradient, cursor: "pointer", textAlign: "start", overflow: "hidden", fontFamily: "inherit" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineEnd: "-30px", bottom: "-30px", width: "150px", opacity: ".14" }} />
<span style={{ alignSelf: "flex-end", display: "grid", placeItems: "center", width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,.9)", color: "#d2324f" }}>
<Icon name="heart" size={15} />
</span>
<span style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "4px", position: "relative" }}>
<span style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "#c07f00", fontSize: "12px", fontWeight: "500" }}>
<Icon name="star" size={12} />
{f.rating}
</span>
<span style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>{f.title}</span>
<span style={{ fontSize: "14px", color: "rgba(255,255,255,.85)" }}>{f.destination} · {f.nights}</span>
</span>
</button>
</React.Fragment>))}
</div>
</div>
</>) : null}
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>جميع باقات {groupLabel}</span>
{exportOn ? (<>
<div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
<button type="button" onClick={copyGroup} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 20px", borderRadius: "999px", border: "1px solid var(--qs-line-2,#bfe9f6)", background: "var(--qs-brand-soft,#eaf8fd)", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}>نسخ الباقات</button>
<button type="button" onClick={pdfGroup} className="qa-btn qa-cyan" style={{ padding: "12px 24px", fontSize: "14px" }}>تحميل PDF</button>
</div>
</>) : null}
</div>
<div data-packages-grid="" className="qa-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))" }}>
{(packages || []).map((pkg, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<PackageCard title={pkg.title} destination={pkg.destination} nights={pkg.nights} groupType={pkg.groupType} departs={pkg.departs} price={pkg.price} includes={pkg.includes} badge={pkg.badge} onDetails={pkg.onDetails} />
<button type="button" onClick={pkg.toggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "12px 16px", borderRadius: "var(--tw-radius-sm,10px)", border: "1px solid var(--qs-line-2,#bfe9f6)", background: "var(--qs-brand-soft,#eaf8fd)", fontFamily: "inherit", fontSize: "14px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}>
<span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
<span style={{ display: "grid", placeItems: "center", width: "26px", height: "26px", borderRadius: "50%", background: "var(--qs-band,#049dc5)", color: "#fff" }}>
<Icon name="plane-takeoff" size={14} />
</span>
تفاصيل الطيران والفندق والتواريخ
</span>
<span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: "26px", height: "26px", borderRadius: "50%", background: "#fff", border: "1px solid var(--qs-line-2,#bfe9f6)", transform: `rotate(${pkg.chevRot}deg)`, transition: "transform .2s" }}>
<Icon name="chevron-down" size={14} />
</span>
</button>
{pkg.open ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "0", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-sm,10px)", overflow: "hidden", background: "#fff" }}>
<div style={{ display: "flex", borderBottom: "1px solid var(--qs-line,#ececed)" }}>
{(pkg.tabs || []).map((tb, $index) => (<React.Fragment key={$index}>
<button type="button" onClick={tb.go} data-on={tb.on} style={{ flex: "1", padding: "12px 8px", border: "0", background: tb.bg, fontFamily: "inherit", fontSize: "13px", fontWeight: "700", color: tb.ink, cursor: "pointer", borderBottom: `2px solid ${tb.underline}` }}>{tb.label}</button>
</React.Fragment>))}
</div>
<div style={{ padding: "16px 16px" }}>
{pkg.tabHotel ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<div style={{ height: "120px", borderRadius: "var(--tw-radius-sm,10px)", overflow: "hidden", background: "linear-gradient(150deg,#5fd0ef,var(--qs-band,#049dc5) 70%,var(--qs-brand-deep,#036f8c))", display: "grid", placeItems: "center", color: "#fff" }}>
<Icon name="image" size={26} />
</div>
<span style={{ fontSize: "15px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{pkg.hotel.name}</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>{pkg.hotel.location}</span>
<div style={{ display: "flex", flexWrap: "wrap", gap: "6px", paddingTop: "2px" }}>
{(pkg.hotel.amenities || []).map((am, $index) => (<React.Fragment key={$index}>
<span style={{ padding: "4px 10px", borderRadius: "999px", background: "var(--qs-paper,#f8f7f8)", color: "var(--qs-body,#3d4650)", fontSize: "12px", fontWeight: "600" }}>{am}</span>
</React.Fragment>))}
</div>
</div>
</>) : null}
{pkg.tabFlight ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px 14px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-sm,10px)" }}>
<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
<span style={{ display: "grid", placeItems: "center", width: "28px", height: "28px", borderRadius: "50%", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#049dc5)" }}>
<Icon name="plane-takeoff" size={14} />
</span>
<span style={{ fontSize: "13px", fontWeight: "500", color: "var(--qs-ink-2,#5f666e)" }}>ذهاب · {pkg.flight.airline}</span>
</div>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "1px" }}><span data-no-i18n="" style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{pkg.flight.outTime}</span><span data-no-i18n="" style={{ fontSize: "12px", color: "var(--qs-ink-2,#5f666e)" }}>BGW</span></span>
<span aria-hidden="true" style={{ flex: "1", height: "1px", background: "repeating-linear-gradient(to left,var(--qs-line-2,#bfe9f6) 0 6px,transparent 6px 12px)", margin: "0 8px" }}></span>
<span style={{ display: "flex", flexDirection: "column", gap: "1px", textAlign: "end" }}><span data-no-i18n="" style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{pkg.flight.arrTime}</span><span data-no-i18n="" style={{ fontSize: "12px", color: "var(--qs-ink-2,#5f666e)" }}>{pkg.flight.code}</span></span>
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px 14px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-sm,10px)" }}>
<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
<span style={{ display: "grid", placeItems: "center", width: "28px", height: "28px", borderRadius: "50%", background: "#fef3dc", color: "#c07f00" }}>
<Icon name="plane-landing" size={14} />
</span>
<span style={{ fontSize: "13px", fontWeight: "500", color: "var(--qs-ink-2,#5f666e)" }}>عودة · {pkg.flight.airline}</span>
</div>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "1px" }}><span data-no-i18n="" style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{pkg.flight.retOutTime}</span><span data-no-i18n="" style={{ fontSize: "12px", color: "var(--qs-ink-2,#5f666e)" }}>{pkg.flight.code}</span></span>
<span aria-hidden="true" style={{ flex: "1", height: "1px", background: "repeating-linear-gradient(to left,var(--qs-line-2,#bfe9f6) 0 6px,transparent 6px 12px)", margin: "0 8px" }}></span>
<span style={{ display: "flex", flexDirection: "column", gap: "1px", textAlign: "end" }}><span data-no-i18n="" style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{pkg.flight.retArrTime}</span><span data-no-i18n="" style={{ fontSize: "12px", color: "var(--qs-ink-2,#5f666e)" }}>BGW</span></span>
</div>
</div>
<span style={{ fontSize: "13px", color: "var(--qs-ink-3,#a6abb0)" }}>رحلة مباشرة · {pkg.nights}</span>
</div>
</>) : null}
{pkg.tabDates ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<span style={{ fontSize: "14px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{pkg.calendar.label}</span>
<div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "4px" }}>
{(pkg.calendar.dow || []).map((dw, $index) => (<React.Fragment key={$index}>
<span data-no-i18n="" style={{ textAlign: "center", fontSize: "11px", fontWeight: "500", color: "var(--qs-ink-3,#a6abb0)" }}>{dw}</span>
</React.Fragment>))}
{(pkg.calendar.cells || []).map((cd, $index) => (<React.Fragment key={$index}>
<span data-no-i18n="" style={{ textAlign: "center", padding: "8px 0", borderRadius: "var(--tw-radius-xs,8px)", fontSize: "13px", fontWeight: cd.w, background: cd.bg, color: cd.ink }}>{cd.n}</span>
</React.Fragment>))}
</div>
<span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}><span aria-hidden="true" style={{ width: "10px", height: "10px", borderRadius: "3px", background: "var(--qs-band,#049dc5)" }}></span>مواعيد انطلاق متاحة</span>
</div>
</>) : null}
</div>
</div>
</>) : null}
{exportOn ? (<>
<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
<button type="button" onClick={pkg.copy} style={{ flex: "1", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 14px", borderRadius: "999px", border: "1px solid var(--qs-line-2,#bfe9f6)", background: "var(--qs-brand-soft,#eaf8fd)", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}>نسخ التفاصيل</button>
<button type="button" onClick={pkg.pdf} style={{ flex: "1", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "10px 14px", borderRadius: "999px", border: "1px solid var(--qs-line,#ececed)", background: "#fff", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", color: "var(--qs-ink,#1d2733)", cursor: "pointer" }}>PDF للباقة</button>
</div>
</>) : null}
</div>
</React.Fragment>))}
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>فعاليات وحفلات قادمة</span>
<span style={{ padding: "4px 12px", borderRadius: "999px", background: "#fef3dc", color: "#c07f00", fontSize: "13px", fontWeight: "500" }}>قريباً</span>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "16px" }}>
{(upcomingEvents || []).map((ev, $index) => (<React.Fragment key={$index}>
<button type="button" onClick={ev.go} style={{ position: "relative", display: "flex", flexDirection: "column", height: "190px", padding: "16px", border: "0", borderRadius: "var(--tw-radius,18px)", background: ev.gradient, cursor: "pointer", textAlign: "start", overflow: "hidden", fontFamily: "inherit" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineEnd: "-30px", bottom: "-30px", width: "150px", opacity: ".14" }} />
<span style={{ alignSelf: "flex-end", display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "#c07f00", fontSize: "12px", fontWeight: "500" }}>قريباً</span>
<span style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "4px", position: "relative" }}>
<span style={{ display: "grid", placeItems: "center", width: "34px", height: "34px", borderRadius: "50%", background: "rgba(255,255,255,.22)", color: "#fff", marginBottom: "4px" }}>
<Icon name={ev.icon} size={16} />
</span>
<span style={{ fontSize: "18px", fontWeight: "700", color: "#fff" }}>{ev.title}</span>
<span style={{ fontSize: "14px", color: "rgba(255,255,255,.85)" }}>{ev.subtitle}</span>
</span>
</button>
</React.Fragment>))}
</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", background: "var(--qs-brand-soft,#e4f5fb)", border: "1px solid var(--qs-line-2,#bfe9f6)", borderRadius: "var(--tw-radius,16px)", padding: "24px 28px" }}>
<img src="/assets/mascot-skylo-suit.webp" alt="" style={{ height: "130px", width: "auto" }} />
<p style={{ flex: "1", minWidth: "260px", fontSize: "18px", lineHeight: "1.75", color: "#046f8c" }}>لا تجد ما يناسبك؟ أخبرنا بعدد المسافرين والوجهة والميزانية، وسنبني لك باقة خاصة من الصفر.</p>
<button className="qa-btn qa-amber" onClick={e => { if(e) e.preventDefault(); router.push('/contact?topic=package'); }}>اطلب باقة مخصصة</button>
</div>
</section>
</div>
</>) : null}

{isVisaApply ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineEnd: "-40px", bottom: "-56px", height: "180px", opacity: "var(--tw-mark,.16)" }} />
<div className="qa-sec" style={{ position: "relative", display: "flex", flexDirection: "column", gap: "14px", paddingBlock: "16px 24px" }}>
<a href="#" onClick={goVisas} style={{ fontSize: "13px", fontWeight: "600", color: "rgba(255,255,255,.85)", textDecoration: "none" }}>← رجوع إلى التأشيرات</a>
<div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
<span aria-hidden="true" style={{ flex: "none", width: "46px", height: "46px", borderRadius: "50%", backgroundImage: `url(${country.flagUrl})`, backgroundSize: "cover", backgroundPosition: "center", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}></span>
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<h1 style={{ fontSize: "27px", fontWeight: "700", color: "#fff" }}>طلب تأشيرة — {country.name}</h1>
<span style={{ fontSize: "14px", color: "rgba(255,255,255,.9)" }}>{visa.typeName} · {stayLabel} · {issuingLabel}</span>
</div>
</div>
<div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", paddingTop: "6px" }}>
{(appSteps || []).map((s, $index) => (<React.Fragment key={$index}>
<span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 14px 6px 8px", borderRadius: "999px", background: s.bg, color: s.ink, fontSize: "13px", fontWeight: "700", border: `1px solid ${s.border}`, whiteSpace: "nowrap" }}>
<span data-no-i18n="" style={{ display: "grid", placeItems: "center", width: "22px", height: "22px", borderRadius: "50%", background: s.dotBg, color: s.dotInk, fontSize: "12px" }}>{s.n}</span>{s.label}
</span>
</React.Fragment>))}
</div>
</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "28px" }}>

{appForm ? (<>
{visa.isAppointment ? (<>
<div style={{ display: "flex", alignItems: "flex-start", gap: "14px", background: "#fef3dc", border: "1px solid #fdd27c", borderRadius: "var(--tw-radius,18px)", padding: "16px 24px" }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "40px", height: "40px", borderRadius: "50%", background: "#faab18", color: "#fff" }}><Icon name="calendar-check" size={18} /></span>
<div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
<span style={{ fontSize: "16px", fontWeight: "700", color: "#7a5200" }}>هذه خدمة موعد سفارة — وليست إصدار تأشيرة</span>
<span style={{ fontSize: "14px", lineHeight: "1.7", color: "#7a5200" }}>نجهّز ملفك ونحجز لك موعد المقابلة. حضورك الشخصي في السفارة إلزامي، والقرار النهائي يعود للسفارة وحدها.</span>
</div>
</div>
</>) : null}
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: "24px", alignItems: "start" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px" }}>
<h3 style={{ margin: "0", fontSize: "19px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>بيانات التواصل</h3>
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "12px" }}>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--qs-body,#3d4650)" }}><span style={{ display: "flex", gap: "4px" }}>رقم الهاتف <span style={{ color: "#d2324f" }}>*</span></span>
<input type="tel" dir="ltr" data-keep-dir="" value={appPhone} onChange={setAppPhone} placeholder="07xx xxx xxxx" style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink,#1d2733)", outline: "none" }} />
</label>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--qs-body,#3d4650)" }}>البريد الإلكتروني (اختياري)
<input type="email" dir="ltr" data-keep-dir="" value={appEmail} onChange={setAppEmail} placeholder="name@example.com" style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink,#1d2733)", outline: "none" }} />
</label>
</div>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>نستخدم رقم هاتفك لربط الطلب بحسابك ومتابعته — تأكد من صحته.</span>
</div>

{(travellersList || []).map((tv, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
<span data-no-i18n="" style={{ flex: "none", display: "grid", placeItems: "center", width: "36px", height: "36px", borderRadius: "50%", background: "var(--qs-band,#049dc5)", color: "#fff", fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "14px", fontWeight: "700" }}>{tv.n}</span>
<span style={{ flex: "1", display: "flex", alignItems: "center", gap: "8px", fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>مسافر <span data-no-i18n="">{tv.n}</span>
<span style={{ padding: "3px 10px", borderRadius: "999px", background: tv.kindBg, color: tv.kindInk, fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" }}>{tv.kindLabel}</span>
</span>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)", whiteSpace: "nowrap" }}><span data-no-i18n="">{tv.done}</span>/<span data-no-i18n="">{tv.total}</span> مكتمل</span>
{tv.canRemove ? (<>
<button type="button" onClick={tv.remove} style={{ background: "none", border: "0", padding: "4px 8px", fontFamily: "inherit", fontSize: "13px", color: "#d2324f", cursor: "pointer" }}>حذف</button>
</>) : null}
</div>
<label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600", color: "var(--qs-body,#3d4650)" }}><span style={{ display: "flex", gap: "4px" }}>الاسم الكامل كما في الجواز <span style={{ color: "#d2324f" }}>*</span></span>
<input type="text" value={tv.name} onChange={tv.setName} style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink,#1d2733)", outline: "none" }} />
</label>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
{(tv.lines || []).map((line, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px 14px", border: `1px solid ${line.border}`, borderRadius: "var(--tw-radius-sm,10px)", background: line.bg }}>
<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "28px", height: "28px", borderRadius: "50%", background: line.iconBg, color: line.iconInk }}><Icon name={line.icon} size={13} /></span>
<span style={{ flex: "1", display: "flex", flexDirection: "column", gap: "1px", minWidth: "0" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>{line.label}</span>
{line.rules ? (<><span style={{ fontSize: "13px", color: "var(--qs-brand-deep,#036f8c)" }}>{line.rules}</span></>) : null}
</span>
<span style={{ flex: "none", padding: "3px 10px", borderRadius: "999px", background: line.tagBg, color: line.tagInk, fontSize: "12px", fontWeight: "500", whiteSpace: "nowrap" }}>{line.tagLabel}</span>
</div>
{line.isUpload ? (<>
<label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", border: "1px dashed var(--qs-line-2,#bfe9f6)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", cursor: "pointer" }}>
<input type="file" onChange={line.pickFile} accept={line.accept} style={{ display: "none" }} />
<span style={{ display: "grid", placeItems: "center", width: "30px", height: "30px", borderRadius: "50%", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#049dc5)" }}><Icon name="send" size={14} /></span>
<span data-no-i18n={line.hasFile} style={{ flex: "1", fontSize: "14px", color: line.fileInk, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{line.fileLabel}</span>
<span style={{ fontSize: "13px", fontWeight: "500", color: "var(--qs-brand-deep,#036f8c)" }}>{line.fileAction}</span>
</label>
</>) : null}
{line.isText ? (<><input type="text" value={line.value} onChange={line.set} style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink,#1d2733)", outline: "none" }} /></>) : null}
{line.isNumber ? (<><input type="number" dir="ltr" data-keep-dir="" value={line.value} onChange={line.set} style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink,#1d2733)", outline: "none" }} /></>) : null}
{line.isDate ? (<><input type="date" dir="ltr" data-keep-dir="" value={line.value} onChange={line.set} style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink,#1d2733)", outline: "none" }} /></>) : null}
{line.isChoice ? (<>
<select value={line.value} onChange={line.set} style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink,#1d2733)", outline: "none", cursor: "pointer" }}>
<option value="">اختر…</option>
{(line.options || []).map((op, $index) => (<React.Fragment key={$index}><option value={op.value}>{op.label}</option></React.Fragment>))}
</select>
</>) : null}
{line.isYesNo ? (<>
<div style={{ display: "flex", gap: "8px" }}>
<button type="button" onClick={line.yes} style={{ padding: "8px 24px", borderRadius: "999px", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer", background: line.yesBg, color: line.yesInk, border: `1px solid ${line.yesBorder}` }}>نعم</button>
<button type="button" onClick={line.no} style={{ padding: "8px 24px", borderRadius: "999px", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", cursor: "pointer", background: line.noBg, color: line.noInk, border: `1px solid ${line.noBorder}` }}>لا</button>
</div>
</>) : null}
{line.isRepeat ? (<>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
{(line.items || []).map((it, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
<input type="text" value={it.value} onChange={it.set} style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink,#1d2733)", outline: "none" }} />
<button type="button" onClick={it.remove} aria-label="حذف" style={{ flex: "none", display: "grid", placeItems: "center", width: "34px", height: "34px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-ink-2,#5f666e)", cursor: "pointer" }}><Icon name="x" size={13} /></button>
</div>
</React.Fragment>))}
<button type="button" onClick={line.add} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "999px", border: "1px solid var(--qs-line-2,#bfe9f6)", background: "var(--qs-brand-soft,#eaf8fd)", fontFamily: "inherit", fontSize: "13px", fontWeight: "600", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}>+ إضافة</button>
<span style={{ fontSize: "12px", color: "var(--qs-ink-3,#a6abb0)" }}>أضف بنداً لكل واحدة</span>
</div>
</>) : null}
</div>
</React.Fragment>))}
</div>
</div>
</React.Fragment>))}

{askKind ? (<>
<div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", padding: "16px 24px", border: "1px dashed var(--qs-brand-deep,#049dc5)", borderRadius: "var(--tw-radius,18px)", background: "var(--qs-brand-soft,#eaf8fd)" }}>
<span style={{ flex: "1", minWidth: "200px", fontSize: "15px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)" }}>هل المسافر الجديد بالغ أم طفل؟</span>
<button type="button" onClick={addAdult} className="qa-btn qa-cyan" style={{ padding: "10px 24px", fontSize: "14px" }}>بالغ</button>
<button type="button" onClick={addChild} className="qa-btn qa-amber" style={{ padding: "10px 24px", fontSize: "14px" }}>طفل</button>
<button type="button" onClick={cancelAsk} style={{ background: "none", border: "0", fontFamily: "inherit", fontSize: "14px", color: "var(--qs-ink-2,#5f666e)", cursor: "pointer" }}>إلغاء</button>
</div>
</>) : null}
{notAsking ? (<>
<button type="button" onClick={openAsk} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", border: "1px dashed var(--qs-line-2,#cacbcc)", borderRadius: "var(--tw-radius,18px)", background: "#fff", fontFamily: "inherit", fontSize: "15px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}><Icon name="users" size={16} /> إضافة مسافر آخر</button>
</>) : null}
</div>

<div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "sticky", top: "96px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px", boxShadow: "var(--tw-card-shadow,0 2px 8px rgba(29,39,51,.07))" }}>
<h3 style={{ margin: "0", fontSize: "19px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>ملخص الطلب</h3>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>
{(priceRows || []).map((pr, $index) => (<React.Fragment key={$index}>
<span style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}><span><span data-no-i18n="">{pr.count}</span> × {pr.label}</span><span data-no-i18n="" style={{ color: "var(--qs-ink,#1d2733)", fontWeight: "600" }}>{pr.value}</span></span>
</React.Fragment>))}
<span style={{ display: "flex", justifyContent: "space-between", gap: "8px", paddingTop: "8px", borderTop: "1px solid var(--qs-line,#ececed)", fontSize: "16px", color: "var(--qs-ink,#1d2733)", fontWeight: "700" }}><span>الإجمالي</span><span data-no-i18n="" style={{ color: "var(--qs-brand-deep,#036f8c)" }}>{appTotal}</span></span>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
<span style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}><span>المستندات المطلوبة</span><span><span data-no-i18n="">{appDoneCount}</span>/<span data-no-i18n="">{appTotalLines}</span> مكتمل</span></span>
<span style={{ height: "6px", borderRadius: "999px", background: "var(--qs-line,#ececed)", overflow: "hidden" }}><span style={{ display: "block", height: "100%", width: appProgress, background: "var(--qs-band,#049dc5)", transition: "width .22s" }}></span></span>
</div>
{notGuaranteed ? (<>
<label style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px", borderRadius: "var(--tw-radius-sm,10px)", background: "#fef3dc", border: "1px solid #fdd27c", fontSize: "13px", lineHeight: "1.6", color: "#7a5200", cursor: "pointer" }}>
<input type="checkbox" checked={appAccept} onChange={toggleAccept} style={{ marginTop: "4px", width: "16px", height: "16px", accentColor: "var(--qs-brand-deep,#049dc5)" }} />
<span>أفهم أن الموافقة على هذه التأشيرة غير مضمونة، وأن الرسوم تخضع لسياسة الاسترداد المذكورة.</span>
</label>
</>) : null}
{appErrorOn ? (<>
<div style={{ padding: "10px 12px", borderRadius: "var(--tw-radius-sm,10px)", background: "#fdecef", border: "1px solid #f5b5c2", color: "#a3213b", fontSize: "13px", lineHeight: "1.6" }}>{appError}</div>
</>) : null}
<button type="button" onClick={submitApp} className="qa-btn qa-cyan" style={{ justifyContent: "center", fontSize: "16px", padding: "16px" }}>متابعة إلى الدفع</button>
<span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "13px", color: "var(--qs-ink-3,#a6abb0)" }}><Icon name="check" size={12} /> يُحفَظ تلقائياً — يمكنك المتابعة لاحقاً{appSavedAt ? (<> · <span data-no-i18n="">{appSavedAt}</span></>) : null}</span>
</div>
</div>
</div>
</>) : null}

{appPay ? (<>
<button type="button" onClick={backToForm} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", background: "none", border: "0", padding: "0", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}><Icon name="chevron-right" size={15} /> رجوع إلى المستندات</button>
<div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", justifyContent: "space-between", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>الإجمالي</span>
<span data-no-i18n="" style={{ fontSize: "26px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)" }}>{appTotal}</span>
</span>
<span style={{ flex: "1", minWidth: "240px", fontSize: "14px", lineHeight: "1.7", color: "var(--qs-body,#3d4650)" }}>ادفع لإرسال ملفك. بعد تأكيد الدفع واكتمال المستندات يُرسَل الملف تلقائياً إلى الجهة المصدرة.</span>
</div>
<PaymentMethods assetBase="/assets" />
</>) : null}

{appDone ? (<>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: "24px", alignItems: "start" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px" }}>
<span style={{ flex: "none", width: "72px", height: "72px", borderRadius: "50%", overflow: "hidden", border: "3px solid var(--qs-brand-soft,#eaf8fd)" }}><img src="/assets/mascot-skylo-head.webp" alt="سكايلو" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></span>
<div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "4px", minWidth: "220px" }}>
<h2 style={{ margin: "0", fontSize: "24px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>تم استلام طلبك</h2>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>رقم الطلب: <b data-no-i18n="" style={{ color: "var(--qs-brand-deep,#036f8c)", fontFamily: "'IBM Plex Sans',system-ui,sans-serif" }}>{appNo}</b></span>
</div>
<span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "14px", fontWeight: "700" }}><Icon name="clock" size={15} /> قيد المعالجة</span>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px" }}>
<h3 style={{ margin: "0", fontSize: "19px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>حالات طلبك</h3>
<p style={{ margin: "0", fontSize: "14px", lineHeight: "1.75", color: "var(--qs-body,#3d4650)" }}>بعد تأكيد الدفع واكتمال المستندات يُرسَل ملفك تلقائياً إلى الجهة المصدرة، ويتابعه فريقنا حتى الإصدار.</p>
<div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "6px" }}>
{(statusLegend || []).map((sl, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", border: `1px solid ${sl.border}`, borderRadius: "var(--tw-radius-sm,10px)", background: sl.bg }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "32px", height: "32px", borderRadius: "50%", background: sl.dotBg, color: sl.dotInk }}><Icon name={sl.icon} size={15} /></span>
<span style={{ flex: "1", display: "flex", flexDirection: "column", gap: "1px" }}><span style={{ fontSize: "14px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{sl.label}</span><span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>{sl.hint}</span></span>
{sl.now ? (<><span style={{ padding: "3px 10px", borderRadius: "999px", background: "var(--qs-band,#049dc5)", color: "#fff", fontSize: "12px", fontWeight: "500" }}>الآن</span></>) : null}
</div>
</React.Fragment>))}
</div>
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,18px)", padding: "24px 24px", boxShadow: "var(--tw-card-shadow,0 2px 8px rgba(29,39,51,.07))" }}>
<span style={{ fontSize: "16px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{visa.typeName} — {country.name}</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}><span data-no-i18n="">{appTravellerCount}</span> مسافر · <span data-no-i18n="">{appTotal}</span></span>
<button type="button" disabled={true} className="qa-btn" style={{ justifyContent: "center", fontSize: "15px", padding: "14px", background: "var(--qs-line,#ececed)", color: "var(--qs-ink-3,#a6abb0)", boxShadow: "none", cursor: "not-allowed" }}><Icon name="file-text" size={16} /> تحميل التأشيرة</button>
<span style={{ fontSize: "13px", color: "var(--qs-ink-3,#a6abb0)", textAlign: "center", marginTop: "-6px" }}>يُفعَّل عند رفع التأشيرة</span>
<button type="button" onClick={openTrack} className="qa-btn qa-cyan" style={{ justifyContent: "center", fontSize: "15px", padding: "14px" }}>تحقق من حالة طلبك</button>
<button type="button" onClick={goVisas} style={{ background: "none", border: "0", padding: "6px", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}>رجوع إلى التأشيرات</button>
</div>
</div>
</>) : null}
</section>
</div>
</>) : null}

{isJobs ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineEnd: "-150px", top: "-80px", height: "480px", opacity: ".1" }} />
<div className="qa-sec qa-2col" style={{ position: "relative", paddingBlock: "28px", display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)", gap: "36px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,.85)" }}>انضم إلى فريقنا</span>
<h1 style={{ fontSize: "clamp(34px,3.2vw,46px)", fontWeight: "700", color: "#fff", lineHeight: "1.16", textWrap: "pretty" }}>الوظائف والفرص المهنية</h1>
<p style={{ fontSize: "18px", lineHeight: "1.7", color: "rgba(255,255,255,.94)", maxWidth: "600px", textWrap: "pretty" }}>نبحث دائمًا عن أشخاص يحبون السفر ويجيدون خدمة الناس. إن وجدت نفسك في إحدى الفرص التالية، أرسل سيرتك الذاتية وسنتواصل معك.</p>
<div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", paddingTop: "4px" }}>
<a href="mailto:info@almarayagroup.com" className="qa-btn qa-amber" style={{ textDecoration: "none", fontSize: "17px", padding: "16px 28px" }}>أرسل سيرتك الذاتية</a>
<span data-no-i18n="" style={{ fontSize: "16px", color: "rgba(255,255,255,.9)" }}>info@almarayagroup.com</span>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "14px", marginTop: "4px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,.24)" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "26px", fontWeight: "700", color: "#faab18", lineHeight: "1" }}>04</span>
<span style={{ fontSize: "15px", color: "rgba(255,255,255,.86)" }}>فرص مفتوحة</span>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
<span style={{ fontSize: "26px", fontWeight: "700", color: "#faab18", lineHeight: "1" }}>بغداد</span>
<span style={{ fontSize: "15px", color: "rgba(255,255,255,.86)" }}>مقر العمل</span>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "26px", fontWeight: "700", color: "#faab18", lineHeight: "1" }}>48h</span>
<span style={{ fontSize: "15px", color: "rgba(255,255,255,.86)" }}>زمن الرد على طلبك</span>
</span>
</div>
</div>
<div data-jobs-art="" style={{ position: "relative", alignSelf: "stretch", minHeight: "430px" }}>
<span aria-hidden="true" className="qa-hero-decor" style={{ position: "absolute", left: "-36%", bottom: "-84px", width: "360px", height: "360px", animation: "qa-orbit 26s linear infinite" }}>
<span style={{ position: "absolute", inset: "0", borderRadius: "50%", border: "1px dashed rgba(255,255,255,.42)" }}></span>
<span style={{ position: "absolute", top: "-5px", left: "50%", width: "10px", height: "10px", marginLeft: "-5px", borderRadius: "50%", background: "#faab18" }}></span>
</span>
<span aria-hidden="true" className="qa-hero-decor" style={{ position: "absolute", left: "-27%", bottom: "-42px", width: "266px", height: "266px", animation: "qa-orbit-rev 34s linear infinite" }}>
<span style={{ position: "absolute", inset: "0", borderRadius: "50%", border: "1px solid rgba(255,255,255,.26)" }}></span>
<span style={{ position: "absolute", bottom: "-4px", left: "50%", width: "7px", height: "7px", marginLeft: "-3.5px", borderRadius: "50%", background: "rgba(255,255,255,.9)" }}></span>
</span>

<img src="/assets/mascot-skylo-recruit-phone-cut.webp" alt="سكايلو يستقبل طلبات التوظيف" className="qa-hero-mascot" style={{ position: "absolute", zIndex: "2", left: "-11%", bottom: "-30px", display: "block", width: "clamp(210px,62%,460px)", height: "auto", objectFit: "contain", filter: "drop-shadow(0 26px 38px rgba(1,42,55,.34))" }} />

<div aria-hidden="true" className="qa-hero-float" style={{ position: "absolute", zIndex: "4", top: "50%", right: "-18px", width: "clamp(186px,44%,246px)", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "stretch", gap: "14px", pointerEvents: "none" }}>
<div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", alignItems: "center", transformOrigin: "50% 0", animation: "qa-swing 5.6s ease-in-out infinite" }}>
<span style={{ width: "2px", height: "30px", background: "rgba(255,255,255,.6)" }}></span>
<span style={{ width: "26px", height: "8px", borderRadius: "3px", background: "rgba(255,255,255,.85)" }}></span>
<span style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", maxWidth: "230px", padding: "16px", background: "#fff", borderRadius: "var(--tw-radius,16px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "8px", fontWeight: "500", letterSpacing: ".2em", color: "var(--qs-ink-2,#5f666e)" }}>TEAM MEMBER</span>
<span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
<span style={{ flex: "none", width: "34px", height: "34px", borderRadius: "50%", background: "var(--qs-band,#049dc5)" }}></span>
<span style={{ display: "flex", flexDirection: "column", gap: "4px", flex: "1" }}>
<span style={{ height: "7px", borderRadius: "4px", background: "#d9edf5" }}></span>
<span style={{ height: "7px", width: "66%", borderRadius: "4px", background: "#eef1f2" }}></span>
</span>
</span>
<span style={{ alignSelf: "flex-start", whiteSpace: "nowrap", padding: "4px 12px", borderRadius: "999px", background: "#faab18", color: "#fff", fontSize: "12px", fontWeight: "500" }}>اسمك هنا</span>
</span>
</div>

<div style={{ alignSelf: "stretch", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
<span style={{ padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "14px", fontWeight: "700", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-chip 5.2s ease-in-out infinite" }}>مبيعات</span>
<span style={{ padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "14px", fontWeight: "700", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-chip 6.4s ease-in-out .8s infinite" }}>تسويق</span>
<span style={{ padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "14px", fontWeight: "700", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-chip 5.9s ease-in-out .4s infinite" }}>تأشيرات</span>
</div>

<div style={{ position: "relative", alignSelf: "center", width: "100%", maxWidth: "230px", padding: "16px 16px 16px", background: "#fff", borderRadius: "var(--tw-radius-sm,10px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-pop 6.8s ease-in-out infinite" }}>
<span style={{ position: "absolute", top: "-13px", left: "-13px", display: "grid", placeItems: "center", width: "34px", height: "34px", borderRadius: "50%", background: "var(--qs-band,#049dc5)", color: "#fff", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "8px", fontWeight: "500", letterSpacing: ".2em", color: "var(--qs-ink-2,#5f666e)" }}>CV</span>
<span style={{ height: "8px", width: "78%", borderRadius: "4px", background: "var(--qs-ink,#1d2733)", opacity: ".82" }}></span>
<span style={{ height: "6px", borderRadius: "4px", background: "#e7eaec" }}></span>
<span style={{ height: "6px", borderRadius: "4px", background: "#e7eaec" }}></span>
<span style={{ height: "6px", width: "54%", borderRadius: "4px", background: "var(--qs-line-2,#bfe9f6)" }}></span>
</span>
</div>
</div>
</div>
</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
<div style={{ maxWidth: "720px", display: "flex", flexDirection: "column", gap: "12px" }}>
<h2 style={{ fontSize: "34px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)" }}>الفرص المتاحة حاليًا</h2>
<p style={{ fontSize: "17px", lineHeight: "1.75", color: "var(--qs-ink-2,#5f666e)", textWrap: "pretty" }}>مقرّنا في بغداد، والمسميات بالإنجليزية كما تُنشر في إعلانات التوظيف.</p>
</div>
<div className="qa-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))" }}>
{(contentJobs || []).map((job) => (
<div key={job.id || job.title} className="qa-card" style={{ display: "flex", flexDirection: "column", gap: "14px", padding: "28px" }}>
<span style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "11px", fontWeight: "600", letterSpacing: ".12em", color: "#faab18" }}>{job.tag}</span>
<h4 style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "21px", fontWeight: "700", color: "var(--qs-ink,#1d2733)", lineHeight: "1.3" }}>{job.title}</h4>
<span style={{ fontSize: "15px", color: "var(--qs-ink-2,#5f666e)" }}>{job.location}</span>
<ul style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "0", paddingInlineStart: "16px", fontSize: "15px", lineHeight: "1.7", color: "var(--qs-body,#3d4650)" }}>{(job.bullets || []).map((b, i) => (<li key={i}>{b}</li>))}</ul>
{job.source === "odoo" ? (<button type="button" data-job={job.title} data-odoo={job.id} onClick={openApply} className="qa-btn qa-cyan" style={{ marginTop: "auto", alignSelf: "flex-start", fontFamily: "inherit", fontSize: "15px", padding: "12px 24px" }}>قدّم الآن ←</button>) : (<button type="button" data-job={job.title} onClick={openApply} style={{ marginTop: "auto", alignSelf: "flex-start", background: "none", border: "0", padding: "0", fontFamily: "inherit", fontSize: "15px", fontWeight: "600", color: "var(--qs-brand-deep,#22a9d4)", cursor: "pointer" }}>تقدَّم لهذه الوظيفة ←</button>)}
</div>
))}
</div>
</section>
</div>
</>) : null}

{isFaq ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<img src="/assets/logo-mark-white.webp" alt="" style={{ position: "absolute", insetInlineStart: "-140px", bottom: "-160px", height: "460px", opacity: ".1" }} />
<div className="qa-sec qa-2col" style={{ position: "relative", paddingBlock: "28px", display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)", gap: "36px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,.85)" }}>قبل أن تسأل</span>
<h1 style={{ fontSize: "clamp(34px,3.2vw,46px)", fontWeight: "700", color: "#fff", lineHeight: "1.16", textWrap: "pretty" }}>الأسئلة الشائعة</h1>
<p style={{ fontSize: "18px", lineHeight: "1.7", color: "rgba(255,255,255,.94)", maxWidth: "600px", textWrap: "pretty" }}>جمعنا لك أكثر ما يسألنا عنه المسافرون. إن لم تجد إجابتك هنا، اتصل بنا وسنجيبك فورًا.</p>
<div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", paddingTop: "4px" }}>
<a href="tel:6393" className="qa-btn qa-amber" style={{ textDecoration: "none", fontSize: "17px", padding: "16px 28px" }}>اتصل بالرقم المختصر 6393</a>
<span data-no-i18n="" style={{ fontSize: "16px", color: "rgba(255,255,255,.9)" }}>sales@almarayagroup.com</span>
</div>
<div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "14px", marginTop: "4px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,.24)" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "26px", fontWeight: "700", color: "#faab18", lineHeight: "1" }}>08</span>
<span style={{ fontSize: "15px", color: "rgba(255,255,255,.86)" }}>أسئلة متكررة</span>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "26px", fontWeight: "700", color: "#faab18", lineHeight: "1" }}>24/7</span>
<span style={{ fontSize: "15px", color: "rgba(255,255,255,.86)" }}>دعم على مدار الساعة</span>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "26px", fontWeight: "700", color: "#faab18", lineHeight: "1" }}>6393</span>
<span style={{ fontSize: "15px", color: "rgba(255,255,255,.86)" }}>الرقم المختصر</span>
</span>
</div>
</div>
<div data-faq-art="" style={{ position: "relative", alignSelf: "stretch", minHeight: "430px" }}>
<span aria-hidden="true" className="qa-hero-decor" style={{ position: "absolute", left: "-34%", bottom: "-64px", width: "344px", height: "344px", animation: "qa-orbit 28s linear infinite" }}>
<span style={{ position: "absolute", inset: "0", borderRadius: "50%", border: "1px dashed rgba(255,255,255,.42)" }}></span>
<span style={{ position: "absolute", top: "-5px", left: "50%", width: "10px", height: "10px", marginLeft: "-5px", borderRadius: "50%", background: "#faab18" }}></span>
</span>
<span aria-hidden="true" className="qa-hero-decor" style={{ position: "absolute", left: "-25%", bottom: "-28px", width: "256px", height: "256px", animation: "qa-orbit-rev 36s linear infinite" }}>
<span style={{ position: "absolute", inset: "0", borderRadius: "50%", border: "1px solid rgba(255,255,255,.26)" }}></span>
<span style={{ position: "absolute", bottom: "-4px", left: "50%", width: "7px", height: "7px", marginLeft: "-3.5px", borderRadius: "50%", background: "rgba(255,255,255,.9)" }}></span>
</span>

<img
  src="/assets/mascot-skylo-questions-cut.webp"
  alt="سكايلو يفكّر في أسئلتك"
  className="qa-hero-mascot"
  style={{
    position: "absolute", zIndex: "2", left: "-11%", bottom: "-30px", display: "block",
    width: "clamp(240px,64%,420px)", height: "auto", objectFit: "contain",
    filter: "drop-shadow(0 26px 38px rgba(1,42,55,.32))",
  }}
/>

<div aria-hidden="true" className="qa-hero-float" style={{ position: "absolute", zIndex: "4", top: "50%", right: "-18px", width: "clamp(186px,44%,246px)", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "stretch", gap: "14px", pointerEvents: "none" }}>
<div style={{ position: "relative", alignSelf: "stretch", padding: "12px 16px 16px", background: "#fff", borderRadius: "14px 14px 14px 4px", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-pop 6.4s ease-in-out infinite" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
<span style={{ fontSize: "14px", fontWeight: "700", color: "var(--qs-ink,#1d2733)", textWrap: "pretty" }}>كيف أحجز تذكرتي؟</span>
<span style={{ height: "6px", borderRadius: "4px", background: "#e7eaec" }}></span>
<span style={{ height: "6px", width: "62%", borderRadius: "4px", background: "var(--qs-line-2,#bfe9f6)" }}></span>
</span>
</div>

<div style={{ alignSelf: "stretch", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
<span style={{ padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "14px", fontWeight: "700", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-chip 5.4s ease-in-out infinite" }}>الحجز</span>
<span style={{ padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "14px", fontWeight: "700", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-chip 6.2s ease-in-out .7s infinite" }}>الدفع</span>
<span style={{ padding: "8px 14px", borderRadius: "999px", background: "rgba(255,255,255,.94)", color: "var(--qs-brand-deep,#036f8c)", fontSize: "14px", fontWeight: "700", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-chip 5.8s ease-in-out .35s infinite" }}>المتابعة</span>
</div>

<div style={{ position: "relative", alignSelf: "center", display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#fff", borderRadius: "var(--tw-radius-sm,10px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", animation: "qa-pop 7.2s ease-in-out .5s infinite" }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "34px", height: "34px", borderRadius: "50%", background: "#faab18", color: "#fff" }}>
<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"></path></svg>
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
<span data-no-i18n="" style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "8px", fontWeight: "500", letterSpacing: ".2em", color: "var(--qs-ink-2,#5f666e)" }}>HOTLINE</span>
<span data-no-i18n="" style={{ whiteSpace: "nowrap", fontSize: "17px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)" }}>6393</span>
</span>
</div>
</div>
</div>
</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
<div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "var(--q-read,720px)", marginInline: "auto", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
{(contentFaq || []).map((item, i) => (
<details key={item.id || item.q} style={{ paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }} open={i === 0}>
<summary style={{ cursor: "pointer", fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.5", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
<span>{item.q}</span>
<Icon name="chevron-down" size={16} style={{ flex: "none", color: "var(--q-ink-3,var(--qs-ink-3,#9aa0a6))" }} />
</summary>
<p style={{ margin: "10px 0 0", fontSize: "var(--q-t5,15px)", lineHeight: "1.8", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))", textWrap: "pretty" }}>{item.a}</p>
</details>
))}
</div>
<div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", background: "var(--qs-brand-soft,#e4f5fb)", border: "1px solid var(--qs-line-2,#bfe9f6)", borderRadius: "var(--tw-radius,16px)", padding: "24px 28px" }}>
<img src="/assets/mascot-skylo-support.webp" alt="" style={{ height: "130px", width: "auto", borderRadius: "var(--tw-radius-sm,10px)", background: "#fff", boxShadow: "none" }} />
<p style={{ flex: "1", minWidth: "260px", fontSize: "18px", lineHeight: "1.75", color: "#1b93b8" }}>سؤالك غير موجود؟ اتصل بالرقم المختصر <b>6393</b> أو راسلنا على sales@almarayagroup.com.</p>
<button className="qa-btn qa-cyan" onClick={goContact}>تواصل معنا</button>
</div>
</section>
</div>
</>) : null}

{isInsurance ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<div className="qa-sec qa-2col" style={{ position: "relative", paddingBlock: "28px", display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)", gap: "36px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,.85)" }}>خدمة إضافية</span>
<h1 style={{ fontSize: "clamp(34px,3.2vw,46px)", fontWeight: "700", color: "#fff", lineHeight: "1.16", textWrap: "pretty" }}>تأمين السفر</h1>
<p style={{ fontSize: "18px", lineHeight: "1.7", color: "rgba(255,255,255,.94)", maxWidth: "600px", textWrap: "pretty" }}>نوفّر لك تغطية تأمينية مناسبة لرحلتك — للأفراد والعائلات والمسافرين للعمل. أخبرنا بوجهتك ومدة إقامتك وسنرتّب لك العرض المناسب.</p>
<div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", paddingTop: "4px" }}>
<button className="qa-btn qa-amber" onClick={goContact} style={{ fontSize: "17px", padding: "16px 28px" }}>تواصل معنا</button>
<a href="tel:6393" data-no-i18n="" style={{ fontSize: "16px", color: "rgba(255,255,255,.9)", textDecoration: "none" }}>6393</a>
<a href="mailto:sales@almarayagroup.com" data-no-i18n="" style={{ fontSize: "16px", color: "rgba(255,255,255,.9)", textDecoration: "none" }}>sales@almarayagroup.com</a>
</div>
</div>
<div style={{ position: "relative", alignSelf: "stretch", minHeight: "340px" }}>
<span aria-hidden="true" style={{ position: "absolute", left: "-32%", bottom: "-60px", width: "330px", height: "330px", animation: "qa-orbit 28s linear infinite" }}>
<span style={{ position: "absolute", inset: "0", borderRadius: "50%", border: "1px dashed rgba(255,255,255,.42)" }}></span>
<span style={{ position: "absolute", top: "-5px", left: "50%", width: "10px", height: "10px", marginLeft: "-5px", borderRadius: "50%", background: "#faab18" }}></span>
</span>
<img src="/assets/mascot-skylo-passport-hq.webp" alt="" style={{ position: "absolute", zIndex: "2", left: "-6%", top: "-10px", bottom: "-18px", display: "block", width: "auto", height: "calc(100% + 28px)", objectFit: "contain", objectPosition: "left bottom", filter: "drop-shadow(0 26px 38px rgba(1,42,55,.3))" }} />
</div>
</div>
</section>
<section className="qa-sec">
<dl style={{ margin: "0", maxWidth: "var(--q-read,720px)", display: "flex", flexDirection: "column", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<dt style={{ fontSize: "var(--q-t3,22px)", fontWeight: "700", lineHeight: "1.3", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>ما الذي يغطيه التأمين؟</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t4,17px)", lineHeight: "1.75", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))", textWrap: "pretty" }}>تغطية طبية طارئة أثناء السفر، وإلغاء أو تأخير الرحلة، وفقدان الأمتعة — حسب الوثيقة التي تختارها.</dd>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<dt style={{ fontSize: "var(--q-t3,22px)", fontWeight: "700", lineHeight: "1.3", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>لمن نصدره؟</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t4,17px)", lineHeight: "1.75", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))", textWrap: "pretty" }}>للأفراد والعائلات وموظفي الشركات، ولرحلات التأشيرات التي تشترط وثيقة تأمين سارية.</dd>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<dt style={{ fontSize: "var(--q-t3,22px)", fontWeight: "700", lineHeight: "1.3", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>كيف تطلبه؟</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t4,17px)", lineHeight: "1.75", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))", textWrap: "pretty" }}>تواصل معنا على الرقم المختصر 6393 أو عبر البريد، وسنرسل لك عرض السعر والتغطية خلال وقت قصير.</dd>
</div>
</dl>
</section>
<section className="qa-sec" style={{ paddingTop: "0" }}>
<div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", background: "var(--q-surface-2,var(--qs-paper,#f6f8f9))", border: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", borderRadius: "var(--q-r,12px)", padding: "24px 28px" }}>
<p style={{ flex: "1", minWidth: "260px", fontSize: "var(--q-t4,17px)", lineHeight: "1.75", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))" }}>هل ترغب بتأمين لرحلتك القادمة؟ تواصل معنا وسنرتّب لك أفضل وثيقة سعراً وتغطية.</p>
<button className="qa-btn qa-cyan" onClick={goContact}>تواصل معنا</button>
</div>
</section>
</div>
</>) : null}

{isGroups ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<div className="qa-sec qa-2col" style={{ position: "relative", paddingBlock: "28px", display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,.95fr)", gap: "36px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,.85)" }}>حلول للمؤسسات</span>
<h1 style={{ fontSize: "clamp(34px,3.2vw,46px)", fontWeight: "700", color: "#fff", lineHeight: "1.16", textWrap: "pretty" }}>سفر المجموعات والفعاليات</h1>
<p style={{ fontSize: "18px", lineHeight: "1.7", color: "rgba(255,255,255,.94)", maxWidth: "600px", textWrap: "pretty" }}>ندير حركة السفر للأفواج والفعاليات الكبرى — من التذاكر الجماعية إلى الإقامة والتنقلات الداخلية، بفريق مخصص يتابع معك من أول يوم.</p>
<div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", paddingTop: "4px" }}>
<button className="qa-btn qa-amber" onClick={goContact} style={{ fontSize: "17px", padding: "16px 28px" }}>تواصل معنا</button>
<a href="tel:6393" data-no-i18n="" style={{ fontSize: "16px", color: "rgba(255,255,255,.9)", textDecoration: "none" }}>6393</a>
<a href="mailto:sales@almarayagroup.com" data-no-i18n="" style={{ fontSize: "16px", color: "rgba(255,255,255,.9)", textDecoration: "none" }}>sales@almarayagroup.com</a>
</div>
</div>
<div style={{ position: "relative", alignSelf: "stretch", minHeight: "340px" }}>
<span aria-hidden="true" style={{ position: "absolute", left: "-32%", bottom: "-60px", width: "330px", height: "330px", animation: "qa-orbit 28s linear infinite" }}>
<span style={{ position: "absolute", inset: "0", borderRadius: "50%", border: "1px dashed rgba(255,255,255,.42)" }}></span>
<span style={{ position: "absolute", top: "-5px", left: "50%", width: "10px", height: "10px", marginLeft: "-5px", borderRadius: "50%", background: "#faab18" }}></span>
</span>
<img src="/assets/mascot-skylo-suit-hq.webp" alt="" style={{ position: "absolute", zIndex: "2", left: "-6%", top: "-10px", bottom: "-18px", display: "block", width: "auto", height: "calc(100% + 28px)", objectFit: "contain", objectPosition: "left bottom", filter: "drop-shadow(0 26px 38px rgba(1,42,55,.3))" }} />
</div>
</div>
</section>
<section className="qa-sec">
<dl style={{ margin: "0", maxWidth: "var(--q-read,720px)", display: "flex", flexDirection: "column", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<dt style={{ fontSize: "var(--q-t3,22px)", fontWeight: "700", lineHeight: "1.3", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>التذاكر الجماعية</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t4,17px)", lineHeight: "1.75", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))", textWrap: "pretty" }}>أسعار تعاقدية للمجموعات مع مرونة في الأسماء والمواعيد قبل الإصدار.</dd>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<dt style={{ fontSize: "var(--q-t3,22px)", fontWeight: "700", lineHeight: "1.3", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>الإقامة والتنقلات</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t4,17px)", lineHeight: "1.75", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))", textWrap: "pretty" }}>عقود فندقية مباشرة، وتنقلات مطار وباصات داخلية منظّمة حسب برنامج الفوج.</dd>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "6px", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid var(--q-line,var(--qs-line,#e6e9eb))" }}>
<dt style={{ fontSize: "var(--q-t3,22px)", fontWeight: "700", lineHeight: "1.3", color: "var(--q-ink,var(--qs-ink,#1d2733))" }}>فعاليات ومؤتمرات</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t4,17px)", lineHeight: "1.75", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))", textWrap: "pretty" }}>تنسيق كامل لحركة الوفود والمشجعين والمؤتمرات، مع مسؤول حساب مخصص لمجموعتك.</dd>
</div>
</dl>
</section>
<section className="qa-sec" style={{ paddingTop: "0" }}>
<div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap", background: "var(--q-surface-2,var(--qs-paper,#f6f8f9))", border: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", borderRadius: "var(--q-r,12px)", padding: "24px 28px" }}>
<p style={{ flex: "1", minWidth: "260px", fontSize: "var(--q-t4,17px)", lineHeight: "1.75", color: "var(--q-ink-2,var(--qs-ink-2,#5f666e))" }}>لديك فوج أو فعالية قادمة؟ تواصل معنا وسنبني لك برنامجاً متكاملاً.</p>
<button className="qa-btn qa-cyan" onClick={goContact}>تواصل معنا</button>
</div>
</section>
</div>
</>) : null}

{isPrivacy ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<div className="qa-sec qa-2col" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: "44px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,.8)" }}>حماية بياناتك</span>
<h1 style={{ fontSize: "40px", fontWeight: "700", color: "#fff", lineHeight: "1.3" }}>سياسة الخصوصية</h1>
<p style={{ fontSize: "18px", lineHeight: "1.7", color: "rgba(255,255,255,.92)", maxWidth: "640px", textWrap: "pretty" }}>تلتزم قصر المرايا للسفر والسياحة بحماية خصوصية عملائها وضمان سرية المعلومات التي يتم جمعها من خلال موقعنا الإلكتروني أو من خلال خدماتنا المختلفة.</p>
</div>
<div style={{ justifySelf: "center", width: "100%", maxWidth: "270px", aspectRatio: "1", borderRadius: "50%", background: "#fff", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
<img src="/assets/mascot-skylo-suit-hq.webp" alt="" style={{ width: "106%", height: "106%", objectFit: "cover" }} />
</div>
</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "var(--q-s3,24px)", maxWidth: "var(--q-read,720px)", margin: "0 auto" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>1</span>مقدمة</h3>
<p style={{ fontSize: "16px", lineHeight: "1.85", color: "var(--qs-body,#3d4650)", margin: "0", textWrap: "pretty" }}>تحدد هذه السياسة كيفية جمع واستخدام وحماية المعلومات الشخصية الخاصة بك عند التعامل معنا، سواء عبر موقعنا الإلكتروني أو عبر مكاتبنا وقنوات الاتصال الرسمية.</p>

</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>2</span>المعلومات التي يتم جمعها</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>البيانات الشخصية التي يقدمها المستخدم عند الحجز مثل الاسم، رقم الجواز، وبيانات الاتصال.</li><li style={{ textWrap: "pretty" }}>معلومات الدفع والمعاملات المالية عند إجراء عمليات الحجز والدفع.</li><li style={{ textWrap: "pretty" }}>البيانات التقنية مثل عنوان IP، نوع الجهاز والمتصفح، وسجل التصفح على موقعنا.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>3</span>كيفية استخدام المعلومات</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>معالجة الحجوزات وتقديم الخدمات المطلوبة من قبل العميل.</li><li style={{ textWrap: "pretty" }}>تحسين تجربة المستخدم على الموقع وتقديم محتوى مخصص.</li><li style={{ textWrap: "pretty" }}>التواصل مع العملاء لإبلاغهم بأي تحديثات أو تغييرات على الحجوزات.</li><li style={{ textWrap: "pretty" }}>الامتثال للمتطلبات القانونية والتنظيمية.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>4</span>حماية المعلومات</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>يتم تخزين البيانات الشخصية على خوادم آمنة، مع اتخاذ تدابير أمنية مشددة لمنع الوصول غير المصرح به.</li><li style={{ textWrap: "pretty" }}>تلتزم الشركة بعدم بيع أو مشاركة بيانات العملاء مع أي طرف ثالث إلا في حالات الضرورة لإتمام الحجز أو بموجب طلب قانوني.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>5</span>حقوق المستخدمين</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>يحق للمستخدمين طلب الاطلاع على بياناتهم الشخصية أو تعديلها.</li><li style={{ textWrap: "pretty" }}>يمكن للعملاء طلب حذف بياناتهم من سجلاتنا، باستثناء السجلات المالية التي تخضع للأنظمة المحاسبية.</li><li style={{ textWrap: "pretty" }}>يحق للمستخدمين إلغاء الاشتراك في الرسائل التسويقية في أي وقت.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>6</span>مشاركة المعلومات مع أطراف ثالثة</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>قد نشارك بعض البيانات مع مزودي الخدمات مثل شركات الطيران والفنادق لتأكيد الحجوزات.</li><li style={{ textWrap: "pretty" }}>نلتزم بعدم مشاركة البيانات لأغراض تسويقية مع أطراف خارجية دون موافقة مسبقة من المستخدم.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>7</span>التعديلات على سياسة الخصوصية</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>تحتفظ الشركة بحقها في تعديل هذه السياسة في أي وقت وفقًا لمتطلبات التشغيل أو القوانين المعمول بها.</li><li style={{ textWrap: "pretty" }}>سيتم إشعار العملاء بأي تغييرات مهمة عبر موقعنا الإلكتروني أو قنوات الاتصال الرسمية.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>8</span>القوانين المعمول بها</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>تخضع هذه السياسة لقوانين جمهورية العراق وسلطنة عمان.</li><li style={{ textWrap: "pretty" }}>في حالة حدوث نزاع قانوني، يتم اللجوء إلى المحاكم المختصة لحله.</li></ul>
</div>
<div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#fef3dc", border: "1px solid #fdd27c", borderRadius: "var(--q-r,12px)", padding: "24px 24px", color: "#c07f00", fontSize: "var(--q-t4,17px)", fontWeight: "500", lineHeight: "1.6" }}>لأي استفسارات بخصوص سياسة الخصوصية، يرجى التواصل معنا عبر القنوات الرسمية المدرجة على موقعنا: sales@almarayagroup.com — الرقم المختصر 6393.</div>
</section>
</div>
</>) : null}

{isTerms ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<div className="qa-sec qa-2col" style={{ position: "relative", display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: "44px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,.8)" }}>اتفاقية الاستخدام</span>
<h1 style={{ fontSize: "40px", fontWeight: "700", color: "#fff", lineHeight: "1.3" }}>الشروط والأحكام</h1>
<p style={{ fontSize: "18px", lineHeight: "1.7", color: "rgba(255,255,255,.92)", maxWidth: "640px", textWrap: "pretty" }}>اتفاقية شروط وأحكام استخدام خدمات شركة قصر المرايا للسفر والسياحة — تنظّم العلاقة بين الشركة والعميل وتضمن حقوق والتزامات كل طرف.</p>
</div>
<div style={{ justifySelf: "center", width: "100%", maxWidth: "270px", aspectRatio: "1", borderRadius: "50%", background: "#fff", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
<img src="/assets/mascot-skylo-passport-hq.webp" alt="" style={{ width: "106%", height: "106%", objectFit: "cover" }} />
</div>
</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "var(--q-s3,24px)", maxWidth: "var(--q-read,720px)", margin: "0 auto" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>1</span>مقدمة</h3>
<p style={{ fontSize: "16px", lineHeight: "1.85", color: "var(--qs-body,#3d4650)", margin: "0", textWrap: "pretty" }}>ترحب بكم شركة قصر المرايا للسفر والسياحة، وهي شركة محدودة المسؤولية مسجلة رسميًا في كل من جمهورية العراق وسلطنة عمان. تقدم الشركة مجموعة واسعة من الخدمات السياحية التي تشمل حجوزات تذاكر الطيران والفنادق، خدمات استخراج التأشيرات، وتنظيم الجولات السياحية والرحلات الجماعية والفردية. إن استخدامكم لخدماتنا يعني موافقتكم الكاملة على جميع الشروط والأحكام الواردة في هذه الاتفاقية.</p>

</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>2</span>شروط الحجز والدفع</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>يتم تأكيد الحجز بشكل رسمي عند استلام الدفعة المسبقة عبر إحدى وسائل الدفع المتاحة: التحويل المصرفي، الدفع النقدي، أو المحافظ الإلكترونية.</li><li style={{ textWrap: "pretty" }}>قد توفر الشركة إمكانية إبرام عقود آجلة وفواتير مديونية للعملاء الموثوقين والشركات، بناءً على سياسات الائتمان الخاصة بها.</li><li style={{ textWrap: "pretty" }}>لا تفرض الشركة أي رسوم إضافية على عمليات الدفع الإلكتروني، بل تشجع على استخدامها لتسهيل الإجراءات.</li><li style={{ textWrap: "pretty" }}>يحق للعميل تعديل الحجز بعد الدفع وفقًا للشروط والسياسات الخاصة بشركات الطيران أو مزودي الخدمات المعنيين.</li><li style={{ textWrap: "pretty" }}>بالنسبة للحجوزات الجماعية، يخضع عدد المشاركين للحد الأدنى والحد الأقصى الذي تحدده شركات الطيران أو الفنادق أو الشركات المشغلة للرحلات.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>3</span>سياسة الإلغاء والاسترداد</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>تخضع سياسات الإلغاء والاسترداد بالكامل إلى اللوائح والسياسات المعتمدة من قبل مزودي الخدمات مثل شركات الطيران والفنادق ومنظمي الرحلات.</li><li style={{ textWrap: "pretty" }}>رسوم التأشيرات المدفوعة مقابل معالجة الطلبات تعتبر رسومًا خدمية غير قابلة للاسترداد بمجرد تقديم الطلب.</li><li style={{ textWrap: "pretty" }}>في حال إلغاء الرحلة من قبل العميل، فإن استرداد المبالغ يعتمد على شروط المزود المعتمد.</li><li style={{ textWrap: "pretty" }}>إذا تم إلغاء الرحلة أو الخدمة المحجوزة بسبب ظروف خارجة عن إرادة الشركة، سيتم التعامل مع الموقف وفقًا للوائح الدولة المعنية وسياسات مزودي الخدمات.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>4</span>التأشيرات والمسؤولية القانونية</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>تقدم الشركة خدمة استشارية شاملة بشأن طلبات التأشيرات، حيث تعمل كوسيط بين العميل والجهات المختصة بإصدار التأشيرات.</li><li style={{ textWrap: "pretty" }}>لا تضمن الشركة الموافقة النهائية على طلب التأشيرة، إذ تخضع العملية بالكامل إلى إجراءات الدولة المستضيفة وسياساتها الأمنية.</li><li style={{ textWrap: "pretty" }}>في حال تم رفض طلب التأشيرة، لن يكون العميل مؤهلًا لاسترداد الرسوم المدفوعة نظرًا لكونها رسومًا مخصصة لتغطية إجراءات التقديم وليس ضمان القبول.</li><li style={{ textWrap: "pretty" }}>لا تتحمل الشركة مسؤولية أي تأخير ناتج عن أخطاء إدارية أو أمنية من جانبها، وتلتزم بتقديم حلول بديلة مناسبة لتعويض العميل عند الاقتضاء.</li><li style={{ textWrap: "pretty" }}>يمكن للعملاء اختيار خدمات التأمين على السفر المتاحة عبر الشركة، مما يوفر لهم حماية إضافية أثناء رحلاتهم.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>5</span>مسؤوليات الشركة والعميل</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>تلتزم الشركة بإدارة حجوزات العملاء بكفاءة وضمان إتمام إجراءات السفر بالشكل الأمثل، بما يشمل الإبلاغ عن أي تغييرات قد تطرأ على حجوزات الطيران أو الفعاليات السياحية.</li><li style={{ textWrap: "pretty" }}>لا تتحمل الشركة مسؤولية التعديلات أو الإلغاءات التي تصدر عن شركات الطيران أو الفنادق، لكنها ستبذل أقصى جهدها لمساعدة العملاء في إعادة ترتيب خططهم.</li><li style={{ textWrap: "pretty" }}>يتحمل العميل المسؤولية الكاملة عن الامتثال للأنظمة والقوانين المحلية في وجهة السفر، بما في ذلك التأكد من صلاحية وثائق السفر الخاصة به.</li><li style={{ textWrap: "pretty" }}>في حال فقدان الأمتعة أو مواجهة مشكلات أثناء السفر، سيكون العميل ملزمًا بمتابعة الإجراءات القانونية والتواصل المباشر مع الجهات المختصة لحل المشكلة، بينما تقدم الشركة الدعم المناسب في هذا الصدد.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>6</span>خدمات ما بعد البيع والدعم</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>توفر الشركة خدمات دعم العملاء على مدار الساعة، طيلة أيام الأسبوع، لضمان مساعدة العملاء في جميع الأوقات.</li><li style={{ textWrap: "pretty" }}>يمكن للعملاء التواصل مع خدمة الدعم عبر البريد الإلكتروني الرسمي، أو المكالمات الهاتفية، أو من خلال الحضور الشخصي إلى مكاتب الشركة.</li><li style={{ textWrap: "pretty" }}>في حال وجود شكاوى أو استفسارات، تلتزم الشركة بمعالجة جميع الطلبات بجدية وشفافية، وفق إجراءات واضحة ومحددة.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>7</span>تسوية النزاعات والقوانين المطبقة</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>تخضع هذه الاتفاقية وتُفسَّر وفقًا للقوانين النافذة في الدول التي تمارس فيها الشركة نشاطها، وهي جمهورية العراق وسلطنة عمان.</li><li style={{ textWrap: "pretty" }}>في حال نشوء أي نزاع قانوني بين العميل والشركة، سيتم اللجوء في البداية إلى سياسة التسوية الودية قبل اتخاذ أي إجراءات قانونية.</li><li style={{ textWrap: "pretty" }}>عند الضرورة، يمكن إحالة النزاعات إلى المحاكم المحلية أو التحكيم الدولي، وفقًا لما تقتضيه طبيعة القضية.</li><li style={{ textWrap: "pretty" }}>تحتفظ الشركة بحق تعديل هذه الاتفاقية في أي وقت وفقًا لمتطلبات السوق أو اللوائح التنظيمية الجديدة، وسيتم إبلاغ العملاء بأي تغييرات عبر القنوات الرسمية.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>8</span>سياسة الخصوصية وحماية البيانات</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>تجمع الشركة المعلومات الشخصية الضرورية مثل الأسماء وأرقام جوازات السفر وبيانات الاتصال، بهدف إتمام الحجوزات بأمان وفعالية.</li><li style={{ textWrap: "pretty" }}>يتم تخزين جميع البيانات الشخصية بطريقة آمنة ضمن أنظمة إدارة العملاء الخاصة بالشركة، مع اتخاذ جميع التدابير التقنية اللازمة لحماية خصوصية العملاء.</li><li style={{ textWrap: "pretty" }}>لا تتم مشاركة بيانات العملاء مع أي جهات خارجية إلا بالقدر اللازم لإتمام إجراءات الحجز مثل شركات الطيران والفنادق.</li><li style={{ textWrap: "pretty" }}>يمكن للعملاء طلب حذف بياناتهم الشخصية من سجلات الشركة باستثناء السجلات المحاسبية التي تخضع للقوانين المالية والمعمول بها.</li></ul>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "var(--q-s3,24px)", borderTop: "1px solid var(--q-line,var(--qs-line,#e6e9eb))", }}>
<h3 style={{ margin: "0", display: "flex", alignItems: "baseline", gap: "10px", fontSize: "var(--q-t3,22px)", fontWeight: "700", color: "var(--q-ink,var(--qs-ink,#1d2733))", lineHeight: "1.35" }}><span aria-hidden="true" style={{ flex: "none", fontSize: "var(--q-t5,15px)", fontWeight: "700", color: "var(--q-cyan,var(--qs-brand-deep,#049dc5))" }}>9</span>الأحكام العامة</h3>

<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}><li style={{ textWrap: "pretty" }}>استخدام أي من خدمات الشركة يعني موافقة العميل الكاملة على جميع البنود الواردة في هذه الاتفاقية.</li><li style={{ textWrap: "pretty" }}>يحق للشركة تعليق أو إنهاء أي خدمة في حال خرق العميل لهذه الشروط أو إساءة استخدام الخدمات.</li><li style={{ textWrap: "pretty" }}>هذه الاتفاقية نافذة المفعول اعتبارًا من تاريخ الموافقة عليها من قبل العميل عند استخدام خدمات الشركة.</li></ul>
</div>
<div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#fef3dc", border: "1px solid #fdd27c", borderRadius: "var(--q-r,12px)", padding: "24px 24px", color: "#c07f00", fontSize: "var(--q-t4,17px)", fontWeight: "500", lineHeight: "1.6" }}>لأي استفسارات إضافية، يمكنكم التواصل معنا عبر القنوات الرسمية المدرجة في موقعنا الإلكتروني: sales@almarayagroup.com — +964 784 999 9600.</div>
</section>
</div>
</>) : null}

{isAbout ? (<>
<div className="qa-page">
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<div className="qa-sec" style={{ position: "relative" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,.8)" }}>من نحن</span>
<h1 style={{ fontSize: "40px", fontWeight: "700", color: "#fff", lineHeight: "1.3" }}>رؤيتنا ورسالتنا</h1>
<p style={{ fontSize: "18px", lineHeight: "1.7", color: "rgba(255,255,255,.92)", maxWidth: "640px", textWrap: "pretty" }}>في قصر المرايا للسفر والسياحة، نحن أكثر من مجرد وكالة سفر — نحن بوابتك إلى تجارب استثنائية تلبي تطلعاتك وتضمن لك رحلة خالية من المتاعب.</p>
</div>
</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
<div className="qa-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--q-s4,40px)", alignItems: "start" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<h3 style={{ fontSize: "26px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)", margin: "0" }}>رؤيتنا</h3>
<p style={{ fontSize: "16px", lineHeight: "1.85", color: "var(--qs-body,#3d4650)", margin: "0", textWrap: "pretty" }}>نطمح لأن نكون الاسم الأول في عالم السفر والسياحة، مقدمين خدمات مبتكرة ذات جودة عالية تلبي احتياجات المسافرين حول العالم. نسعى لخلق تجربة سفر متكاملة يجد فيها العميل كل ما يحتاجه في مكان واحد، بأسلوب احترافي وبأعلى معايير الجودة.</p>
<p style={{ fontSize: "16px", lineHeight: "1.85", color: "var(--qs-body,#3d4650)", margin: "0", textWrap: "pretty" }}>نهدف إلى تعزيز مكانة قصر المرايا كوكالة رائدة تقدم حلول سفر متكاملة، وإلى التوسع إقليميًا ودوليًا وتقديم خدماتنا لأسواق جديدة لنكون الخيار الأول للعملاء الباحثين عن تجربة سفر متميزة.</p>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<h3 style={{ fontSize: "26px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)", margin: "0" }}>رسالتنا</h3>
<p style={{ fontSize: "16px", lineHeight: "1.85", color: "var(--qs-body,#3d4650)", margin: "0", textWrap: "pretty" }}>نحن ملتزمون بتقديم خدمات سفر متكاملة تلبي توقعات عملائنا وتفوقها، مع التركيز على الراحة والجودة والشفافية في كل خطوة. هدفنا هو جعل تجربة السفر سهلة وممتعة، مع توفير كافة الحلول التي يحتاجها المسافرون — بغرض الترفيه، العمل، أو الزيارات الدينية.</p>
<ul style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.75", color: "var(--qs-body,#3d4650)" }}>
<li>حجوزات طيران بأسعار تنافسية.</li>
<li>برامج سياحية مخصصة تناسب مختلف الأذواق.</li>
<li>خيارات إقامة متنوعة تلبي احتياجات المسافرين.</li>
<li>دعم العملاء على مدار الساعة لضمان راحتهم وأمانهم أثناء الرحلة.</li>
</ul>
</div>
</div>
</section>
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<div className="qa-sec" style={{ position: "relative", display: "flex", flexDirection: "column", gap: "28px" }}>
<div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: "12px" }}>
<h2 style={{ fontSize: "36px", fontWeight: "700", color: "#fff" }}>قيمنا الأساسية</h2>
<p style={{ fontSize: "17px", lineHeight: "1.7", color: "rgba(255,255,255,.9)" }}>خمس قيم تشكّل أساس عملنا وتحدد أسلوب تعاملنا مع عملائنا.</p>
</div>
<dl style={{ margin: "0", display: "flex", flexDirection: "column", borderTop: "1px solid rgba(255,255,255,.3)" }}>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,200px) minmax(0,1fr)", gap: "4px var(--q-s3,24px)", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid rgba(255,255,255,.3)" }}>
<dt style={{ fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "#fff", lineHeight: "1.4" }}>الشفافية</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t5,15px)", lineHeight: "1.75", color: "rgba(255,255,255,.9)", textWrap: "pretty" }}>نضمن لك وضوح المعلومات حول جميع الخدمات والأسعار، فلا رسوم مخفية أو معلومات مبهمة.</dd>
</div>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,200px) minmax(0,1fr)", gap: "4px var(--q-s3,24px)", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid rgba(255,255,255,.3)" }}>
<dt style={{ fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "#fff", lineHeight: "1.4" }}>الجودة</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t5,15px)", lineHeight: "1.75", color: "rgba(255,255,255,.9)", textWrap: "pretty" }}>نقدم خدمات عالية المستوى لضمان تجربة سفر سلسة ومميزة.</dd>
</div>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,200px) minmax(0,1fr)", gap: "4px var(--q-s3,24px)", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid rgba(255,255,255,.3)" }}>
<dt style={{ fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "#fff", lineHeight: "1.4" }}>المصداقية</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t5,15px)", lineHeight: "1.75", color: "rgba(255,255,255,.9)", textWrap: "pretty" }}>نؤمن بأهمية بناء علاقات قائمة على الثقة والاحترام المتبادل مع عملائنا وشركائنا.</dd>
</div>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,200px) minmax(0,1fr)", gap: "4px var(--q-s3,24px)", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid rgba(255,255,255,.3)" }}>
<dt style={{ fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "#fff", lineHeight: "1.4" }}>الابتكار</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t5,15px)", lineHeight: "1.75", color: "rgba(255,255,255,.9)", textWrap: "pretty" }}>نسعى لتطوير خدماتنا باستخدام أحدث التقنيات وأفضل الممارسات في صناعة السفر.</dd>
</div>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,200px) minmax(0,1fr)", gap: "4px var(--q-s3,24px)", paddingBlock: "var(--q-s2,16px)", borderBottom: "1px solid rgba(255,255,255,.3)" }}>
<dt style={{ fontSize: "var(--q-t4,17px)", fontWeight: "700", color: "#fff", lineHeight: "1.4" }}>الالتزام</dt>
<dd style={{ margin: "0", fontSize: "var(--q-t5,15px)", lineHeight: "1.75", color: "rgba(255,255,255,.9)", textWrap: "pretty" }}>نضع راحة العملاء وأمانهم في مقدمة أولوياتنا، ونعمل على تلبية احتياجاتهم بكل احترافية.</dd>
</div>
</dl>
</div>
</section>
<section className="qa-sec qa-2col" style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: "48px", alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<h2 style={{ fontSize: "34px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)" }}>لماذا تختار قصر المرايا للسفر والسياحة؟</h2>
<ul style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "0", paddingInlineStart: "20px", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)" }}>
<li>خبرة طويلة في مجال السياحة والسفر تضمن لك خدمة احترافية وموثوقة.</li>
<li>توفير أفضل العروض على رحلات الطيران والفنادق والبرامج السياحية.</li>
<li>خدمة دعم مستمرة لمساعدتك في كل خطوة من رحلتك.</li>
<li>رحلات مخصصة تناسب احتياجاتك، سواء كانت سياحية، دينية، أو أعمال.</li>
</ul>
<p style={{ fontSize: "17px", lineHeight: "1.8", color: "#1b93b8", textWrap: "pretty" }}>مع قصر المرايا، رحلتك تبدأ بثقة وتنتهي بذكريات لا تُنسى. انضم إلينا في رحلتك المليئة بالمغامرات والاكتشافات، ودعنا نهتم بكل التفاصيل من أجلك.</p>
<div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingTop: "4px" }}>
<button className="qa-btn qa-cyan" onClick={goContact}>تواصل معنا</button>
<button className="qa-btn qa-amber" onClick={goFlights}>ابدأ رحلتك</button>
</div>
</div>
<img src="/assets/mascot-skylo-imagination.webp" alt="سكايلو — حيث يطير الخيال" style={{ width: "100%", maxWidth: "420px", justifySelf: "center", borderRadius: "var(--tw-radius,16px)" }} />
</section>
<section className="qa-sec" style={{ paddingTop: "0" }}>
<div style={{ maxWidth: "var(--q-read,720px)", display: "flex", flexDirection: "column", gap: "16px" }}>
<h2 style={{ fontSize: "36px", fontWeight: "700" }}>ما يمكننا فعله من أجلك</h2>
<p style={{ fontSize: "18px", lineHeight: "1.75", color: "var(--qs-brand-deep,#22a9d4)" }}>نحن لا ننظم فقط… نحن نُبدع في صناعة التجربة.</p>
<p style={{ fontSize: "16px", lineHeight: "1.75" }}>باقات متكاملة تضم وجهات مميزة ومطاعم محلية، أنشطة استثنائية، واستكشاف الأماكن التي لا تزورها الجولات التقليدية.</p>
</div>
</section>
<div style={{ background: "var(--tw-band,var(--qs-band,#34bbe1))", position: "relative", overflow: "hidden" }}>
<section style={{ position: "relative" }}>
<div className="qa-sec" style={{ position: "relative", display: "flex", flexDirection: "column", gap: "32px" }}>
<div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px" }}>
<h2 style={{ fontSize: "36px", fontWeight: "700", color: "#fff" }}>ما نلتزم به في كل رحلة</h2>
<p style={{ fontSize: "18px", lineHeight: "1.75", color: "rgba(255,255,255,.92)" }}>أربعة التزامات تحكم كل رحلة نخطّط لها.</p>
</div>
<div className="qa-swipe" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px", alignItems: "stretch" }}>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px" }}><h4 style={{ fontSize: "20px", fontWeight: "700", color: "#1b93b8", marginBottom: "8px" }}>المغامرة والاستكشاف</h4><p style={{ fontSize: "14px", lineHeight: "1.45" }}>نُلهم المسافرين لاكتشاف أماكن وتجارب لا تُنسى.</p></div>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px" }}><h4 style={{ fontSize: "20px", fontWeight: "700", color: "#1b93b8", marginBottom: "8px" }}>الثقة والاعتمادية</h4><p style={{ fontSize: "14px", lineHeight: "1.45" }}>كل رحلة تُخطَّط بصدق وأمان ومسؤولية كاملة.</p></div>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px" }}><h4 style={{ fontSize: "20px", fontWeight: "700", color: "#1b93b8", marginBottom: "8px" }}>رضا العميل أولاً</h4><p style={{ fontSize: "14px", lineHeight: "1.45" }}>راحتك ودعمك في كل خطوة، بلا تعقيد.</p></div>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px" }}><h4 style={{ fontSize: "20px", fontWeight: "700", color: "#1b93b8", marginBottom: "8px" }}>التميّز في الخدمة</h4><p style={{ fontSize: "14px", lineHeight: "1.45" }}>تخطيط عالي الجودة وحجز سلس وتجربة سفر متكاملة.</p></div>
</div>
<div className="qa-swipe-hint" aria-hidden="true">اسحب لرؤية المزيد ↔</div>
</div>
</section>
<section style={{ position: "relative" }}>
<div className="qa-sec" style={{ paddingTop: "0", position: "relative", display: "flex", flexDirection: "column", gap: "36px" }}>
<div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: "14px" }}>
<span style={{ fontSize: "14px", fontWeight: "600", color: "rgba(255,255,255,.78)" }}>ما نعمل من أجله كل يوم</span>
<h2 style={{ fontSize: "38px", fontWeight: "700", color: "#fff", lineHeight: "1.3" }}>أهداف شركة قصر المرايا للسفر والسياحة</h2>
</div>
<div className="qa-goals qa-swipe" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", alignItems: "stretch" }}>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--qs-brand-soft,#e4f5fb)", color: "var(--qs-brand-deep,#22a9d4)", display: "flex", alignItems: "center", justifyContent: "center" }}><GoalServices size={32} /></span>
<h4 style={{ fontSize: "20px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>خدمات سياحية متكاملة</h4>
<p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--qs-ink-2,#5f666e)" }}>حجوزات الطيران، حزم العطلات، رحلات جماعية، وتأشيرات — كل شيء من مكان واحد.</p>
</div>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--qs-brand-soft,#e4f5fb)", color: "var(--qs-brand-deep,#22a9d4)", display: "flex", alignItems: "center", justifyContent: "center" }}><GoalTrust size={32} /></span>
<h4 style={{ fontSize: "20px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>رضا العملاء وبناء الثقة</h4>
<p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--qs-ink-2,#5f666e)" }}>دعم على مدار الساعة، خدمة شخصية، وعلاقات دائمة مع كل مسافر.</p>
</div>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--qs-brand-soft,#e4f5fb)", color: "var(--qs-brand-deep,#22a9d4)", display: "flex", alignItems: "center", justifyContent: "center" }}><GoalExpansion size={32} /></span>
<h4 style={{ fontSize: "20px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>توسع محلي ودولي</h4>
<p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--qs-ink-2,#5f666e)" }}>شراكات عالمية وحضور فاعل في المعارض السياحية الدولية.</p>
</div>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef3dc", color: "#c07f00", display: "flex", alignItems: "center", justifyContent: "center" }}><GoalTech size={32} /></span>
<h4 style={{ fontSize: "20px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>الابتكار والتطوير التقني</h4>
<p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--qs-ink-2,#5f666e)" }}>أحدث تقنيات الحجز وحلول رقمية سهلة الاستخدام في كل خطوة.</p>
</div>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef3dc", color: "#c07f00", display: "flex", alignItems: "center", justifyContent: "center" }}><GoalHeritage size={32} /></span>
<h4 style={{ fontSize: "20px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>ترويج السياحة المحلية</h4>
<p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--qs-ink-2,#5f666e)" }}>رحلات ثقافية فريدة لاكتشاف تاريخ العراق العريق ومعالمه.</p>
</div>
<div style={{ background: "#fff", borderRadius: "var(--tw-radius,16px)", padding: "24px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
<span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#fef3dc", color: "#c07f00", display: "flex", alignItems: "center", justifyContent: "center" }}><GoalSafety size={32} /></span>
<h4 style={{ fontSize: "20px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>توفير تجربة سفر آمنة</h4>
<p style={{ fontSize: "15px", lineHeight: "1.7", color: "var(--qs-ink-2,#5f666e)" }}>شركاء موثوقون، تأمين شامل، وراحة وأمان من الإقلاع حتى العودة.</p>
</div>
</div>
<div className="qa-swipe-hint" aria-hidden="true">اسحب لرؤية المزيد ↔</div>
</div>
</section>
</div>
<section className="qa-sec qa-2col" style={{ display: "grid", gridTemplateColumns: ".9fr 1.1fr", gap: "56px", alignItems: "center" }}>
<div style={{ position: "relative", justifySelf: "center", width: "100%", maxWidth: "430px", display: "flex", alignItems: "center", justifyContent: "center" }}>
<img src="/assets/vision-plane-cutout3.webp" alt="طائرة قصر المرايا على جوازات السفر" style={{ position: "relative", display: "block", width: "100%", maxWidth: "100%", height: "auto" }} />
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<h2 style={{ fontSize: "36px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)", lineHeight: "1.3" }}>رؤيتنا المستقبلية في قصر المرايا للسفر والسياحة</h2>
<p style={{ fontSize: "16px", lineHeight: "1.75", textWrap: "pretty" }}>نطمح لأن نكون الخيار الأول في مجال السفر والسياحة من خلال تقديم خدمات مبتكرة تلبي تطلعات العملاء، وتوسيع نطاق أعمالنا عالميًا لتعزيز تجربة السفر بأساليب حديثة ومتطورة. كما نعمل على بناء شراكات استراتيجية مع كبرى الشركات السياحية والفنادق وشركات الطيران لضمان تقديم أفضل الخدمات بأسعار تنافسية.</p>
<p style={{ fontSize: "16px", lineHeight: "1.75", textWrap: "pretty" }}>بالإضافة إلى ذلك، نولي اهتمامًا خاصًا لدعم السياحة الداخلية والخارجية عبر توفير حلول سفر متكاملة تتميز بالجودة والموثوقية. ومن منطلق سعينا إلى التطور، نطمح إلى تقديم خدمات إلكترونية حديثة توفر تجربة مستخدم سلسة ولطيفة، تتيح للعملاء حجز رحلاتهم بسهولة وسرعة.</p>
<p style={{ fontSize: "16px", lineHeight: "1.75", textWrap: "pretty" }}>كما نهدف إلى تنشيط السياحة العكسية من خلال استقبال المسافرين الأجانب وتنظيم جولات سياحية لاكتشاف العراق، وإبراز معالمه التاريخية والثقافية والطبيعية، مما يساهم في تعزيز مكانته كوجهة سياحية متميزة على مستوى العالم.</p>
</div>
</section>
<section style={{ background: "var(--tw-band-deep,var(--qs-band,#049dc5))", position: "relative", overflow: "hidden" }}>
<div className="qa-sec qa-2col" style={{ position: "relative", display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: "56px", alignItems: "center" }}>
<div style={{ position: "relative", justifySelf: "center", width: "100%", maxWidth: "420px" }}>
<img src="/assets/ceo-interview.webp" alt="حمزة سعد، المدير التنفيذي، في مقابلة تلفزيونية" style={{ position: "relative", display: "block", width: "100%", aspectRatio: "4/3", objectFit: "cover", objectPosition: "center 38%", borderRadius: "var(--tw-radius,16px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }} />
<div style={{ position: "relative", marginTop: "-26px", marginInlineStart: "24px", display: "inline-flex", flexDirection: "column", gap: "2px", background: "#fff", borderRadius: "var(--tw-radius-sm,10px)", padding: "12px 24px", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<span style={{ fontSize: "19px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)" }}>حمــزة سعد</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>المدير التنفيذي</span>
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
<h2 style={{ fontSize: "38px", fontWeight: "700", color: "#fff", lineHeight: "1.3" }}>رسالة المدير التنفيذي</h2>
<p style={{ fontSize: "19px", lineHeight: "1.7", color: "#fff", fontWeight: "600", maxWidth: "640px", textWrap: "pretty" }}>«نحن نؤمن بأن السفر ليس مجرد انتقال من مكان إلى آخر… بل تجربة متكاملة تفتح آفاقًا جديدة وتعزز الروابط بين الثقافات.»</p>
<p style={{ fontSize: "16px", lineHeight: "1.75", color: "rgba(255,255,255,.9)", maxWidth: "640px", textWrap: "pretty" }}>مرحبًا بكم في قصر المرايا للسفر والسياحة. منذ تأسيس شركتنا وضعنا هدفًا واضحًا يتمثل في تقديم خدمات سياحية متكاملة ترتقي إلى أعلى المعايير العالمية، مع التركيز على الجودة والابتكار في كل ما نقدمه.</p>
<p style={{ fontSize: "16px", lineHeight: "1.75", color: "rgba(255,255,255,.9)", maxWidth: "640px", textWrap: "pretty" }}>يعمل فريقنا المحترف وشبكة شركائنا القوية على توسيع نطاق خدماتنا لتلبي احتياجات عملائنا داخل العراق وخارجه، ونشارك في الفعاليات الدولية لنكون في طليعة الشركات الرائدة في مجال السفر والسياحة. نحرص على أن تكون كل رحلة مليئة باللحظات التي تبقى في الذاكرة.</p>
<p style={{ fontSize: "16px", lineHeight: "1.75", color: "rgba(255,255,255,.9)" }}>شكرًا لثقتكم بنا، ونتطلع لأن نكون جزءًا من رحلاتكم القادمة.</p>
<div style={{ display: "flex", alignItems: "center", gap: "14px", paddingTop: "6px" }}>
<span style={{ width: "44px", height: "2px", background: "#faab18" }}></span>
<span style={{ fontSize: "15px", fontWeight: "600", color: "#fff" }}>حمزة سعد — المدير التنفيذي، قصر المرايا للسفر والسياحة</span>
</div>
</div>
</div>
</section>
<section className="qa-sec" style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
<div style={{ maxWidth: "740px", margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: "14px" }}>
<h2 style={{ fontSize: "38px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)", lineHeight: "1.3" }}>توصيات العملاء</h2>
<p style={{ fontSize: "17px", lineHeight: "1.75", color: "var(--qs-ink-2,#5f666e)", textWrap: "pretty" }}>رضا العملاء هو حجر الأساس لنجاحنا. هذه تجارب حقيقية لعملاء وثقوا بنا في تنظيم رحلاتهم.</p>
</div>
<div className="qa-2col qa-testi-grid qa-swipe" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: "24px", alignItems: "stretch" }}>
<div className="qa-testi-card" style={{ position: "relative", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,16px)", padding: "28px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<span className="qa-testi-avatar" style={{ width: "112px", height: "112px", borderRadius: "50%", flex: "none", overflow: "hidden", background: "var(--qs-brand-soft,#e4f5fb)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}><img src="/assets/avatar-ibrahim.webp" alt="ابراهيم مناضل" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></span>
<p style={{ margin: "0", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-ink,#1d2733)", textWrap: "pretty" }}>حجزتُ رحلة عائلية إلى ماليزيا، وكانت رحلة ممتعة من جميع النواحي — سواء من حيث الطيران، الفنادق، البرامج السياحية، أو حتى حسن التعامل من قبل موظفي الشركة والمندوبين.</p>
<div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "3px", paddingTop: "12px", borderTop: "1px solid var(--qs-line,#ececed)", width: "100%" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>ابراهيم مناضل</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>موظف</span>
</div>
</div>
<div className="qa-testi-card" style={{ position: "relative", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,16px)", padding: "28px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<span className="qa-testi-avatar" style={{ width: "112px", height: "112px", borderRadius: "50%", flex: "none", overflow: "hidden", background: "#fef3dc", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}><img src="/assets/avatar-hasan.webp" alt="م.م. حسن عصام الدليمي" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></span>
<p style={{ margin: "0", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-ink,#1d2733)", textWrap: "pretty" }}>تعاملتُ مع شركة قصر المرايا عدة مرات، وقد قاموا باستخراج تأشيرات الدخول لي لعدة دول. بكل صراحة وأمانة، كان تعاملهم راقيًا للغاية وأسعارهم مناسبة جدًا، كما أنهم يوفرون خيارات متعددة للعديد من الوجهات.</p>
<div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "3px", paddingTop: "12px", borderTop: "1px solid var(--qs-line,#ececed)", width: "100%" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>م.م. حسن عصام الدليمي</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>أستاذ جامعي</span>
</div>
</div>
<div className="qa-testi-card" style={{ position: "relative", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,16px)", padding: "28px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<span className="qa-testi-avatar" style={{ width: "112px", height: "112px", borderRadius: "50%", flex: "none", overflow: "hidden", background: "var(--qs-brand-soft,#e4f5fb)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}><img src="/assets/avatar-ali.webp" alt="علي حسين الزبيدي" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></span>
<p style={{ margin: "0", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-ink,#1d2733)", textWrap: "pretty" }}>رتّبوا لي رحلة إلى باكو خلال يومين — التأشيرة، الفندق، والجولات. حتى تغيير موعد العودة في اللحظة الأخيرة تولّوه بأنفسهم دون أي عناء عليّ.</p>
<div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "3px", paddingTop: "12px", borderTop: "1px solid var(--qs-line,#ececed)", width: "100%" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>علي حسين الزبيدي</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>رجل أعمال</span>
</div>
</div>
<div className="qa-testi-card" style={{ position: "relative", background: "#fff", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius,16px)", padding: "28px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "16px", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<span className="qa-testi-avatar" style={{ width: "112px", height: "112px", borderRadius: "50%", flex: "none", overflow: "hidden", background: "#fef3dc", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}><img src="/assets/avatar-saif.webp" alt="سيف الدين قاسم" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></span>
<p style={{ margin: "0", fontSize: "16px", lineHeight: "1.8", color: "var(--qs-ink,#1d2733)", textWrap: "pretty" }}>نتعامل معهم لسفر موظفينا منذ سنتين. الأسعار التعاقدية واضحة، والتعديلات على الحجوزات تُنجَز في نفس اليوم — هذا ما نحتاجه في سفر الأعمال.</p>
<div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "3px", paddingTop: "12px", borderTop: "1px solid var(--qs-line,#ececed)", width: "100%" }}>
<span style={{ fontSize: "17px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>سيف الدين قاسم</span>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>مدير إداري — شركة مقاولات</span>
</div>
</div>
</div>
<div className="qa-swipe-hint" aria-hidden="true">اسحب لرؤية المزيد ↔</div>
</section>
</div>
</>) : null}

{isContact ? (<>
<div className="qa-page">
<section className="qa-sec qa-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "64px", alignItems: "start" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
<h1 style={{ fontSize: "44px", fontWeight: "700" }} data-cx="1">تواصل معنا</h1>
<p style={{ fontSize: "18px", lineHeight: "1.75", color: "var(--qs-brand-deep,#22a9d4)" }}>هل لديك استفسار؟ ترغب بالتخطيط لرحلتك القادمة؟ فريق قصر المرايا للسفر والسياحة جاهز لخدمتك بكل احترافية وسرعة.</p>
<button className="qa-btn qa-amber" onClick={openWhatsapp} style={{ alignSelf: "flex-start", fontSize: "18px", padding: "16px 32px" }}>واتساب</button>
<div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "16px", color: "var(--qs-body,#3d4650)" }}>
<span dir="ltr" style={{ textAlign: "right" }}>00964-774-9999-600</span>
<span dir="ltr" style={{ textAlign: "right" }}>00964-784-9999-600</span>
<span>sales@almarayagroup.com</span>
<span>بغداد — قرب نزلة جسر 14 رمضان، مقابل مجمع النعيمي</span>
<span>أوقات الدوام: يومياً من 9 صباحاً حتى 12 منتصف الليل</span>
</div>
<img src="/assets/mascot-skylo-support.webp" alt="سكايلو في مركز الاتصال" style={{ width: "100%", maxWidth: "calc(var(--tw-poster,340px) + 80px)", borderRadius: "var(--tw-radius,16px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }} />
</div>
<div className="qa-card" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
{contactSent ? (<>
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px", textAlign: "center", padding: "20px 0" }}>
<span style={{ fontSize: "22px", fontWeight: "700", color: "var(--qs-brand-deep,#036f8c)" }}>شكراً لتواصلك معنا!</span>
<p style={{ margin: 0, fontSize: "16px", color: "var(--qs-body,#3d4650)" }}>استلمنا رسالتك وسيتواصل فريقنا معك في أقرب وقت.</p>
{contactWaHref ? (<>
<p style={{ margin: 0, fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>للرد أسرع، أرسل نفس الرسالة لنا على واتساب.</p>
<a href={contactWaHref} target="_blank" rel="noopener" className="qa-btn qa-amber" style={{ color: "var(--qs-ink,#012a37)" }}>أكمل المحادثة على واتساب</a>
</>) : null}
<button className="qa-btn qa-cyan" onClick={() => window.location.reload()}>إرسال رسالة أخرى</button>
</div>
</>) : (<>
<p style={{ fontSize: "18px", color: "var(--qs-ink,#1d2733)" }}>املأ النموذج وسنقوم بالتواصل معك في أقرب وقت.</p>
<div className="qa-2col" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "16px" }}>
<label style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "14px", fontWeight: "500", color: "var(--qs-ink,#1d2733)" }}>اسمك *</span><input value={contact.name} onChange={setContactField('name')} style={{ height: "46px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", padding: "0 16px", font: "inherit", fontSize: "16px", color: "var(--qs-ink,#1d2733)" }} /></label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "14px", fontWeight: "500", color: "var(--qs-ink,#1d2733)" }}>رقم الهاتف *</span><input type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="07xx xxx xxxx" value={contact.phone} onChange={setContactField('phone')} style={{ height: "46px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", padding: "0 16px", font: "inherit", fontSize: "16px", color: "var(--qs-ink,#1d2733)" }} /></label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "14px", fontWeight: "500", color: "var(--qs-ink,#1d2733)" }}>بريدك الإلكتروني (اختياري)</span><input type="email" inputMode="email" autoComplete="email" dir="ltr" value={contact.email} onChange={setContactField('email')} style={{ height: "46px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", padding: "0 16px", font: "inherit", fontSize: "16px", color: "var(--qs-ink,#1d2733)" }} /></label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "14px", fontWeight: "500", color: "var(--qs-ink,#1d2733)" }}>شركتك</span><input value={contact.company} onChange={setContactField('company')} style={{ height: "46px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", padding: "0 16px", font: "inherit", fontSize: "16px", color: "var(--qs-ink,#1d2733)" }} /></label>
</div>
<label style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "14px", fontWeight: "500", color: "var(--qs-ink,#1d2733)" }}>الموضوع *</span><select value={contact.subject} onChange={setContactField('subject')} style={{ height: "46px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", padding: "0 16px", font: "inherit", fontSize: "16px", color: "var(--qs-ink,#1d2733)" }}><option>حجز طيران</option><option>حجز فندق</option><option>تأشيرة</option><option>باقة أو جولة</option><option>أخرى</option></select></label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px" }}><span style={{ fontSize: "14px", fontWeight: "500", color: "var(--qs-ink,#1d2733)" }}>سؤالك *</span><textarea rows="5" value={contact.message} onChange={setContactField('message')} style={{ border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", padding: "12px 16px", font: "inherit", fontSize: "16px", color: "var(--qs-ink,#1d2733)", resize: "vertical" }}></textarea></label>
{contactError ? (<p style={{ margin: 0, background: "#fdecef", border: "1px solid #f7c3cc", borderRadius: "var(--tw-radius-xs,8px)", padding: "10px 14px", fontSize: "14px", color: "#d2324f" }}>{contactError}</p>) : null}
<button className="qa-btn qa-cyan" disabled={contactSending} style={{ alignSelf: "flex-start", fontSize: "18px", padding: "16px 32px", opacity: contactSending ? 0.6 : 1, cursor: contactSending ? 'not-allowed' : 'pointer' }} onClick={submitContact}>{contactSending ? 'جارٍ الإرسال...' : 'إرسال'}</button>
</>)}
</div>
</section>
</div>
</>) : null}



</main>
<footer style={{ background: "var(--qs-band,#049dc5)", color: "rgba(255,255,255,.95)" }}>
<div className="qa-foot" style={{ maxWidth: "1240px", margin: "0 auto", padding: "24px 32px 16px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(196px,1fr))", gap: "28px 24px", alignItems: "start" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
<div style={{ position: "relative", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "14px" }}>
<span style={{ flex: "none", width: "72px", height: "72px", borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center" }}>
<img src="/assets/logo-mark-tight.webp" alt="قصر المرايا" style={{ width: "54px", height: "54px", objectFit: "contain" }} />
</span>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
<p style={{ fontSize: "25px", fontWeight: "700", color: "#fff", margin: "0", lineHeight: "1.3" }}>رحلتك تبدي ويانا</p>
<span style={{ width: "56px", height: "3px", borderRadius: "2px", background: "#faab18" }}></span>
<p style={{ margin: "0", fontSize: "14px", lineHeight: "1.7", color: "rgba(255,255,255,.82)", maxWidth: "230px" }}>نأخذك إلى حيث تتمنى، لنصنع ذكريات لا تُنسى.</p>
</div>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<h4 style={{ fontSize: "18px", color: "#fff", margin: "0" }}>للتواصل</h4>
<a href={"tel:" + (contentContact ? contentContact.phone1.replace(/-/g, "") : "009647749999600")} dir="ltr" style={{ fontSize: "16px", whiteSpace: "nowrap", color: "rgba(255,255,255,.9)", textDecoration: "none", alignSelf: "flex-start" }}>{contentContact ? contentContact.phone1 : "00964-774-9999-600"}</a>
<a href={"tel:" + (contentContact ? contentContact.phone2.replace(/-/g, "") : "009647849999600")} dir="ltr" style={{ fontSize: "16px", whiteSpace: "nowrap", color: "rgba(255,255,255,.9)", textDecoration: "none", alignSelf: "flex-start" }}>{contentContact ? contentContact.phone2 : "00964-784-9999-600"}</a>
<a href={"mailto:" + (contentContact ? contentContact.email : "sales@almarayagroup.com")} style={{ fontSize: "16px", overflowWrap: "anywhere", color: "rgba(255,255,255,.9)", textDecoration: "none", alignSelf: "flex-start" }}>{contentContact ? contentContact.email : "sales@almarayagroup.com"}</a>
<span style={{ fontSize: "16px", lineHeight: "1.6" }}>{contentContact ? contentContact.address : "العراق: شارع 14 رمضان، بغداد"}</span>
<span style={{ fontSize: "15px", lineHeight: "1.6", color: "rgba(255,255,255,.85)" }}>أوقات الدوام: يومياً من 9 صباحاً حتى 12 منتصف الليل</span>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<h4 style={{ fontSize: "18px", color: "#fff", margin: "0" }}>خدماتنا</h4>
<a href="#" onClick={goFlights} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>حجوزات الطيران</a>
<a href="#" onClick={goFlights} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>حجوزات الفنادق</a>
<a href="#" onClick={goInsurance} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>تأمين السفر</a>
<a href="#" onClick={goGroups} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>سفر المجموعات والفعاليات</a>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<h4 style={{ fontSize: "18px", color: "#fff", margin: "0" }}>عن الشركة</h4>
<a href="#" onClick={goAbout} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>من نحن؟</a>
<a href="#" onClick={goAbout} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>رؤيتنا ورسالتنا</a>
<a href="#" onClick={goTerms} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>الشروط والأحكام</a>
<a href="#" onClick={goPrivacy} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>سياسة الخصوصية</a>
<a href="#" onClick={goFaq} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>الأسئلة الشائعة</a>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<h4 style={{ fontSize: "18px", color: "#fff", margin: "0" }}>مركز المعلومات</h4>
<a href="/news" style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>المدونة</a>
<a href="#" onClick={goJobs} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>التوظيف</a>
<a href="/news?category=tips" style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>نصائح السفر</a>
<a href="#" onClick={goFlights} style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>عروض السفر</a>
<a href="/assets/qaser-almaraya-company-profile-2026.pdf" target="_blank" rel="noopener" style={{ fontSize: "16px", color: "rgba(255,255,255,.85)", textDecoration: "none", width: "fit-content" }}>ملف تعريفي</a>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
<h4 style={{ fontSize: "18px", color: "#fff", margin: "0" }}>تابعنا</h4>
<div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
<a href="https://www.instagram.com/qaseralmaraya/?hl=ar" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram" style={{ width: "36px", height: "36px", borderRadius: "999px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none" }}><Icon name="instagram" size="19" /></a>
<a href="https://www.linkedin.com/company/qaseralmaraya" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn" style={{ width: "36px", height: "36px", borderRadius: "999px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none", fontSize: "15px", fontWeight: "700", letterSpacing: "-.02em" }}>in</a>
<a href="#" aria-label="X" title="X" style={{ width: "36px", height: "36px", borderRadius: "999px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none", fontSize: "16px", fontWeight: "600" }}>𝕏</a>
<a href="https://www.facebook.com/p/%D8%B4%D8%B1%D9%83%D8%A9-%D9%82%D8%B5%D8%B1-%D8%A7%D9%84%D9%85%D8%B1%D8%A7%D9%8A%D8%A7-%D9%84%D9%84%D8%B3%D9%81%D8%B1-%D9%88%D8%A7%D9%84%D8%B3%D9%8A%D8%A7%D8%AD%D8%A9-61567289284263/?locale=ar_AR" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook" style={{ width: "36px", height: "36px", borderRadius: "999px", background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textDecoration: "none", fontSize: "19px", fontWeight: "700", fontFamily: "Georgia,serif" }}>f</a>
</div>
</div>
<PaymentBadges />
</div>
<div style={{ borderTop: "1px solid rgba(255,255,255,.16)" }}>
<div style={{ maxWidth: "1240px", margin: "0 auto", padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
<span style={{ fontSize: "14px", color: "rgba(255,255,255,.6)" }}>© 2026 قصر المرايا للسفر و السياحة — رقم الإجازة 784 — جميع الحقوق محفوظة</span>

</div>
</div>
</footer>
</div>

{trackOpen ? (<>
<div style={{ position: "fixed", inset: "0", zIndex: "80", background: "rgba(1,42,55,.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={closeTrack}>
<div dir="rtl" onClick={stopTrack} style={{ width: "100%", maxWidth: "460px", maxHeight: "88vh", overflow: "auto", background: "#fff", borderRadius: "var(--tw-radius,16px)", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px", padding: "24px 24px 14px", borderBottom: "1px solid var(--qs-line,#ececed)" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
<span style={{ fontSize: "13px", fontWeight: "600", color: "#faab18" }}>تتبّع الطلب</span>
<h3 style={{ margin: "0", fontSize: "20px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>حالة طلب التأشيرة</h3>
</span>
<button type="button" onClick={closeTrack} aria-label="إغلاق" style={{ flex: "none", width: "34px", height: "34px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-ink-2,#5f666e)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="x" size={15} /></button>
</div>
{trackResult ? (<>
<div style={{ padding: "24px 24px 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>نتيجة البحث عن</span>
<span data-no-i18n="" style={{ fontSize: "16px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{trackQuery}</span>
</div>
{trackError ? (<p style={{ margin: 0, background: "#fdecef", border: "1px solid #f7c3cc", borderRadius: "var(--tw-radius-xs,8px)", padding: "10px 14px", fontSize: "14px", color: "#d2324f" }}>{trackError}</p>) : null}
{!trackError && (trackSteps || []).length === 0 ? (
<p style={{ margin: 0, fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>لم يتم العثور على أي طلب بهذا الرقم. تأكد من رقم الهاتف أو رقم الطلب وحاول مرة أخرى.</p>
) : null}
<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
{(trackSteps || []).map((step, $index) => (<React.Fragment key={$index}>
<div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
<span style={{ flex: "none", display: "grid", placeItems: "center", width: "34px", height: "34px", borderRadius: "50%", background: "var(--qs-brand-soft,#eaf8fd)", color: "var(--qs-brand-deep,#049dc5)" }}>
<Icon name={step.icon} size={16} />
</span>
<span style={{ display: "flex", flexDirection: "column", gap: "2px", paddingTop: "4px" }}>
<span style={{ fontSize: "14px", fontWeight: "700", color: "var(--qs-ink,#1d2733)" }}>{step.label}</span>
<span style={{ fontSize: "13px", color: "var(--qs-ink-2,#5f666e)" }}>{step.hint}</span>
</span>
</div>
</React.Fragment>))}
</div>
<button type="button" onClick={resetTrack} style={{ alignSelf: "flex-start", background: "none", border: "0", padding: "0", fontFamily: "inherit", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#036f8c)", cursor: "pointer" }}>تحقق من رقم آخر</button>
</div>
</>) : null}
{trackForm ? (<>
<div style={{ padding: "24px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
<p style={{ margin: "0", fontSize: "14px", lineHeight: "1.7", color: "var(--qs-ink-2,#5f666e)" }}>أدخل رقم هاتفك أو رقم الطلب الذي استلمته عند التقديم (مثال: QA-000012).</p>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>رقم الهاتف أو رقم الطلب
<input type="text" dir="ltr" value={trackInput} onChange={setTrackInput} placeholder="+964 7XX XXX XXXX أو QA-000012" style={{ fontFamily: "inherit", fontSize: "16px", padding: "12px 14px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", color: "var(--qs-ink,#1d2733)" }} />
</label>
{trackError ? (<p style={{ margin: 0, background: "#fdecef", border: "1px solid #f7c3cc", borderRadius: "var(--tw-radius-xs,8px)", padding: "10px 14px", fontSize: "14px", color: "#d2324f" }}>{trackError}</p>) : null}
<button type="button" onClick={submitTrack} disabled={trackSending} style={{ opacity: trackSending ? 0.6 : 1, cursor: trackSending ? 'not-allowed' : 'pointer' }} className="qa-btn qa-cyan">{trackSending ? 'جارٍ التحقق...' : 'تحقق من الحالة'}</button>
</div>
</>) : null}
</div>
</div>
</>) : null}

{applyOpen ? (<>
<div style={{ position: "fixed", inset: "0", zIndex: "60", background: "rgba(1,42,55,.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={closeApply}>
<div dir="rtl" onClick={stopClose} style={{ width: "100%", maxWidth: "640px", maxHeight: "88vh", overflow: "auto", background: "#fff", borderRadius: "28px", boxShadow: "var(--tw-card-shadow,0 1px 3px rgba(29,39,51,.06))" }}>
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", padding: "24px 28px 16px", borderBottom: "1px solid var(--qs-line,#ececed)" }}>
<div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
<span style={{ fontSize: "13px", fontWeight: "600", color: "#faab18" }}>تقديم على وظيفة</span>
<h3 style={{ fontFamily: "'IBM Plex Sans',system-ui,sans-serif", fontSize: "23px", fontWeight: "700", color: "var(--qs-ink,#1d2733)", margin: "0" }}>{applyJob}</h3>
<span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>الحقول المعلَّمة بـ * مطلوبة</span>
</div>
<button type="button" onClick={closeApply} aria-label="إغلاق" style={{ flex: "none", width: "38px", height: "38px", borderRadius: "50%", border: "1px solid var(--qs-line,#ececed)", background: "#fff", color: "var(--qs-ink-2,#5f666e)", display: "grid", placeItems: "center", cursor: "pointer" }}><Icon name="x" size={16} /></button>
</div>
{applySent ? (<>
<div style={{ padding: "32px 28px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
<img src="/assets/mascot-skylo-thankyou.webp" alt="" style={{ height: "150px", width: "auto" }} />
<h4 style={{ fontSize: "23px", fontWeight: "700", color: "var(--qs-brand-deep,#22a9d4)", margin: "0" }}>تم إرسال طلبك</h4>
<p style={{ fontSize: "16px", lineHeight: "1.8", color: "var(--qs-body,#3d4650)", margin: "0", maxWidth: "430px" }}>شكرًا لاهتمامك بالانضمام إلى قصر المرايا. سيراجع فريقنا ملفك ويتواصل معك على الرقم الذي أدخلته.</p>
<button className="qa-btn qa-cyan" onClick={closeApply}>إغلاق</button>
</div>
</>) : null}
{applyForm ? (<>
<div style={{ padding: "24px 28px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>
<div className="qa-2col" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "16px" }}>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>الاسم الكامل *
<input type="text" value={afName} onChange={setAfName} placeholder="الاسم كما في الهوية" style={{ boxSizing: "border-box", width: "100%", fontFamily: "inherit", fontSize: "16px", padding: "12px 14px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", color: "var(--qs-ink,#1d2733)" }} />
</label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>رقم الهاتف *
<input type="tel" dir="ltr" value={afPhone} onChange={setAfPhone} placeholder="+964 7XX XXX XXXX" style={{ boxSizing: "border-box", width: "100%", fontFamily: "inherit", fontSize: "16px", padding: "12px 14px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", color: "var(--qs-ink,#1d2733)" }} />
</label>
</div>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>البريد الإلكتروني *
<input type="email" dir="ltr" value={afEmail} onChange={setAfEmail} placeholder="name@example.com" style={{ boxSizing: "border-box", width: "100%", fontFamily: "inherit", fontSize: "16px", padding: "12px 14px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", color: "var(--qs-ink,#1d2733)" }} />
</label>
<label style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>ما الذي يمكنك إضافته إلى فريقنا؟ *
<textarea rows="4" value={afBring} onChange={setAfBring} placeholder="اكتب باختصار عن خبرتك وما يميّزك" style={{ boxSizing: "border-box", width: "100%", fontFamily: "inherit", fontSize: "16px", lineHeight: "1.7", padding: "12px 14px", border: "1px solid var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-xs,8px)", background: "#fff", color: "var(--qs-ink,#1d2733)", resize: "vertical" }}></textarea>
</label>
<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
<label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", background: "var(--qs-paper,#f8f7f8)", border: "1px dashed var(--qs-line-2,#bfe9f6)", borderRadius: "var(--tw-radius-sm,10px)", padding: "14px 16px", cursor: "pointer" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "15px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>السيرة الذاتية *</span><span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>{fileUploading.cv ? 'جارٍ الرفع...' : cvName}</span></span>
<span style={{ flex: "none", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#22a9d4)" }}>اختر ملفًا</span>
<input type="file" accept=".pdf,.doc,.docx" onChange={pickCv} style={{ display: "none" }} />
</label>
<label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", background: "var(--qs-paper,#f8f7f8)", border: "1px dashed var(--qs-line-2,#bfe9f6)", borderRadius: "var(--tw-radius-sm,10px)", padding: "14px 16px", cursor: "pointer" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "15px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>رسالة التقديم *</span><span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>{fileUploading.cover ? 'جارٍ الرفع...' : coverName}</span></span>
<span style={{ flex: "none", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#22a9d4)" }}>اختر ملفًا</span>
<input type="file" accept=".pdf,.doc,.docx" onChange={pickCover} style={{ display: "none" }} />
</label>
<label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "14px", background: "#fff", border: "1px dashed var(--qs-line,#ececed)", borderRadius: "var(--tw-radius-sm,10px)", padding: "14px 16px", cursor: "pointer" }}>
<span style={{ display: "flex", flexDirection: "column", gap: "2px" }}><span style={{ fontSize: "15px", fontWeight: "600", color: "var(--qs-ink,#1d2733)" }}>نماذج من أعمالك (اختياري)</span><span style={{ fontSize: "14px", color: "var(--qs-ink-2,#5f666e)" }}>{fileUploading.work ? 'جارٍ الرفع...' : workName}</span></span>
<span style={{ flex: "none", fontSize: "14px", fontWeight: "600", color: "var(--qs-brand-deep,#22a9d4)" }}>اختر ملفًا</span>
<input type="file" onChange={pickWork} style={{ display: "none" }} />
</label>
</div>
{applyError ? (<>
<p style={{ margin: "0", background: "#fdecef", border: "1px solid #f7c3cc", borderRadius: "var(--tw-radius-sm,10px)", padding: "12px 16px", fontSize: "15px", fontWeight: "500", color: "#d2324f" }}>{applyErrorText}</p>
</>) : null}
<div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", paddingTop: "2px" }}>
<button className="qa-btn qa-cyan" disabled={applySending} style={{ opacity: applySending ? 0.6 : 1, cursor: applySending ? 'not-allowed' : 'pointer' }} onClick={submitApply}>{applySending ? 'جارٍ الإرسال...' : 'إرسال الطلب'}</button>
<button type="button" onClick={closeApply} style={{ background: "none", border: "0", fontFamily: "inherit", fontSize: "15px", fontWeight: "600", color: "var(--qs-ink-2,#5f666e)", cursor: "pointer" }}>إلغاء</button>
</div>
</div>
</>) : null}
</div>
</div>
</>) : null}
{loading ? (<>
<MascotLoader assetBase="/assets" />
</>) : null}


    </>
  );
}
