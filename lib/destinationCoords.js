// Approximate coordinates for common destinations, matched against a
// package's destination text (Arabic or English). Used to auto-populate
// pins on the 3D globe from whatever destinations actually have packages,
// with no extra admin data entry required.
const DESTINATION_COORDS = [
  { match: /دبي|dubai/i, lat: 25.2048, lng: 55.2708 },
  { match: /أبوظبي|abu ?dhabi/i, lat: 24.4539, lng: 54.3773 },
  { match: /كوالالمبور|kuala ?lumpur/i, lat: 3.1390, lng: 101.6869 },
  { match: /بالي|\bbali\b/i, lat: -8.3405, lng: 115.0920 },
  { match: /ماليزيا|malaysia/i, lat: 3.1390, lng: 101.6869 },
  { match: /إندونيسيا|indonesia/i, lat: -6.2088, lng: 106.8456 },
  { match: /إسطنبول|istanbul/i, lat: 41.0082, lng: 28.9784 },
  { match: /طرابزون|trabzon/i, lat: 41.0027, lng: 39.7168 },
  { match: /تركيا|turkey/i, lat: 39.0, lng: 35.0 },
  { match: /جورجيا|georgia|تبليسي|tbilisi/i, lat: 41.7151, lng: 44.8271 },
  { match: /باكو|azerbaijan|أذربيجان/i, lat: 40.4093, lng: 49.8671 },
  { match: /القاهرة|مصر|cairo|egypt/i, lat: 30.0444, lng: 31.2357 },
  { match: /بيروت|لبنان|beirut|lebanon/i, lat: 33.8938, lng: 35.5018 },
  { match: /عمّان|عمان الأردن|amman|\bjordan\b/i, lat: 31.9539, lng: 35.9106 },
  { match: /مكة|المدينة|السعودية|mecca|medina|saudi/i, lat: 21.3891, lng: 39.8579 },
  { match: /الدوحة|قطر|doha|qatar/i, lat: 25.2854, lng: 51.5310 },
  { match: /الكويت|kuwait/i, lat: 29.3759, lng: 47.9774 },
  { match: /مسقط|عُمان|\boman\b|muscat/i, lat: 23.5880, lng: 58.3829 },
  { match: /المنامة|البحرين|bahrain|manama/i, lat: 26.2285, lng: 50.5860 },
  { match: /لندن|بريطانيا|london|england/i, lat: 51.5072, lng: -0.1276 },
  { match: /باريس|فرنسا|paris|france/i, lat: 48.8566, lng: 2.3522 },
  { match: /روما|إيطاليا|\brome\b|italy/i, lat: 41.9028, lng: 12.4964 },
  { match: /برشلونة|مدريد|إسبانيا|spain|madrid|barcelona/i, lat: 40.4168, lng: -3.7038 },
  { match: /سويسرا|switzerland/i, lat: 46.8182, lng: 8.2275 },
  { match: /النمسا|austria|فيينا|vienna/i, lat: 48.2082, lng: 16.3738 },
  { match: /نيويورك|new ?york/i, lat: 40.7128, lng: -74.0060 },
  { match: /طوكيو|اليابان|tokyo|japan/i, lat: 35.6762, lng: 139.6503 },
  { match: /بغداد|baghdad/i, lat: 33.3152, lng: 44.3661 },
  { match: /النجف|najaf/i, lat: 32.0286, lng: 44.3487 },
  { match: /كربلاء|karbala/i, lat: 32.6160, lng: 44.0249 },
  { match: /البصرة|basrah|\bbasra\b/i, lat: 30.5085, lng: 47.7835 },
  { match: /أربيل|erbil/i, lat: 36.1911, lng: 44.0092 },
  { match: /الموصل|mosul/i, lat: 36.3489, lng: 43.1189 },
  { match: /الناصرية|nasiriyah/i, lat: 31.0559, lng: 46.2585 },
];

export function lookupDestinationCoords(name) {
  if (!name) return null;
  const hit = DESTINATION_COORDS.find((d) => d.match.test(name));
  return hit ? { lat: hit.lat, lng: hit.lng } : null;
}
