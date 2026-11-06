'use client';
import Icon from './Icon';

// The six "goals" icons on the homepage use the same Lucide set as the rest of
// the site (one icon family everywhere, no second style).
const goal = (name) => {
  function Goal({ size = 32 }) {
    return <Icon name={name} size={size} strokeWidth={1.75} />;
  }
  Goal.displayName = 'Goal_' + name;
  return Goal;
};

export const GoalServices = goal('luggage');
export const GoalTrust = goal('heart-handshake');
export const GoalExpansion = goal('globe');
export const GoalTech = goal('lightbulb');
export const GoalHeritage = goal('landmark');
export const GoalSafety = goal('shield-check');
