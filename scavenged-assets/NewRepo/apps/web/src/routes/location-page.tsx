import React from 'react';
import { useParams, notFound } from '@tanstack/react-router';
import { getLocationBySlug, getNearbyLocations } from '@jworden/core';
import { CURRENT_TENANT } from '../config/tenant';
import { LocationPage } from '../components/LocationPage';

export function LocationPageRoute() {
  const { slug } = useParams({ strict: false });
  const location = getLocationBySlug(slug ?? '', CURRENT_TENANT);

  if (!location) {
    notFound();
    return null;
  }

  const nearby = getNearbyLocations(location.slug, CURRENT_TENANT, 8);

  return <LocationPage location={location} nearby={nearby} tenant={CURRENT_TENANT} />;
}
