import React from 'react';
import type { PavingDecision } from '@jworden/core';

interface Props {
  decision: PavingDecision;
  className?: string;
}

const COLOR: Record<PavingDecision, string> = {
  'GO': 'bg-green-500',
  'CAUTION': 'bg-yellow-500',
  'NO-GO': 'bg-red-500',
};

export function DecisionBadge({ decision, className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold text-white ${COLOR[decision]} ${className}`}>
      {decision}
    </span>
  );
}
