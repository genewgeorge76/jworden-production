import { useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'

interface HeaderNavProps {
  isOpen: boolean
  onClose: () => void
}

export default function HeaderNav({ isOpen, onClose }: HeaderNavProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[150] bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <nav
        className="fixed top-0 right-0 z-[200] h-full w-72 bg-[#111] shadow-2xl flex flex-col"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#c8a84b]">
          <span className="text-[#c8a84b] text-[0.85rem] font-bold uppercase tracking-widest">
            Menu
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-white hover:text-[#c8a84b] transition-colors text-2xl leading-none cursor-pointer"
            aria-label="Close navigation menu"
          >
            &times;
          </button>
        </div>
        <div className="flex flex-col gap-1 px-4 py-6">
          <Link
            to="/dashboard"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333] font-bold"
          >
            📊 Dashboard
          </Link>
          <Link
            to="/dispatch"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333] font-bold"
          >
            🚛 Dispatch Node
          </Link>
          <Link
            to="/"
            hash="about"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2 border-b border-[#333]"
          >
            About
          </Link>
          <Link
            to="/"
            hash="services"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2 border-b border-[#333]"
          >
            Services
          </Link>
          <Link
            to="/commercial"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2 border-b border-[#333]"
          >
            Commercial
          </Link>
          <Link
            to="/gallery"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2 border-b border-[#333]"
          >
            📸 Project Gallery
          </Link>
          <Link
            to="/locations/mclean"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2 border-b border-[#333]"
          >
            McLean
          </Link>
          <Link
            to="/locations/windsor-farms"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2 border-b border-[#333]"
          >
            Windsor Farms
          </Link>
          <Link
            to="/"
            hash="standard"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2 border-b border-[#333]"
          >
            Our Standard
          </Link>
          <Link
            to="/estimate"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333] font-bold"
          >
            📐 3D Estimator
          </Link>
          <Link
            to="/"
            hash="contact"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2"
          >
            Contact
          </Link>
          <Link
            to="/legal-compliance"
            onClick={onClose}
            className="text-white text-[0.9rem] uppercase tracking-wider hover:text-[#c8a84b] transition-colors py-3 px-2 border-b border-[#333]"
          >
            Legal Counsel
          </Link>
          <Link
            to="/litigation"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333]"
          >
            ⚖️ Legal Engine
          </Link>
          <Link
            to="/command-center"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333] font-bold"
          >
            🛡 Command Center
          </Link>
          <Link
            to="/pre-con-dashboard"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333]"
          >
            ⚡ God-Mode Dashboard
          </Link>
          <Link
            to="/profit-node"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333]"
          >
            💰 Profit Node
          </Link>
          <Link
            to="/investor-roi"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333]"
          >
            📈 Investor ROI
          </Link>
          <Link
            to="/weather-intel"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333]"
          >
            ⛈ Weather Intel
          </Link>
          <Link
            to="/pre-con"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333]"
          >
            🏗 Pre-Con AI
          </Link>
          <Link
            to="/dispatch-node"
            onClick={onClose}
            className="text-[#c8a84b] text-[0.9rem] uppercase tracking-wider hover:text-white transition-colors py-3 px-2 border-b border-[#333]"
          >
            🌡 90-Day Forecast
          </Link>
        </div>
        <div className="mt-auto px-4 pb-8">
          <a
            href="tel:8044461296"
            className="block w-full bg-[#c8a84b] text-[#111] text-center py-3 rounded-sm text-[0.9rem] font-bold uppercase tracking-widest hover:bg-[#e0c06a] transition-colors"
          >
            Call 804-446-1296
          </a>
        </div>
      </nav>
    </>
  )
}
