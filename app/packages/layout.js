import { pageMeta } from '../../lib/seo';

export const metadata = pageMeta({
  title: 'الباقات السياحية والمجموعات',
  description: 'باقات سياحية من بغداد بسعر واحد للفرد: تركيا، تونس، ماليزيا، أذربيجان وغيرها. طيران وفنادق وجولات، واحجز بسهولة عبر واتساب أو الرقم المختصر 6393.',
  path: '/packages',
});

export default function PackagesLayout({ children }) { return children; }
