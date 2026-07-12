import React from 'react';
import { formatDollars } from '@jworden/core';

interface Props {
  value: number;
  className?: string;
}

export function DollarValue({ value, className }: Props) {
  return <span className={className}>{formatDollars(value)}</span>;
}
