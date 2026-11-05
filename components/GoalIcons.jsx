'use client';
import PhosphorIcon from './PhosphorIcon';

/*
 * Icons for the "company goals" cards: Phosphor duotone (designer-made, MIT).
 * Colour follows currentColor, so the same icon works on the cyan and the
 * gold badges.
 */

export function GoalServices({ size = 32, label = 'خدمات سياحية متكاملة' }) {
  return <PhosphorIcon name="suitcase-rolling" size={size} label={label} />;
}

export function GoalTrust({ size = 32, label = 'رضا العملاء وبناء الثقة' }) {
  return <PhosphorIcon name="hand-heart" size={size} label={label} />;
}

export function GoalExpansion({ size = 32, label = 'توسع محلي ودولي' }) {
  return <PhosphorIcon name="globe-hemisphere-east" size={size} label={label} />;
}

export function GoalTech({ size = 32, label = 'الابتكار والتطوير التقني' }) {
  return <PhosphorIcon name="lightbulb" size={size} label={label} />;
}

export function GoalHeritage({ size = 32, label = 'ترويج السياحة المحلية' }) {
  return <PhosphorIcon name="mosque" size={size} label={label} />;
}

export function GoalSafety({ size = 32, label = 'توفير تجربة سفر آمنة' }) {
  return <PhosphorIcon name="shield-check" size={size} label={label} />;
}
