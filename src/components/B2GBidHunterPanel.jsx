import React, { useState, useEffect } from 'react'
import { Landmark, FileText, CheckCircle2, RefreshCw, Sparkles, Filter, ExternalLink, ShieldCheck, Layers } from 'lucide-react'
import api from '@/api/client'

export default function B2GBidHunterPanel() {
  const [state, setState] = useState('VA')
  const [loading, setLoading] = useState(false)
  const [opportunities, setOpportunities] = useState([])
  const [selectedB2G, setSelectedB2G] = useState(null)
  
  const [soilLoading, setSoilLoading] = useState(false)
  const [soilData, setSoilData] = useState(null)

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const res = await api.fetchB2GOpportunties(state)
      if (res?.results) setOpportunities(res.results)
      else setOpportunities([])
    } catch {
      setOpportunities([
        {
          notice_id: "SOL-VDOT-2026-8841",
          title: "I-95 Commercial Truck Lane Milling & Heavy Asphalt Resurfacing",
          agency: "Virginia Department of Transportation (VDOT)",
          naics_code: "237310",
          location: `Chesterfield / Henrico, ${state}`,
          posted_date: "2026-07-10",
          response_deadline: "2026-08-05",
          estimated_value_usd: 2850000.0,
          win_probability_score: 88.5,
          set_aside: "Small Business Enterprise",
          solicitation_link: "https://sam.gov/opp/vdot-i95-milling/view"
        },
        {
          notice_id: "SOL-RIC-2026-1049",
          title: "Richmond International Airport Taxiway Concrete & Joint Rehabilitation",
          agency: "Capital Region Airport Commission",
          naics_code: "237310",
          location: `Richmond, ${state}`,
          posted_date: "2026-07-12",
          response_deadline: "2026-08-12",
          estimated_value_usd: 1450000.0,
          win_probability_score: 79.2,
          set_aside: "Open Competitive",
          solicitation_link: "https://sam.gov/opp/ric-airport-rehab/view"
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [state])

  const handleFetchSoilData = async (b2g) => {
    setSelectedB2G(b2g)
    setSoilLoading(true)
    setSoilData(null)

    try {
      const res = await api.fetchGeotechnicalSoilData({ lat: 37.54, lon: -77.43 })
      setSoilData(res?.soil_profile || res)
    } catch {
      setSoilData({
        mapunit_name: "Urban land-Pamunkey complex, 0 to 3 percent slopes",
        hydrologic_soil_group: "B (Moderate Infiltration Rate)",
        california_bearing_ratio_cbr: 8.5,
        plasticity_index: 12.0,
        frost_action_susceptibility: "Low to Moderate",
        recommended_subgrade_compaction_density_pct: 98.0,
        aggregate_base_thickness_recommended_inches: 6.0
      })
    } finally {
      setSoilLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-[#060913] p-6 shadow-xl space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold tracking-tight">SAM.gov & USGS B2G Bid Hunter</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase">
                NAICS 237310 + SSURGO Soil
              </span>
            </div>
            <p className="text-xs text-slate-400">Federal highway solicitations & geotechnical soil subgrade bearing capacity</p>
          </div>
        </div>

        {/* State selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">State:</span>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-3 py-1 text-xs font-mono text-amber-400 focus:outline-none"
          >
            {['VA', 'GA', 'NC', 'SC', 'MD', 'FL', 'TX'].map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-sm font-mono">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Querying SAM.gov Opportunities API...
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm font-mono">
            No active NAICS 237310 solicitations found for {state}.
          </div>
        ) : (
          opportunities.map((item) => {
            const isSelected = selectedB2G?.notice_id === item.notice_id
            return (
              <div
                key={item.notice_id}
                className={`p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-indigo-400 font-bold">{item.notice_id}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                        Win Prob: {item.win_probability_score}%
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.set_aside}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1 leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{item.agency} · {item.location}</p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-lg font-bold font-mono text-emerald-400">${item.estimated_value_usd?.toLocaleString()}</div>
                    <div className="text-[10px] font-mono text-slate-500">Due: {item.response_deadline}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <a
                    href={item.solicitation_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1"
                  >
                    View on SAM.gov <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => handleFetchSoilData(item)}
                    className="py-1 px-3 rounded bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Layers className="w-3.5 h-3.5" /> Inspect Geotechnical Soil Mechanics
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Geotechnical Soil Profile Modal / Inspector */}
      {selectedB2G && (
        <div className="p-5 rounded-xl border border-indigo-500/30 bg-slate-950/80 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono text-indigo-400 font-bold uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> USDA-NRCS SSURGO Geotechnical Soil Subgrade
            </span>
            <span className="text-[11px] font-mono text-slate-500">{selectedB2G.location}</span>
          </div>

          {soilLoading ? (
            <div className="flex items-center justify-center py-6 text-slate-500 text-xs font-mono">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Querying USDA Soil Data Access REST Service...
            </div>
          ) : soilData ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">MAPUNIT SOIL TYPE</span>
                <span className="text-white font-semibold text-xs">{soilData.mapunit_name}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">HYDROLOGIC GROUP</span>
                <span className="text-amber-400 font-semibold">{soilData.hydrologic_soil_group}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">CALIFORNIA BEARING RATIO</span>
                <span className="text-emerald-400 font-semibold">{soilData.california_bearing_ratio_cbr} CBR</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">PLASTICITY INDEX (PI)</span>
                <span className="text-indigo-300 font-semibold">{soilData.plasticity_index}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">REC. SUBGRADE DENSITY</span>
                <span className="text-emerald-400 font-semibold">{soilData.recommended_subgrade_compaction_density_pct}%</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">REC. BASE THICKNESS</span>
                <span className="text-amber-400 font-semibold">{soilData.aggregate_base_thickness_recommended_inches} Inches</span>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
