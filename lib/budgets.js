// Budget buckets (IQD per adult), shared by the packages filters and the
// homepage trip finder.
export const BUDGETS = [
  { id: 'b1', ar: 'أقل من مليون', en: 'Under 1M', min: 0, max: 1000000 },
  { id: 'b2', ar: 'مليون – مليونين', en: '1M – 2M', min: 1000000, max: 2000000 },
  { id: 'b3', ar: 'مليونين – 3 ملايين', en: '2M – 3M', min: 2000000, max: 3000000 },
  { id: 'b4', ar: 'أكثر من 3 ملايين', en: 'Over 3M', min: 3000000, max: Infinity },
];
