import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCheck, CreditCard, PenTool, Landmark, Wallet, AlertCircle } from 'lucide-react'
import { useTenant } from '../lib/TenantContext'
import { ADDRESS, BUSINESS_NAME, PHONE_DISPLAY } from '../lib/businessInfo'

/**
 * PaymentInstructions — where to actually send the money.
 *
 * WHY THIS IS A COMPONENT AND NOT THREE LINES OF JSX
 * ─────────────────────────────────────────────────
 * The three lines it replaces were hardcoded and two of the three were
 * fictional:
 *
 *   check  "123 Paving Way, Richmond, VA"                — not an address
 *   wire   "Bank of America, Acct: 123456789,
 *           Rtn: 987654321"                              — placeholder digits
 *
 * That is not a cosmetic defect. This block renders to a customer who has just
 * agreed to pay a deposit and is looking for where to send it. A customer who
 * followed the wire line would have sent money to a routing number that is not
 * this company's, and a cheque posted to Paving Way comes back or does not.
 *
 * THE RULE
 * ────────
 * Real details, or none. Payment destinations come from configuration, never
 * from a literal typed into a page, because a literal cannot be corrected
 * without a deploy and cannot be verified by anyone reading the page. Where a
 * destination is not configured, the customer is told to ring the office —
 * which is slower, and correct, and is what any contractor does anyway.
 *
 * The cheque address is the exception and comes from businessInfo.canonical.js
 * rather than config: it is the same address the site already publishes in its
 * schema.org markup, and having a second copy of it here is precisely how the
 * NAP profile drifted into fiction in the first place.
 */
function PaymentInstructions({ method, reference }) {
    const memo = reference ? ` Memo: Est ${reference}.` : '';
    const zelle = import.meta.env.VITE_PAYMENT_ZELLE || '';
    const wireBank = import.meta.env.VITE_PAYMENT_WIRE_BANK || '';
    const wireAccount = import.meta.env.VITE_PAYMENT_WIRE_ACCOUNT || '';
    const wireRouting = import.meta.env.VITE_PAYMENT_WIRE_ROUTING || '';

    const callTheOffice = (
        <>
            <strong>Payment details:</strong> Call {PHONE_DISPLAY} and we will give you the
            details directly. We do not publish account numbers on a web page.
            {memo && ` Reference Est ${reference}.`}
        </>
    );

    if (method === 'check') {
        return (
            <>
                <strong>Check details:</strong> Mail to {BUSINESS_NAME}, {ADDRESS.streetAddress},{' '}
                {ADDRESS.addressLocality}, {ADDRESS.addressRegion} {ADDRESS.postalCode}.{memo}
            </>
        );
    }
    if (method === 'zelle') {
        return zelle ? (
            <><strong>Zelle details:</strong> Send to {zelle}.{memo}</>
        ) : callTheOffice;
    }
    if (method === 'wire') {
        return wireBank && wireAccount && wireRouting ? (
            <>
                <strong>Wire details:</strong> {wireBank}, Acct: {wireAccount}, Rtn: {wireRouting}.{memo}
            </>
        ) : callTheOffice;
    }
    return callTheOffice;
}



