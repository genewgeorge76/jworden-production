import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL ?? ''

interface PortalData {
  customer: { id: number; name: string; email: string; phone: string; member_since: string }
  proposals: Array<{ id: number; title: string; estimated_value: number; outcome: string; generated_at: string }>
  jobs: Array<{ id: string; title: string; status: string; site_address: string; scheduled_date: string }>
  payments: Array<{ id: number; amount: number; status: string; created_at: string }>
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'won' || status === 'complete' || status === 'succeeded'
      ? 'bg-green-900 text-green-300'
      : status === 'lost' || status === 'failed'
      ? 'bg-red-900 text-red-300'
      : 'bg-yellow-900 text-yellow-300'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {status.toUpperCase()}
    </span>
  )
}

function LoginForm({ onLogin }: { onLogin: (token: string, name: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API}/api/v1/portal/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.access_token) {
        onLogin(data.access_token, data.name)
      } else {
        setMessage(data.message ?? 'Check your email for a portal link.')
      }
    } catch {
      setMessage('Unable to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-2">Client Portal</h1>
        <p className="text-gray-400 mb-6 text-sm">Enter your email to access your proposals, jobs, and payment history.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Checking…' : 'Access My Portal'}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-sm text-center text-gray-300">{message}</p>
        )}
      </div>
    </div>
  )
}

function PortalDashboard({ token, name, onLogout }: { token: string; name: string; onLogout: () => void }) {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'proposals' | 'jobs' | 'payments'>('proposals')

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    async function load() {
      try {
        const [meRes, propRes, jobsRes, payRes] = await Promise.all([
          fetch(`${API}/api/v1/portal/me`, { headers }),
          fetch(`${API}/api/v1/portal/proposals`, { headers }),
          fetch(`${API}/api/v1/portal/jobs`, { headers }),
          fetch(`${API}/api/v1/portal/payments`, { headers }),
        ])
        const [me, props, jobs, pay] = await Promise.all([
          meRes.json(), propRes.json(), jobsRes.json(), payRes.json(),
        ])
        setData({
          customer: me,
          proposals: props.proposals ?? [],
          jobs: jobs.jobs ?? [],
          payments: pay.payments ?? [],
        })
      } catch {
        // keep null — show error state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading your portal…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Failed to load portal data. Please try again.</p>
      </div>
    )
  }

  const tabs: Array<{ key: typeof tab; label: string; count: number }> = [
    { key: 'proposals', label: 'Proposals', count: data.proposals.length },
    { key: 'jobs', label: 'Jobs', count: data.jobs.length },
    { key: 'payments', label: 'Payments', count: data.payments.length },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-lg">J. Worden &amp; Sons — Client Portal</h1>
          <p className="text-xs text-gray-400">Welcome back, {data.customer.name}</p>
        </div>
        <button onClick={onLogout} className="text-xs text-gray-500 hover:text-white transition-colors">
          Sign Out
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {/* Tab nav */}
        <nav className="flex gap-2 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t.label} <span className="ml-1 opacity-70">({t.count})</span>
            </button>
          ))}
        </nav>

        {/* Proposals */}
        {tab === 'proposals' && (
          <section>
            {data.proposals.length === 0 ? (
              <p className="text-gray-500 text-sm">No proposals on file yet.</p>
            ) : (
              <div className="space-y-4">
                {data.proposals.map(p => (
                  <div key={p.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{p.title}</h3>
                      <StatusBadge status={p.outcome} />
                    </div>
                    <p className="text-yellow-400 font-bold mb-1">
                      ${p.estimated_value?.toLocaleString() ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Generated {p.generated_at ? new Date(p.generated_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Jobs */}
        {tab === 'jobs' && (
          <section>
            {data.jobs.length === 0 ? (
              <p className="text-gray-500 text-sm">No jobs on file yet.</p>
            ) : (
              <div className="space-y-4">
                {data.jobs.map(j => (
                  <div key={j.id} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{j.title}</h3>
                      <StatusBadge status={j.status} />
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{j.site_address}</p>
                    {j.scheduled_date && (
                      <p className="text-xs text-gray-500">
                        Scheduled: {new Date(j.scheduled_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Payments */}
        {tab === 'payments' && (
          <section>
            {data.payments.length === 0 ? (
              <p className="text-gray-500 text-sm">No payment records on file yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-800">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">Amount</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map(t => (
                      <tr key={t.id} className="border-b border-gray-800/50">
                        <td className="py-3 pr-4 text-gray-400">
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4 font-semibold">
                          ${t.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '—'}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export function ClientPortalPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('portal_token'))
  const [name, setName] = useState<string>(() => localStorage.getItem('portal_name') ?? '')

  function handleLogin(tok: string, n: string) {
    localStorage.setItem('portal_token', tok)
    localStorage.setItem('portal_name', n)
    setToken(tok)
    setName(n)
  }

  function handleLogout() {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_name')
    setToken(null)
    setName('')
  }

  if (!token) return <LoginForm onLogin={handleLogin} />
  return <PortalDashboard token={token} name={name} onLogout={handleLogout} />
}
