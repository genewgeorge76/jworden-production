import React from 'react';
import { BUSINESS_PHONE } from '@jworden/core';

interface Props {
  className?: string;
  label?: string;
}

export function PhoneLink({ className, label }: Props) {
  const raw = BUSINESS_PHONE.replace(/\D/g, '');
  return (
    <a href={`tel:+1${raw}`} className={className}>
      {label ?? BUSINESS_PHONE}
    </a>
  );
}
