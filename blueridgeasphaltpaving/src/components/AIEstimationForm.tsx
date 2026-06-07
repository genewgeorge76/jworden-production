'use client'

import { useState } from 'react'

export default function AIEstimationForm({ location = 'Virginia' }: { location?: string }) {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Switch to loading state to sell the AI aesthetic
    setStatus('scanning')
    
    try {
      // Simulate API call / Wait for aesthetic effect
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, location })
      })

      if (response.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{ background: '#0a0a0a', padding: '30px', borderRadius: '8px', border: '2px solid #2e7d32', textAlign: 'center' }}>
        <h3 style={{ color: '#2e7d32', fontSize: '1.5rem', marginBottom: '15px', fontFamily: 'Bebas Neue' }}>SCAN COMPLETE</h3>
        <p style={{ color: '#fff', lineHeight: '1.6' }}>
          Orbital topography data successfully retrieved for <strong>{formData.address}</strong>.
        </p>
        <p style={{ color: '#ccc', marginTop: '15px', fontSize: '0.9rem' }}>
          A Senior Paving Engineer is currently reviewing the structural parameters and will contact you shortly at {formData.phone} with your precise estimate.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <input 
        type="text" 
        placeholder="Your Name" 
        required
        disabled={status === 'scanning'}
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        style={{ padding: '15px', border: 'none', borderRadius: '4px', background: status === 'scanning' ? '#333' : '#fff', color: status === 'scanning' ? '#888' : '#000' }} 
      />
      <input 
        type="text" 
        placeholder={`${location} Property Address`} 
        required
        disabled={status === 'scanning'}
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        style={{ padding: '15px', border: '2px solid var(--powerhouse-red)', borderRadius: '4px', fontWeight: 'bold', background: status === 'scanning' ? '#333' : '#fff', color: status === 'scanning' ? '#888' : '#000' }} 
      />
      <input 
        type="tel" 
        placeholder="Phone Number" 
        required
        disabled={status === 'scanning'}
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        style={{ padding: '15px', border: 'none', borderRadius: '4px', background: status === 'scanning' ? '#333' : '#fff', color: status === 'scanning' ? '#888' : '#000' }} 
      />
      
      <button 
        type="submit" 
        disabled={status === 'scanning'}
        className="btn-primary" 
        style={{ 
          width: '100%', 
          marginTop: '10px', 
          padding: '15px', 
          fontSize: '1.1rem',
          background: status === 'scanning' ? '#111' : 'var(--powerhouse-red)',
          color: status === 'scanning' ? '#d32f2f' : 'white',
          border: status === 'scanning' ? '1px solid #d32f2f' : 'none',
          cursor: status === 'scanning' ? 'wait' : 'pointer',
          transition: 'all 0.3s ease'
        }}
      >
        {status === 'scanning' ? 'INITIALIZING SATELLITE LINK...' : 'Initiate Satellite Scan'}
      </button>

      {status === 'error' && (
        <p style={{ color: 'var(--powerhouse-red)', fontSize: '0.9rem', textAlign: 'center', marginTop: '10px' }}>
          Signal interference detected. Please try submitting again.
        </p>
      )}
    </form>
  )
}
