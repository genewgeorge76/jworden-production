import React, { useState, useEffect } from 'react'
import { Search, Play, Cpu, CheckCircle2, AlertTriangle, RefreshCw, X, Sparkles, Terminal, Layers } from 'lucide-react'
import api from '@/api/client'

export default function OmniPanel({ onClose }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [abilities, setAbilities] = useState([])
  const [selectedAbility, setSelectedAbility] = useState(null)
  const [executing, setExecuting] = useState(false)
  const [paramsInput, setParamsInput] = useState('{\n  "sqft": 50000,\n  "trade": "asphalt"\n}')
  const [executionResult, setExecutionResult] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  // Search abilities on query change
  useEffect(() => {
    let active = true
    setLoading(true)
    api.searchAbilities(query)
      .then((res) => {
        if (!active) return
        if (res?.abilities?.results) {
          setAbilities(res.abilities.results)
        } else if (Array.isArray(res?.results)) {
          setAbilities(res.results)
        } else {
          setAbilities([])
        }
      })
      .catch(() => {
        if (active) setAbilities([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [query])

  const handleSelectAbility = (item) => {
    setSelectedAbility(item)
    setExecutionResult(null)
    // Pre-fill smart default parameters
    let defaultParams = { sqft: 50000 }
    if (item.module_id?.includes('age_decay')) {
      defaultParams = { trade: 'asphalt', sqft: 50000, stress_level: 6 }
    } else if (item.module_id?.includes('gpr')) {
      defaultParams = { grid_width: 500, grid_height: 500 }
    } else if (item.module_id?.includes('b2g')) {
      defaultParams = { municipality: 'Richmond, VA', area_sqft: 150000 }
    } else if (item.module_id?.includes('rfp')) {
      defaultParams = { rfp_text: 'Commercial parking lot asphalt replacement in Henrico County' }
    }
    setParamsInput(JSON.stringify(defaultParams, null, 2))
  }

  const handleRunAbility = async () => {
    if (!selectedAbility) return
    setExecuting(true)
    setExecutionResult(null)
    
    let parsedParams = {}
    try {
      parsedParams = JSON.parse(paramsInput)
    } catch {
      parsedParams = {}
    }

    try {
      const res = await api.executeAbility(selectedAbility.module_id, parsedParams)
      setExecutionResult({ success: true, data: res })
    } catch (err) {
      setExecutionResult({ success: false, error: err?.message || 'Execution failed' })
    } finally {
      setExecuting(false)
    }
  }

  const categories = ['all', ...new Set(abilities.map((a) => a.category).filter(Boolean))]
  const filteredAbilities = activeTab === 'all' 
    ? abilities 
    : abilities.filter((a) => a.category === activeTab)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md transition-all">
      <div className="w-full max-w-4xl bg-[#080d1a] border-l border-slate-800 text-white flex flex-col h-full shadow-2xl">
        
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-wider font-mono uppercase text-white flex items-center gap-2">
                Jarvis OS Ability Matrix
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  162 / 162 ACTIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">Autonomous Domain Intelligence & Execution Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Ability Search & Selection List */}
          <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950/40">
            <div className="p-4 border-b border-slate-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 162 abilities (e.g. decay, gpr, b2g)..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.slice(0, 8).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-md whitespace-nowrap transition-colors border ${
                      activeTab === cat
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-slate-500 text-sm font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Indexing abilities...
                </div>
              ) : filteredAbilities.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No OS abilities match "{query}"
                </div>
              ) : (
                filteredAbilities.map((item) => {
                  const isSelected = selectedAbility?.module_id === item.module_id
                  return (
                    <div
                      key={item.module_id}
                      onClick={() => handleSelectAbility(item)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-semibold text-amber-400 truncate">
                          {item.module_id}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
                        {item.description || 'Jarvis OS Autonomous Domain Ability'}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right: Selected Ability Inspector & Live Execution Sandbox */}
          <div className="w-1/2 flex flex-col bg-[#050810] p-5 overflow-y-auto">
            {selectedAbility ? (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-mono font-bold text-white uppercase">
                      {selectedAbility.class_name || selectedAbility.module_id}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {selectedAbility.description}
                  </p>
                </div>

                {/* Parameters Input JSON */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>EXECUTION PARAMETERS (JSON)</span>
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  </label>
                  <textarea
                    rows={6}
                    value={paramsInput}
                    onChange={(e) => setParamsInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Execute Button */}
                <button
                  onClick={handleRunAbility}
                  disabled={executing}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {executing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Executing AI Ability...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" /> Execute Ability Now
                    </>
                  )}
                </button>

                {/* Execution Output Window */}
                {executionResult && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        {executionResult.success ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        )}
                        Execution Status: {executionResult.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </div>

                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-64 leading-relaxed whitespace-pre-wrap">
                      {executionResult.success
                        ? typeof executionResult.data?.assessment === 'string'
                          ? executionResult.data.assessment
                          : JSON.stringify(executionResult.data, null, 2)
                        : executionResult.error}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Layers className="w-12 h-12 stroke-[1.2] text-slate-700 mb-3 animate-pulse" />
                <h4 className="text-sm font-mono text-slate-400 mb-1">Select an OS Ability</h4>
                <p className="text-xs text-slate-600 max-w-xs font-sans">
                  Choose any module from the left panel to inspect parameters and trigger real-time AI execution.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
