import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import LandingBlueprint from '@/components/landing/LandingBlueprint'
import { getLandingBySlug } from '@/lib/landingPages'

export default function LandingPage() {
  const { slug } = useParams()
  const page = getLandingBySlug(slug || '')

  if (!page) {
    return <Navigate to="/" replace />
  }

  return <LandingBlueprint page={page} />
}