export default function EstimatePortal() {
  const { public_token } = useParams()
  const { primaryColor } = useTenant()
  
  const [estimate, setEstimate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Signature State
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [signed, setSigned] = useState(false)
  const [signing, setSigning] = useState(false)
  const [signError, setSignError] = useState(null)
  
  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('stripe') // stripe, zelle, check, wire
  const [processing, setProcessing] = useState(false)

  // Fetch Estimate
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/portal/estimates/${public_token}`)
      .then(res => {
        if (!res.ok) throw new Error('Estimate not found or link expired.')
        return res.json()
      })
      .then(data => {
        setEstimate(data)
        if (data.signed_at_utc) setSigned(true)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [public_token])

  // Canvas Drawing logic
  const startDrawing = ({ nativeEvent }) => {
    if (signed) return
    if (!canvasRef.current) return
    const { offsetX, offsetY } = nativeEvent
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(offsetX, offsetY)
    setIsDrawing(true)
  }
  const draw = ({ nativeEvent }) => {
    if (!isDrawing || signed) return
    if (!canvasRef.current) return
    const { offsetX, offsetY } = nativeEvent
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(offsetX, offsetY)
    ctx.stroke()
  }
  const stopDrawing = () => {
    if (signed) return
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.closePath()
    setIsDrawing(false)
  }
  const clearCanvas = () => {
    if (signed) return
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  // Set up canvas style
  useEffect(() => {
    if (canvasRef.current && !signed) {
        const ctx = canvasRef.current.getContext('2d')
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
    }
  }, [loading, signed])
  
  // ── Handle Sign ──
  const handleSign = async () => {
      if (!termsAccepted) {
          setSignError("You must accept the terms & conditions.")
          return
      }
      if (!canvasRef.current) return
      
      const canvas = canvasRef.current
      // Check if blank (rudimentary check)
      const blank = document.createElement('canvas')
      blank.width = canvas.width
      blank.height = canvas.height
      if (canvas.toDataURL() === blank.toDataURL()) {
          setSignError("Please provide your signature.")
          return
      }
      
      setSigning(true)
      setSignError(null)
      try {
          const signatureUrl = canvas.toDataURL('image/png')
          const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/portal/estimates/${public_token}/sign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ signature_data_url: signatureUrl, terms_accepted: true })
          })
          if (!res.ok) throw new Error('Failed to save signature.')
          const updated = await res.json()
          setEstimate(updated)
          setSigned(true)
      } catch (err) {
          setSignError(err.message)
      }
      setSigning(false)
  }
  
  // ── Handle Payment ──
  const handlePayment = async () => {
      setProcessing(true)
      try {
          if (paymentMethod === 'stripe') {
              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/portal/estimates/${public_token}/checkout`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      success_url: window.location.href + "?success=true",
                      cancel_url: window.location.href + "?canceled=true"
                  })
              })
              const data = await res.json()
              if (data.checkout_url) window.location.href = data.checkout_url
          } else {
              // Manual Payment (Zelle, Check, Wire)
              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/portal/estimates/${public_token}/manual_payment`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ payment_method: paymentMethod })
              })
              if (!res.ok) throw new Error("Failed to process payment selection.")
              const updated = await res.json()
              setEstimate(updated)
          }
      } catch (err) {
          alert(err.message)
      }
      setProcessing(false)
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b' }}>Loading your proposal...</div>
  if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#ef4444' }}>{error}</div>

  const fmt$ = (n) => typeof n === 'number' ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$0.00'
  const isPendingVerification = estimate?.payment_status === 'pending' && estimate?.payment_method !== 'stripe'
  const isApproved = estimate?.status === 'approved'

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ background: primaryColor || '#050810', padding: '32px 40px', color: 'white' }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>J. Worden & Sons</h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>Estimate #{estimate?.estimate_number}</p>
            </div>
            
            <div style={{ padding: '40px' }}>
                {/* Scope of Work */}
                <div style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #e2e8f0', paddingBottom: 12, marginBottom: 20 }}>Scope of Work</h2>
                    <div style={{ whiteSpace: 'pre-wrap', color: '#475569', lineHeight: 1.6 }}>
                        {estimate?.scope_summary || 'No scope details provided.'}
                    </div>
                </div>
                
                {/* Financials */}
                <div style={{ marginBottom: 40, background: '#f1f5f9', borderRadius: 12, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ color: '#475569', fontWeight: 600 }}>Total Investment</span>
                        <span style={{ fontWeight: 700 }}>{fmt$(estimate?.total_amount)}</span>
                    </div>
                    {estimate?.deposit_amount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 12, marginTop: 12 }}>
                            <span style={{ color: '#0f172a', fontWeight: 700 }}>Required Deposit</span>
                            <span style={{ color: primaryColor || '#f59e0b', fontWeight: 700, fontSize: 18 }}>{fmt$(estimate?.deposit_amount)}</span>
                        </div>
                    )}
                </div>
                
                {/* Status Banners */}
                {isApproved && (
                    <div style={{ background: '#dcfce7', color: '#166534', padding: 16, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, fontWeight: 600 }}>
                        <CheckCheck size={24} />
                        Your project is fully approved and locked in! We will contact you shortly to schedule.
                    </div>
                )}
                
                {isPendingVerification && (
                    <div style={{ background: '#fef3c7', color: '#92400e', padding: 24, borderRadius: 12, marginBottom: 40 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, fontWeight: 700, fontSize: 18 }}>
                            <AlertCircle size={24} />
                            Pending Deposit Verification
                        </div>
                        <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>
                            You have elected to pay your deposit via <strong>{estimate?.payment_method?.toUpperCase()}</strong>.
                            Your project will be scheduled as soon as the funds clear.
                        </p>
                        <div style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px dashed #d97706' }}>
                            <PaymentInstructions
                                method={estimate?.payment_method}
                                reference={estimate?.estimate_number}
                            />
                        </div>
                    </div>
                )}

                {/* Signature Block */}
                {!signed ? (
                    <div style={{ marginBottom: 40 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #e2e8f0', paddingBottom: 12, marginBottom: 20 }}>Digital Signature</h2>
                        <div style={{ border: '2px dashed #cbd5e1', borderRadius: 12, overflow: 'hidden', background: 'white', position: 'relative' }}>
                            <canvas 
                                ref={canvasRef}
                                width={600}
                                height={200}
                                style={{ width: '100%', cursor: 'crosshair', touchAction: 'none' }}
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseOut={stopDrawing}
                            />
                            <button onClick={clearCanvas} style={{ position: 'absolute', top: 12, right: 12, background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                        </div>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, cursor: 'pointer' }}>
                            <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} style={{ width: 18, height: 18 }} />
                            <span style={{ color: '#475569', fontSize: 14 }}>I accept the terms and conditions and authorize this work.</span>
                        </label>
                        
                        {signError && <p style={{ color: '#ef4444', fontSize: 14, marginTop: 12 }}>{signError}</p>}
                        
                        <button 
                            onClick={handleSign}
                            disabled={signing}
                            style={{ background: primaryColor || '#050810', color: 'white', border: 'none', padding: '16px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: signing ? 'wait' : 'pointer', marginTop: 24, width: '100%' }}
                        >
                            {signing ? 'Securing Signature...' : 'Sign & Accept'}
                        </button>
                    </div>
                ) : !isApproved && !isPendingVerification && (
                    <div style={{ marginBottom: 40 }}>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 24, borderRadius: 12, marginBottom: 32, textAlign: 'center' }}>
                            <img src={estimate.signature_data_url} alt="Signature" style={{ maxHeight: 80, margin: '0 auto 12px' }} />
                            <div style={{ color: '#64748b', fontSize: 12 }}>Signed digitally at {new Date(estimate.signed_at_utc).toLocaleString()}</div>
                        </div>
                        
                        <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #e2e8f0', paddingBottom: 12, marginBottom: 20 }}>Select Payment Method for Deposit</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
                            {[
                                { id: 'stripe', label: 'Credit Card', icon: CreditCard },
                                { id: 'zelle', label: 'Zelle', icon: Wallet },
                                { id: 'check', label: 'Mail a Check', icon: PenTool },
                                { id: 'wire', label: 'Wire Transfer', icon: Landmark }
                            ].map(m => (
                                <button 
                                    key={m.id}
                                    onClick={() => setPaymentMethod(m.id)}
                                    style={{
                                        background: paymentMethod === m.id ? (primaryColor || '#050810') : 'white',
                                        color: paymentMethod === m.id ? 'white' : '#475569',
                                        border: `2px solid ${paymentMethod === m.id ? (primaryColor || '#050810') : '#e2e8f0'}`,
                                        borderRadius: 12, padding: '20px 16px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                                        cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600
                                    }}
                                >
                                    <m.icon size={24} />
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handlePayment}
                            disabled={processing}
                            style={{ background: '#22c55e', color: 'white', border: 'none', padding: '16px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: processing ? 'wait' : 'pointer', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}
                        >
                            {processing ? 'Processing...' : `Pay Deposit via ${paymentMethod.toUpperCase()}`}
                        </button>
                    </div>
                )}

            </div>
        </div>
    </div>
  )
}
