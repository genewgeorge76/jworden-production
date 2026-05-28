import React from 'react';
import { Flame, TrendingUp, Snowflake, Circle } from 'lucide-react';

const TIER_CONFIG = {
  hot: {
    icon: Flame,
    label: 'HOT',
    bgClass: 'bg-red-500/15 border-red-500/40',
    textClass: 'text-red-400',
    iconClass: 'text-red-400',
  },
  warm: {
    icon: TrendingUp,
    label: 'WARM',
    bgClass: 'bg-primary/15 border-primary/40',
    textClass: 'text-primary',
    iconClass: 'text-primary',
  },
  cool: {
    icon: Circle,
    label: 'COOL',
    bgClass: 'bg-sky-500/15 border-sky-500/40',
    textClass: 'text-sky-400',
    iconClass: 'text-sky-400',
  },
  cold: {
    icon: Snowflake,
    label: 'COLD',
    bgClass: 'bg-muted/50 border-border',
    textClass: 'text-muted-foreground',
    iconClass: 'text-muted-foreground',
  },
};

/**
 * Compact priority badge for a scored lead.
 * size: 'sm' | 'md' | 'lg'
 */
export default function LeadScoreBadge({ score, tier, size = 'md', showScore = true }) {
  if (score == null && !tier) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-border text-muted-foreground font-display text-[10px] tracking-[0.2em] uppercase">
        Unscored
      </span>
    );
  }

  const config = TIER_CONFIG[tier] || TIER_CONFIG.cool;
  const Icon = config.icon;

  const sizing = {
    sm: { pad: 'px-2 py-0.5', text: 'text-[10px]', iconSize: 'w-3 h-3', scoreText: 'text-xs' },
    md: { pad: 'px-2.5 py-1', text: 'text-[11px]', iconSize: 'w-3.5 h-3.5', scoreText: 'text-sm' },
    lg: { pad: 'px-3 py-1.5', text: 'text-xs', iconSize: 'w-4 h-4', scoreText: 'text-base' },
  }[size] || {};

  return (
    <span
      className={`inline-flex items-center gap-1.5 border ${config.bgClass} ${sizing.pad} font-display tracking-[0.2em] uppercase`}
      title={`AI lead score: ${score}/100`}
    >
      <Icon className={`${sizing.iconSize} ${config.iconClass}`} />
      <span className={`${config.textClass} ${sizing.text} font-bold`}>{config.label}</span>
      {showScore && score != null && (
        <span className={`${config.textClass} ${sizing.scoreText} font-black`}>
          {score}
        </span>
      )}
    </span>
  );
}
