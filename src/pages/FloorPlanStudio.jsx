/**
 * FloorPlanStudio — GC Interior & Floor Plan Design Tool
 *
 * A Houzz-style interactive 3D floor plan builder with live cost estimation.
 *
 * Workflow:
 *   1. Add rooms via the left panel (type, width, length)
 *   2. Watch them appear in the 3D canvas — drag/rotate with orbit controls
 *   3. Select a room to see its cost breakdown from the catalog
 *   4. Right panel shows total project estimate pulled from the backend catalog
 *   5. Send to quote — pre-fills the quote form with the estimate
 */
import { useState, useCallback, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import SEO from '@/components/SEO'
import { api, trackEvent } from '@/api/client'

const GCFloorPlanCanvas = lazy(() => import('../components/GCFloorPlanCanvas'))

// ── Room type catalog (client-side, mirrors backend catalog categories) ───────
const ROOM_TYPES = [
  { value: 'living',   label: 'Living Room',  defaultW: 18, defaultL: 20 },
  { value: 'kitchen',  label: 'Kitchen',      defaultW: 14, defaultL: 16 },
  { value: 'bedroom',  label: 'Bedroom',      defaultW: 12, defaultL: 14 },
  { value: 'bathroom', label: 'Bathroom',     defaultW: 8,  defaultL: 10 },
  { value: 'garage',   label: 'Garage',       defaultW: 22, defaultL: 24 },
  { value: 'office',   label: 'Home Office',  defaultW: 12, defaultL: 12 },
  { value: 'dining',   label: 'Dining Room',  defaultW: 14, defaultL: 14 },
  { value: 'hallway',  label: 'Hallway',      defaultW: 4,  defaultL: 20 },
  { value: 'other',    label: 'Other',        defaultW: 12, defaultL: 12 },
]

// Rough $/sqft estimate per room type (material + labor) for instant client estimates
// Real estimates use the backend product catalog.
const QUICK_RATES = {
  living:   { floor: 6.5,  paint: 1.8,  trim: 2.2  },
  kitchen:  { floor: 9.0,  paint: 2.0,  cabinet: 85, counter: 55 },
  bedroom:  { floor: 5.5,  paint: 1.8,  trim: 1.8  },
  bathroom: { floor: 12.0, tile: 18.0,  vanity: 900, fixture: 600 },
  garage:   { floor: 4.5,  paint: 0.8               },
  office:   { floor: 6.0,  paint: 1.8,  trim: 2.0  },
  dining:   { floor: 7.0,  paint: 1.8,  trim: 2.2  },
  hallway:  { floor: 8.0,  paint: 2.0               },
  other:    { floor: 5.0,  paint: 1.5               },
}

function quickEstimate(rooms) {
  return rooms.reduce((total, room) => {
    const sqft = room.widthFt * room.lengthFt
    const rates = QUICK_RATES[room.type] || QUICK_RATES.other
    const rateSum = Object.values(rates).reduce((a, b) => a + b, 0)
    return total + sqft * rateSum
  }, 0)
}

let _nextId = 1
function newRoom(type) {
  const rt = ROOM_TYPES.find((r) => r.value === type) || ROOM_TYPES[0]
  return {
    id: _nextId++,
    name: rt.label,
    type: rt.value,
    widthFt: rt.defaultW,
    lengthFt: rt.defaultL,
    x: 0,
    z: 0,
  }
}

function layoutRooms(rooms) {
  // Simple auto-layout: place rooms left-to-right with 2ft gap
  let cursor = 0
  return rooms.map((room) => {
    const positioned = { ...room, x: cursor, z: 0 }
    cursor += room.widthFt + 2
    return positioned
  })
}

// ── Add Room Form ────────────────────────────────────────────────────────────
function AddRoomPanel({ onAdd }) {
  const [type, setType]   = useState('living')
  const [width, setWidth] = useState(18)
  const [len, setLen]     = useState(20)

  const rt = ROOM_TYPES.find((r) => r.value === type)

  const handleTypeChange = (v) => {
    const def = ROOM_TYPES.find((r) => r.value === v)
    setType(v)
    setWidth(def.defaultW)
    setLen(def.defaultL)
  }

  const handleAdd = () => {
    onAdd({ type, widthFt: Number(width), lengthFt: Number(len) })
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Add Room</h3>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full rounded bg-zinc-800 border border-zinc-700 text-sm text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {ROOM_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>{rt.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1">Width (ft)</label>
          <input
            type="number" min={4} max={100} value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full rounded bg-zinc-800 border border-zinc-700 text-sm text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1">Length (ft)</label>
          <input
            type="number" min={4} max={100} value={len}
            onChange={(e) => setLen(e.target.value)}
            className="w-full rounded bg-zinc-800 border border-zinc-700 text-sm text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="text-xs text-zinc-500 text-right">
        {Number(width) * Number(len)} sq ft
      </div>
      <button
        onClick={handleAdd}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded py-2 transition-colors"
      >
        + Add Room
      </button>
    </div>
  )
}

// ── Room List ─────────────────────────────────────────────────────────────────
function RoomList({ rooms, selected, onSelect, onRemove, onUpdate }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Floor Plan ({rooms.length} rooms)
      </h3>
      {rooms.length === 0 && (
        <p className="text-xs text-zinc-500 italic">No rooms yet — add one above.</p>
      )}
      {rooms.map((room) => (
        <div
          key={room.id}
          onClick={() => onSelect(room.id === selected ? null : room.id)}
          className={`rounded p-2 cursor-pointer border transition-colors ${
            room.id === selected
              ? 'border-blue-500 bg-blue-900/30'
              : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">{room.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(room.id) }}
              className="text-zinc-500 hover:text-red-400 text-xs px-1"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-zinc-400">
            {room.widthFt}′ × {room.lengthFt}′ = {room.widthFt * room.lengthFt} sq ft
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Cost Panel ────────────────────────────────────────────────────────────────
function CostPanel({ rooms, selectedRoom }) {
  const totalSqft = rooms.reduce((s, r) => s + r.widthFt * r.lengthFt, 0)
  const estimate  = quickEstimate(rooms)
  const sel       = rooms.find((r) => r.id === selectedRoom)

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Cost Estimate</h3>

      {sel && (
        <div className="rounded bg-zinc-800 border border-zinc-700 p-3 space-y-2">
          <p className="text-sm font-semibold text-white">{sel.name}</p>
          {Object.entries(QUICK_RATES[sel.type] || QUICK_RATES.other).map(([trade, rate]) => {
            const sqft = sel.widthFt * sel.lengthFt
            const isFixedItem = rate > 100 // vanity, fixture, cabinets etc.
            const cost = isFixedItem ? rate : sqft * rate
            return (
              <div key={trade} className="flex justify-between text-xs text-zinc-300">
                <span className="capitalize">{trade}</span>
                <span>${Math.round(cost).toLocaleString()}{!isFixedItem && ' est.'}</span>
              </div>
            )
          })}
        </div>
      )}

      <div className="rounded bg-zinc-900 border border-zinc-700 p-3 space-y-2">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Total Sq Ft</span>
          <span>{totalSqft.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>Rooms</span>
          <span>{rooms.length}</span>
        </div>
        <div className="border-t border-zinc-700 pt-2 flex justify-between text-sm font-bold text-white">
          <span>Rough Estimate</span>
          <span className="text-green-400">${Math.round(estimate).toLocaleString()}</span>
        </div>
        <p className="text-[10px] text-zinc-500">
          Preliminary estimate based on standard regional rates. Final pricing from product catalog.
        </p>
      </div>

      <Link
        to={`/quote?sqft=${totalSqft}&service_type=general_contracting&estimate=${Math.round(estimate)}`}
        className="block w-full text-center border border-zinc-700 hover:border-amber-400 text-zinc-200 text-sm font-semibold rounded py-2 transition-colors"
      >
        Full Project Quote
      </Link>
    </div>
  )
}

function DesignPacketPanel({ rooms }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', projectGoal: '' })
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const totalSqft = rooms.reduce((sum, room) => sum + room.widthFt * room.lengthFt, 0)
  const estimate = quickEstimate(rooms)
  const roomSummary = rooms
    .map((room) => `${room.name}: ${room.widthFt}x${room.lengthFt} (${room.widthFt * room.lengthFt} sq ft)`)
    .join('; ')

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setStatus('error')
      setMessage('Name and email are required to reserve a design packet.')
      return
    }

    setStatus('submitting')
    setMessage('')
    try {
      const result = await api.submitVisualProposal({
        name: form.name,
        email: form.email,
        phone: form.phone,
        notes: [
          '[4D Floor Plan Studio]',
          form.projectGoal ? `Owner goal: ${form.projectGoal}` : '',
          `Rooms: ${roomSummary}`,
          `Client-side rough interior estimate: $${Math.round(estimate).toLocaleString()}`,
        ].filter(Boolean).join('\n'),
        build_type: 'addition',
        property_type: 'residential',
        sqft: Math.max(totalSqft, 100),
        floors: 1,
        ground_material: null,
        exterior_material: 'interior_design_packet',
        roof_color: null,
        state_code: null,
        address: null,
      })

      trackEvent('floor_plan_design_packet_submitted', {
        lead_id: result.lead_id,
        sqft: totalSqft,
        rooms: rooms.length,
      })

      if (!result.lead_id) {
        setStatus('done')
        setMessage('Design packet saved. Call the office to reserve paid review because checkout needs a lead ID.')
        return
      }

      setStatus('checkout')
      const successUrl = `${window.location.origin}/floor-plan-studio?payment=success`
      const cancelUrl = `${window.location.origin}/floor-plan-studio?payment=cancel`
      const checkout = await api.createCheckoutSession(result.lead_id, successUrl, cancelUrl)
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
      if (stripeKey && checkout.checkout_session_id?.startsWith('cs_')) {
        const stripe = await loadStripe(stripeKey)
        const redirect = await stripe?.redirectToCheckout({ sessionId: checkout.checkout_session_id })
        if (redirect?.error) throw new Error(redirect.error.message || 'Stripe redirect failed')
        return
      }
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url
        return
      }
      setStatus('error')
      setMessage('Payment link unavailable. Please call the office to reserve this design packet.')
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Could not reserve the design packet. Please call the office.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded bg-amber-400/10 border border-amber-400/30 p-3 space-y-3">
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">Paid 4D Design Packet</h3>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          Turn this room model into a reviewed kitchen, addition, remodel, or interior planning packet.
        </p>
      </div>
      <input
        required
        value={form.name}
        onChange={(event) => update('name', event.target.value)}
        placeholder="Name"
        className="w-full rounded bg-zinc-950 border border-zinc-700 text-sm text-white px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
      <input
        required
        type="email"
        value={form.email}
        onChange={(event) => update('email', event.target.value)}
        placeholder="Email"
        className="w-full rounded bg-zinc-950 border border-zinc-700 text-sm text-white px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
      <input
        type="tel"
        value={form.phone}
        onChange={(event) => update('phone', event.target.value)}
        placeholder="Phone"
        className="w-full rounded bg-zinc-950 border border-zinc-700 text-sm text-white px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
      <textarea
        value={form.projectGoal}
        onChange={(event) => update('projectGoal', event.target.value)}
        placeholder="Kitchen remodel, addition, patio tie-in, finishes, budget concerns..."
        rows={3}
        className="w-full resize-none rounded bg-zinc-950 border border-zinc-700 text-sm text-white px-2 py-2 focus:outline-none focus:ring-1 focus:ring-amber-400"
      />
      <button
        type="submit"
        disabled={status === 'submitting' || status === 'checkout'}
        className="w-full rounded bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-black uppercase tracking-[0.12em] py-2.5 transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? 'Saving Design...' : status === 'checkout' ? 'Starting Checkout...' : 'Reserve Design Packet'}
      </button>
      {message && <p className={`text-xs ${status === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{message}</p>}
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FloorPlanStudio() {
  const [rooms, setRooms]       = useState([
    { ...newRoom('living'),  widthFt: 18, lengthFt: 20, x: 0,  z: 0 },
    { ...newRoom('kitchen'), widthFt: 14, lengthFt: 16, x: 20, z: 0 },
    { ...newRoom('bedroom'), widthFt: 12, lengthFt: 14, x: 36, z: 0 },
  ])
  const [selected, setSelected] = useState(null)

  const handleAdd = useCallback(({ type, widthFt, lengthFt }) => {
    setRooms((prev) => {
      const room = { ...newRoom(type), widthFt, lengthFt }
      const laid = layoutRooms([...prev, room])
      return laid
    })
  }, [])

  const handleRemove = useCallback((id) => {
    setRooms((prev) => layoutRooms(prev.filter((r) => r.id !== id)))
    setSelected((s) => (s === id ? null : s))
  }, [])

  const laid = layoutRooms(rooms)

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SEO
        title="4D Interior Design Studio | Kitchen Remodels, Additions & Floor Plans"
        description="A premium JWORDENAI floor plan and interior design studio for kitchen remodels, additions, room planning, live cost ranges, and future-ready GC decision support."
        canonicalPath="/floor-plan-studio"
      />
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black/40 px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-400">JWORDENAI interior design source layer</p>
            <h1 className="mt-2 font-display text-3xl font-black uppercase leading-none tracking-tight text-white md:text-5xl">
              4D Interior Design Studio
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-base">
              Old remodel planning was flat drawings, guessing, and sticker shock. New tech brings the customer dream into future reality: rooms, kitchen layouts, additions, finishes, live scope ranges, and phased GC planning in one premium studio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/general-contracting" className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-300 hover:border-amber-400 hover:text-white">
              GC Services
            </Link>
            <Link to="/visualizer" className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-amber-300 hover:bg-amber-400 hover:text-black">
              3D Build Visualizer
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-4 md:px-6">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['Kitchen Remodels', 'Cabinet, counter, flooring, lighting, and appliance-move planning.'],
            ['Additions', 'Room massing, square footage, layout, and budget signals before drawings.'],
            ['Interior Design', 'Finish direction and room-by-room scope without confusing proposal language.'],
            ['4D Phasing', 'Design, permits, demo, rough-in, finishes, inspection, and handoff.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-zinc-800 bg-black/30 p-4">
              <p className="font-display text-lg font-black uppercase leading-tight text-white">{title}</p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="w-64 border-r border-zinc-800 overflow-y-auto p-4 space-y-6 shrink-0">
          <AddRoomPanel onAdd={handleAdd} />
          <hr className="border-zinc-800" />
          <RoomList
            rooms={rooms}
            selected={selected}
            onSelect={setSelected}
            onRemove={handleRemove}
            onUpdate={() => {}}
          />
        </aside>

        {/* 3D Canvas */}
        <main className="flex-1 relative">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              Loading 3D engine…
            </div>
          }>
            <GCFloorPlanCanvas
              rooms={laid}
              selectedRoom={selected}
              onSelectRoom={setSelected}
            />
          </Suspense>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-zinc-600 pointer-events-none">
            Drag to pan · Scroll to zoom · Right-click to orbit · Click a room to select
          </div>
        </main>

        {/* Right panel */}
        <aside className="w-64 border-l border-zinc-800 overflow-y-auto p-4 shrink-0">
          <CostPanel rooms={rooms} selectedRoom={selected} />
          <div className="mt-4">
            <DesignPacketPanel rooms={rooms} />
          </div>
        </aside>
      </div>
    </div>
  )
}
