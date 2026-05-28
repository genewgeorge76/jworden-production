import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../api/client'

export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    trackPageView(pathname, document.title)
  }, [pathname])
  return null
}
