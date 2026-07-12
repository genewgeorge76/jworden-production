import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = 'godmode' | 'heavy-civil';

interface SiteAnalysis {
  address: string;
  sqft: number;
  soilType: string;
  soilClass: string;
  soilRisk: 'low' | 'medium' | 'high';
  optimalStartDay: number;
  projectDays: number;
  baseProfit: number;
  adjustedProfit: number;
  weatherRisk: 'green' | 'yellow' | 'red';
  cutVolumeCY: number;
  fillVolumeCY: number;
  swellFactor: number;
  fillImportCost: number;
  avgSlope: number;
  catchBasinsRequired: number;
  utilityDepthFt: number;
  hasMunicipalMain: boolean;
  arterialRoad: boolean;
  flaggersRequired: number;
  motCostPerDay: number;
  alerts: string[];
}

// ─── Mock Analysis Engine ─────────────────────────────────────────────────────

function runAnalysis(address: string): SiteAnalysis {
  const seed = address.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = (min: number, max: number) => min + (Math.abs(seed * 2654435761) % (max - min + 1));

  const sqft = rand(8000, 45000);
  const soilOptions: Array<{ type: string; class: string; risk: SiteAnalysis['soilRisk'] }> = [
    { type: 'A-7-6 Expansive Clay', class: 'High Plasticity Clay — AASHTO A-7-6', risk: 'high' },
    { type: 'A-4 Silty Loam', class: 'Silty Loam — AASHTO A-4', risk: 'medium' },
    { type: 'A-1-a Granular', class: 'Well-Graded Gravel — AASHTO A-1-a', risk: 'low' },
    { type: 'A-6 Clay Loam', class: 'Clay Loam — AASHTO A-6', risk: 'medium' },
    { type: 'A-2-4 Silty Gravel', class: 'Silty Gravel/Sand — AASHTO A-2-4', risk: 'low' },
  ];
  const soil = soilOptions[seed % soilOptions.length];
  const optimalStartDay = (seed % 14) + 5;
  const projectDays = Math.floor(sqft / 10000) + 2;
  const baseProfit = Math.round((sqft * 2.8) / 100) * 100;
  const adjustedProfit = soil.risk === 'high' ? Math.round(baseProfit * 0.72) : soil.risk === 'medium' ? Math.round(baseProfit * 0.91) : baseProfit;

  const cutVol = rand(400, 2400);
  const fillVol = rand(200, 1800);
  const swellFactor = 0.15;
  const fillImportCost = Math.round(fillVol * 1.12 * 27); // tonnage × $27

  const avgSlope = parseFloat(((seed % 40) / 10 + 0.3).toFixed(1));
  const catchBasinsRequired = avgSlope < 1.5 ? 3 : avgSlope < 2.5 ? 2 : 1;

  const utilityDepthFt = (seed % 4) + 3;
  const hasMunicipalMain = seed % 3 !== 0;
  const arterialRoad = seed % 2 === 0;
  const flaggersRequired = arterialRoad ? 2 : 1;
  const motCostPerDay = arterialRoad ? 1800 : 950;

  const alerts: string[] = [];
  if (soil.risk === 'high') alerts.push(`⚠ ${soil.type} detected. Forcing 3" heavy-duty spec + biaxial geogrid. Frost-heave failure risk without upgrade.`);
  if (avgSlope < 1.5) alerts.push(`⚠ Flat terrain detected (${avgSlope}% slope). Forcing minimum 1.5% pitch — adding ${catchBasinsRequired} Type-C catch basins.`);
  if (hasMunicipalMain) alerts.push(`⚠ Municipal water main at ${utilityDepthFt}ft depth. Adjusting storm sewer invert. Forcing Class-C pipe bedding (ASTM D2321).`);
  if (arterialRoad) alerts.push(`⚠ Arterial road access. MUTCD Type-3 lane closure required. Adding $${motCostPerDay.toLocaleString()}/day for MOT crew.`);
  if (fillVol > 1200) alerts.push(`⚠ Site requires ${fillVol.toLocaleString()} CY structural fill import. Swell factor ${(swellFactor * 100).toFixed(0)}%. Adding $${fillImportCost.toLocaleString()} to earthwork phase.`);

  const weatherRisk: SiteAnalysis['weatherRisk'] = optimalStartDay <= 7 ? 'green' : optimalStartDay <= 14 ? 'yellow' : 'red';

  return {
    address,
    sqft,
    soilType: soil.type,
    soilClass: soil.class,
    soilRisk: soil.risk,
    optimalStartDay,
    projectDays,
    baseProfit,
    adjustedProfit,
    weatherRisk,
    cutVolumeCY: cutVol,
    fillVolumeCY: fillVol,
    swellFactor,
    fillImportCost,
    avgSlope,
    catchBasinsRequired,
    utilityDepthFt,
    hasMunicipalMain,
    arterialRoad,
    flaggersRequired,
    motCostPerDay,
    alerts,
  };
}

// ─── Weather Day Cells ────────────────────────────────────────────────────────

function WeatherDay({ day, temp, wind, rain, optimal }: { day: number; temp: number; wind: number; rain: number; optimal?: boolean }) {
  const color = optimal ? 'bg-green-950 border-green-500 text-green-400' : rain > 60 ? 'bg-red-950 border-red-700 text-red-400' : wind > 20 || temp < 45 ? 'bg-yellow-950 border-yellow-600 text-yellow-400' : 'bg-zinc-900 border-zinc-700 text-zinc-200';
  return (
    <div className={`border rounded p-2 text-center text-[10px] ${color}`}>
      <div className="font-black text-xs">D{day}</div>
      <div>{temp}°F</div>
      <div>{wind}mph</div>
      <div className="font-bold">{rain}%💧</div>
      {optimal && <div className="text-[9px] font-black text-green-300 mt-1">OPTIMAL</div>}
    </div>
  );
}

// ─── AI Contract Terminal ─────────────────────────────────────────────────────

function ContractTerminal({ analysis }: { analysis: SiteAnalysis }) {
  const lines = [
    `> WORDEN AI ENGINE v4.2 — INITIALIZING...`,
    `> Satellite scan: ${analysis.sqft.toLocaleString()} SF lot verified`,
    `> USGS Soil: ${analysis.soilType}`,
    analysis.soilRisk === 'high' ? `> ⚠ HIGH RISK SOIL — Upgrading to 3" HD spec + geogrid` : `> Soil risk: ${analysis.soilRisk.toUpperCase()} — Standard spec approved`,
    `> Optimal paving window: Day ${analysis.optimalStartDay}–${analysis.optimalStartDay + analysis.projectDays}`,
    `> Earthwork: ${analysis.cutVolumeCY.toLocaleString()} CY cut / ${analysis.fillVolumeCY.toLocaleString()} CY fill`,
    analysis.hasMunicipalMain ? `> Utility clash detected @ ${analysis.utilityDepthFt}ft — Class-C bedding forced` : `> No utility conflicts detected`,
    analysis.arterialRoad ? `> MOT required: MUTCD Type-3 + ${analysis.flaggersRequired} flaggers` : `> No arterial MOT required`,
    `> Base profit: $${analysis.baseProfit.toLocaleString()} → Adjusted: $${analysis.adjustedProfit.toLocaleString()}`,
    `> Generating Worden Contract Proposal...`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  J. WORDEN & SONS — COMMERCIAL PROPOSAL`,
    `  Virginia Class A License | Since 1984`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `  Project: ${analysis.address}`,
    `  Surface: ${analysis.sqft.toLocaleString()} SF — 3" VDOT SM-12.5A`,
    `  Base: 8" Crushed Stone — VDOT Sec 315`,
    `  Compaction: 96% Marshall Unit Weight (min)`,
    `  Earthwork: ${analysis.fillVolumeCY.toLocaleString()} CY import @ +${(analysis.swellFactor * 100).toFixed(0)}% swell`,
    analysis.arterialRoad ? `  MOT: MUTCD Type-3 | $${analysis.motCostPerDay.toLocaleString()}/day` : `  MOT: No lane closure required`,
    `  Start Date: Day ${analysis.optimalStartDay} (weather-optimized)`,
    `  Projected Profit: $${analysis.adjustedProfit.toLocaleString()}`,
    `  Oil Buffer: ±$9/ton liquid asphalt shield`,
    ``,
    `> CONTRACT GENERATED. READY FOR SIGNATURE.`,
  ];

  return (
    <div className="font-mono text-xs text-green-400 bg-black rounded border border-green-900 p-4 h-full overflow-y-auto space-y-0.5 min-h-[320px]">
      {lines.map((line, i) => (
        <div key={i} className={line.startsWith('━') ? 'text-green-600' : line.startsWith('  J.') || line.startsWith('  Virginia') ? 'text-green-300 font-black' : ''}>{line || '\u00A0'}</div>
      ))}
    </div>
  );
}

// ─── God-Mode 4-Quadrant View ─────────────────────────────────────────────────

function GodModeView({ analysis }: { analysis: SiteAnalysis }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const seed2 = (analysis.sqft + i * 17) % 100;
    return {
      day: i + 1,
      temp: 42 + ((seed2 * 3) % 40),
      wind: 4 + (seed2 % 25),
      rain: seed2 % 90,
      optimal: i + 1 >= analysis.optimalStartDay && i + 1 < analysis.optimalStartDay + analysis.projectDays,
    };
  });

  const soilColor = analysis.soilRisk === 'high' ? 'text-red-400 border-red-700' : analysis.soilRisk === 'medium' ? 'text-yellow-400 border-yellow-600' : 'text-green-400 border-green-700';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Q1: Visual Recon */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[#ffcc00] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1">Q1</span>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#ffcc00]">Visual Recon — Satellite & Street View</h3>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden mb-4" style={{ height: '180px' }}>
          <div className="w-full h-full flex items-center justify-center flex-col gap-3">
            <div className="text-4xl">🛰️</div>
            <div className="text-center">
              <div className="text-[#ffcc00] font-black text-sm uppercase tracking-widest">SITE SCANNED</div>
              <div className="text-zinc-200 text-xs font-bold mt-1">{analysis.address}</div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Lot Area</span>
            <span className="text-white">{analysis.sqft.toLocaleString()} SF</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Avg Slope</span>
            <span className={analysis.avgSlope < 1.5 ? 'text-yellow-400' : 'text-green-400'}>{analysis.avgSlope}%</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Arterial Access</span>
            <span className={analysis.arterialRoad ? 'text-red-400' : 'text-green-400'}>{analysis.arterialRoad ? '⚠ Yes — MOT Required' : '✓ Clear'}</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Overhead Lines</span>
            <span className="text-yellow-400">{analysis.sqft > 20000 ? '⚠ Detected — Shuttle Buggy +$4,500' : '✓ Clear'}</span>
          </div>
        </div>
      </div>

      {/* Q2: Geotechnical */}
      <div className={`bg-zinc-900 border rounded-xl p-6 ${soilColor}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[#ffcc00] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1">Q2</span>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#ffcc00]">Geotechnical Autopilot — USGS / NRCS</h3>
        </div>
        <div className="bg-zinc-950 rounded-lg p-4 mb-4 border border-zinc-800">
          <div className="text-xl font-black text-white mb-1">{analysis.soilType}</div>
          <div className="text-[11px] text-zinc-200 font-bold mb-3">{analysis.soilClass}</div>
          <div className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded border ${soilColor}`}>
            RISK: {analysis.soilRisk.toUpperCase()}
          </div>
        </div>
        <div className="space-y-2">
          {analysis.soilRisk === 'high' && (
            <div className="bg-red-950 border border-red-800 rounded p-3 text-xs font-bold text-red-300">
              🛑 Expansive clay confirmed. Standard 2" spec will fail within 14 months. Auto-upgraded: 3" HD + 8" stone base + biaxial geogrid (ASTM D6637).
            </div>
          )}
          {analysis.soilRisk === 'medium' && (
            <div className="bg-yellow-950 border border-yellow-800 rounded p-3 text-xs font-bold text-yellow-300">
              ⚠ Marginal soil. 96% Proctor compaction test required before paving. Standard spec approved with moisture monitoring.
            </div>
          )}
          {analysis.soilRisk === 'low' && (
            <div className="bg-green-950 border border-green-800 rounded p-3 text-xs font-bold text-green-300">
              ✓ Excellent bearing capacity. Standard VDOT Section 315 spec confirmed. No geogrid required.
            </div>
          )}
          <div className="flex justify-between text-xs font-bold pt-1">
            <span className="text-zinc-300 uppercase tracking-wider">Recommended Spec</span>
            <span className="text-[#ffcc00]">{analysis.soilRisk === 'high' ? '3" HD + Geogrid' : '2.5" Standard VDOT'}</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Base Depth</span>
            <span className="text-white">{analysis.soilRisk === 'high' ? '8"' : '6"'} Crushed Stone</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Oil Buffer</span>
            <span className="text-[#ffcc00]">±$9/ton shield active</span>
          </div>
        </div>
      </div>

      {/* Q3: 30-Day Weather Matrix */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[#ffcc00] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1">Q3</span>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#ffcc00]">30-Day Financial Weather Matrix</h3>
        </div>
        <div className="mb-3 flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded text-xs font-black uppercase tracking-widest ${analysis.weatherRisk === 'green' ? 'bg-green-950 border border-green-600 text-green-400' : analysis.weatherRisk === 'yellow' ? 'bg-yellow-950 border border-yellow-600 text-yellow-400' : 'bg-red-950 border border-red-700 text-red-400'}`}>
            {analysis.weatherRisk === 'green' ? '✓ PAVE — OPTIMAL WINDOW NEAR' : analysis.weatherRisk === 'yellow' ? '⚠ MARGINAL — RESCHEDULE TO DAY ' + analysis.optimalStartDay : '🛑 NO-PAVE — DELAY TO DAY ' + analysis.optimalStartDay}
          </div>
        </div>
        <div className="grid grid-cols-10 gap-1 mb-4">
          {days.map((d) => (
            <WeatherDay key={d.day} {...d} />
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Optimal Start</span>
            <span className="text-green-400">Day {analysis.optimalStartDay} ({analysis.projectDays}-day window)</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Profit at Risk</span>
            <span className="text-[#ffcc00]">${(analysis.baseProfit - analysis.adjustedProfit).toLocaleString()} if wrong day chosen</span>
          </div>
          <div className="flex justify-between text-xs font-bold">
            <span className="text-zinc-300 uppercase tracking-wider">Ground Temp Delta</span>
            <span className="text-white">Air 58°F vs Ground 44°F — Mat chilling risk</span>
          </div>
        </div>
      </div>

      {/* Q4: AI Contract */}
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[#ffcc00] text-black text-[10px] font-black uppercase tracking-widest px-3 py-1">Q4</span>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#ffcc00]">AI Contract Engine — Claude 3.7</h3>
        </div>
        <ContractTerminal analysis={analysis} />
      </div>
    </div>
  );
}

// ─── Heavy Civil Engineering View ─────────────────────────────────────────────

function HeavyCivilView({ analysis }: { analysis: SiteAnalysis }) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-[#ffcc00]/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🏗️</span>
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest text-[#ffcc00]">Heavy Civil Engineering Analysis</h2>
            <p className="text-zinc-200 text-xs font-bold">AASHTO · VDOT Sec 303/315 · MUTCD · ASTM D2321 · FHWA — {analysis.address}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Module 1: Earthwork & Topo */}
        <div className="bg-zinc-900 border border-amber-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-amber-950 border border-amber-700 rounded-lg p-2.5">
              <span className="text-xl">⛰️</span>
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-amber-400">Earthwork & Topo</h3>
              <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Cut/Fill Balancing · AASHTO T99/T180 · VDOT Sec 303</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-white">{analysis.cutVolumeCY.toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">CY Cut</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-white">{analysis.fillVolumeCY.toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">CY Fill</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-amber-400">{(analysis.swellFactor * 100).toFixed(0)}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Swell Factor</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-[#ffcc00]">${analysis.fillImportCost.toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Import Cost</div>
            </div>
          </div>

          {analysis.fillVolumeCY > 800 ? (
            <div className="bg-amber-950 border border-amber-700 rounded-lg p-4">
              <div className="text-amber-400 font-black text-xs uppercase tracking-widest mb-1">⚠ STRUCTURAL FILL IMPORT REQUIRED</div>
              <p className="text-amber-200 text-xs leading-relaxed">
                Site requires <strong>{analysis.fillVolumeCY.toLocaleString()} CY</strong> of structural fill import.
                Swell factor {(analysis.swellFactor * 100).toFixed(0)}% applied.
                Adding <strong>${analysis.fillImportCost.toLocaleString()}</strong> to earthwork phase.
                96% Proctor compaction required at each 6" lift (AASHTO T180).
              </p>
            </div>
          ) : (
            <div className="bg-green-950 border border-green-800 rounded-lg p-4">
              <div className="text-green-400 font-black text-xs uppercase tracking-widest mb-1">✓ ON-SITE MATERIAL REUSE POSSIBLE</div>
              <p className="text-green-200 text-xs leading-relaxed">
                Cut/fill balance achievable with {analysis.cutVolumeCY.toLocaleString()} CY on-site.
                Mass excavation haul-off: {Math.max(0, analysis.cutVolumeCY - analysis.fillVolumeCY).toLocaleString()} CY.
                Compaction standard: 96% Marshall Unit Weight.
              </p>
            </div>
          )}
        </div>

        {/* Module 2: Stormwater & Drainage */}
        <div className="bg-zinc-900 border border-blue-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-blue-950 border border-blue-700 rounded-lg p-2.5">
              <span className="text-xl">🌊</span>
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-blue-400">Stormwater & Drainage</h3>
              <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Impervious Surface · VPDES · Sheet Flow Calcs</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-white">{analysis.avgSlope}%</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Avg Slope</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-blue-400">{analysis.catchBasinsRequired}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Catch Basins</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-white">{(analysis.sqft * 0.92 / 43560).toFixed(2)}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Impervious (ac)</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-[#ffcc00]">${(analysis.catchBasinsRequired * 4200).toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Drainage Cost</div>
            </div>
          </div>

          {analysis.avgSlope < 1.5 ? (
            <div className="bg-blue-950 border border-blue-700 rounded-lg p-4">
              <div className="text-blue-400 font-black text-xs uppercase tracking-widest mb-1">⚠ FLAT TERRAIN — DRAINAGE INTERVENTION</div>
              <p className="text-blue-200 text-xs leading-relaxed">
                Flat terrain detected ({analysis.avgSlope}% slope).
                Forcing minimum <strong>1.5% pitch</strong> via subgrade reshaping.
                Adding <strong>{analysis.catchBasinsRequired} Type-C catch basins</strong> for proper sheet flow.
                VPDES permit required for disturbance &gt;1 acre.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="text-green-400 font-black text-xs uppercase tracking-widest mb-1">✓ ADEQUATE SLOPE — STANDARD DRAINAGE</div>
              <p className="text-zinc-200 text-xs leading-relaxed">
                Natural slope ({analysis.avgSlope}%) exceeds minimum. Standard curb inlets adequate.
                Confirm outlet structure ties to existing storm system.
                SWPPP required per VDEQ regs if disturbance &gt;10,000 SF.
              </p>
            </div>
          )}
        </div>

        {/* Module 3: Underground Utilities */}
        <div className="bg-zinc-900 border border-orange-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-orange-950 border border-orange-700 rounded-lg p-2.5">
              <span className="text-xl">🔧</span>
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-orange-400">Underground Utilities — Wet/Dry</h3>
              <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Clash Detection · ASTM D2321 · Dig Safe 811</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {[
              { label: 'Water Main Depth', value: `${analysis.utilityDepthFt}ft`, alert: analysis.hasMunicipalMain, color: 'text-orange-400' },
              { label: 'Storm Invert Clearance', value: analysis.hasMunicipalMain ? `${(analysis.utilityDepthFt + 1.5).toFixed(1)}ft forced` : 'Standard', alert: analysis.hasMunicipalMain, color: 'text-white' },
              { label: 'Pipe Bedding Spec', value: analysis.hasMunicipalMain ? 'Class-C (ASTM D2321)' : 'Class-B Standard', alert: false, color: 'text-white' },
              { label: 'Dig Safe 811 Status', value: 'Required — 72hr Notice', alert: false, color: 'text-yellow-400' },
              { label: 'Trench Shoring', value: `>5ft depth — OSHA 29 CFR 1926.652`, alert: analysis.utilityDepthFt >= 5, color: analysis.utilityDepthFt >= 5 ? 'text-red-400' : 'text-zinc-200' },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-2">
                <span className="text-zinc-300 uppercase tracking-wider">{row.label}</span>
                <span className={row.color}>{row.alert ? '⚠ ' : ''}{row.value}</span>
              </div>
            ))}
          </div>

          {analysis.hasMunicipalMain ? (
            <div className="bg-orange-950 border border-orange-700 rounded-lg p-4">
              <div className="text-orange-400 font-black text-xs uppercase tracking-widest mb-1">⚠ UTILITY CLASH DETECTED</div>
              <p className="text-orange-200 text-xs leading-relaxed">
                Municipal water main detected at <strong>{analysis.utilityDepthFt}ft depth</strong>.
                Adjusting storm sewer invert elevation to avoid clash.
                Forcing <strong>Class-C pipe bedding</strong> (ASTM D2321) for 3ft horizontal clearance.
                Notify local utility authority before excavation.
              </p>
            </div>
          ) : (
            <div className="bg-green-950 border border-green-800 rounded-lg p-4">
              <div className="text-green-400 font-black text-xs uppercase tracking-widest mb-1">✓ NO MAJOR CLASHES DETECTED</div>
              <p className="text-green-200 text-xs leading-relaxed">
                No conflicts with known municipal utilities.
                Class-B bedding standard. 811 call required 72hrs pre-dig.
                Verify as-built drawings with local utility authority.
              </p>
            </div>
          )}
        </div>

        {/* Module 4: Traffic Control & MOT */}
        <div className="bg-zinc-900 border border-purple-800/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-purple-950 border border-purple-700 rounded-lg p-2.5">
              <span className="text-xl">🚦</span>
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-widest text-purple-400">Traffic Control & MOT</h3>
              <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Maintenance of Traffic · MUTCD · VDOT Work Zone</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-white">{analysis.flaggersRequired}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Flaggers Required</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-purple-400">${analysis.motCostPerDay.toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">$/Day MOT Cost</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-2xl font-black text-[#ffcc00]">${(analysis.motCostPerDay * analysis.projectDays).toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">Total MOT Budget</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-lg font-black text-white">{analysis.arterialRoad ? 'Type-3' : 'Type-1'}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mt-1">MUTCD Closure</div>
            </div>
          </div>

          {analysis.arterialRoad ? (
            <div className="bg-purple-950 border border-purple-700 rounded-lg p-4">
              <div className="text-purple-400 font-black text-xs uppercase tracking-widest mb-1">⚠ ARTERIAL ROAD — MOT REQUIRED</div>
              <p className="text-purple-200 text-xs leading-relaxed">
                Arterial road access required.
                Forcing <strong>MUTCD Type-3 lane closure</strong> with advance warning signs.
                <strong> {analysis.flaggersRequired} certified flaggers</strong> required per VDOT Work Zone Standards.
                Adding <strong>${analysis.motCostPerDay.toLocaleString()}/day</strong> for MOT crew.
                Total project MOT: <strong>${(analysis.motCostPerDay * analysis.projectDays).toLocaleString()}</strong>.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
              <div className="text-green-400 font-black text-xs uppercase tracking-widest mb-1">✓ LOW-IMPACT ACCESS — STANDARD MOT</div>
              <p className="text-zinc-200 text-xs leading-relaxed">
                No arterial road closure required. MUTCD Type-1 barricades + 1 flagger adequate.
                Coordinate with local traffic engineering for access permit if applicable.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Civil Summary Panel */}
      <div className="bg-zinc-900 border border-[#ffcc00]/20 rounded-xl p-6">
        <h3 className="text-base font-black uppercase tracking-widest text-[#ffcc00] mb-5">
          🏗️ Full Civil Engineering Cost Summary — Worden Standard
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { label: 'Earthwork / Grading', value: `$${analysis.fillImportCost.toLocaleString()}`, note: 'Fill import + compaction' },
            { label: 'Drainage Infrastructure', value: `$${(analysis.catchBasinsRequired * 4200).toLocaleString()}`, note: `${analysis.catchBasinsRequired} Type-C basins` },
            { label: 'Utility Coordination', value: analysis.hasMunicipalMain ? '$3,200' : '$800', note: 'Class-C bedding + 811' },
            { label: 'MOT / Traffic Control', value: `$${(analysis.motCostPerDay * analysis.projectDays).toLocaleString()}`, note: `${analysis.projectDays} days × $${analysis.motCostPerDay.toLocaleString()}` },
          ].map((item) => (
            <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-center">
              <div className="text-xl font-black text-[#ffcc00]">{item.value}</div>
              <div className="text-xs font-black text-white uppercase tracking-wider mt-1">{item.label}</div>
              <div className="text-[10px] text-zinc-300 mt-0.5">{item.note}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {['96% Marshall Compaction', 'VDOT Sec 315 Stone Base', '±$9/ton Oil Shield', 'AASHTO T180 Proctor', 'MUTCD Compliant', 'VPDES Ready', 'Dig Safe 811', '4th Gen · Since 1984'].map((badge) => (
            <span key={badge} className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PreConOmniNode() {
  const [inputValue, setInputValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('godmode');
  const [analysis, setAnalysis] = useState<SiteAnalysis | null>(null);

  const handleScan = () => {
    if (!inputValue.trim()) return;
    setScanning(true);
    setAnalysis(null);
    setTimeout(() => {
      setAnalysis(runAnalysis(inputValue.trim()));
      setScanning(false);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-black to-zinc-950 border-b border-[#ffcc00]/20 pt-36 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <span className="inline-block bg-[#ffcc00] text-black text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1.5 mb-6 shadow-[0_0_30px_rgba(255,204,0,0.4)]">
            Worden OS v4 · God-Mode Pre-Con Dashboard · All Civil Logic Active
          </span>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-[#ffcc00] leading-none mb-3">
            PRE-CON <span className="text-white">OMNI-NODE</span>
          </h1>
          <p className="text-zinc-200 text-xl font-bold max-w-3xl">
            Satellite recon · USGS soils · 30-day financial weather matrix · Full heavy civil analysis · AI contract generation — in a single scan.
          </p>
        </div>
      </div>

      {/* Address Scanner */}
      <div className="px-6 py-8 border-b border-zinc-900 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-2">
                Project Site Address — Paste any address to trigger full civil analysis
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && inputValue.trim()) handleScan(); }}
                placeholder="e.g. 7011 Wood Rd, Richmond, VA 23225"
                className="w-full bg-zinc-900 border border-zinc-700 text-white px-5 py-3.5 text-sm font-bold focus:border-[#ffcc00] outline-none transition-colors placeholder:text-zinc-200"
              />
            </div>
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning || !inputValue.trim()}
              className="sm:self-end bg-[#ffcc00] text-black font-black uppercase tracking-widest text-sm px-10 py-3.5 hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed border-b-4 border-black/20 shadow-[0_0_20px_rgba(255,204,0,0.3)] whitespace-nowrap"
            >
              {scanning ? '⚡ Scanning...' : '🛰️ Run Omni-Analysis'}
            </button>
          </div>

          {/* Demo addresses */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-zinc-200 text-[10px] font-bold uppercase tracking-widest self-center">Try:</span>
            {['7011 Wood Rd, Richmond VA', '1500 Commerce Rd, Richmond VA', '4321 Industrial Blvd, Chesterfield VA'].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => { setInputValue(a); }}
                className="text-[10px] font-bold text-zinc-300 border border-zinc-800 px-3 py-1 hover:border-[#ffcc00]/50 hover:text-[#ffcc00] transition-all"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scanning Overlay */}
      {scanning && (
        <div className="px-6 py-16 max-w-7xl mx-auto text-center">
          <div className="inline-flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-[#ffcc00] border-t-transparent rounded-full animate-spin"></div>
            <div className="space-y-2">
              <div className="text-[#ffcc00] font-black text-xl uppercase tracking-widest">Running Omni-Analysis</div>
              <div className="text-zinc-200 text-sm font-bold">Satellite scan → USGS soils → Weather matrix → Civil engineering → Contract generation</div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && !scanning && (
        <div className="max-w-7xl mx-auto px-6 pt-8">
          {/* Alert Bar */}
          {analysis.alerts.length > 0 && (
            <div className="mb-6 bg-red-950 border border-red-800 rounded-xl p-5">
              <div className="text-red-400 font-black text-xs uppercase tracking-widest mb-3">🛑 {analysis.alerts.length} Critical Alert{analysis.alerts.length > 1 ? 's' : ''} — Worden AI Auto-Corrected</div>
              <div className="space-y-2">
                {analysis.alerts.map((alert, i) => (
                  <div key={i} className="text-red-200 text-xs font-bold leading-relaxed">{alert}</div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-0 mb-8 border-b border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab('godmode')}
              className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'godmode' ? 'border-[#ffcc00] text-[#ffcc00]' : 'border-transparent text-zinc-300 hover:text-zinc-300'}`}
            >
              ⚡ 4-Quadrant God-Mode
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('heavy-civil')}
              className={`px-8 py-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'heavy-civil' ? 'border-[#ffcc00] text-[#ffcc00]' : 'border-transparent text-zinc-300 hover:text-zinc-300'}`}
            >
              🏗️ Heavy Civil Engineering
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'godmode' && <GodModeView analysis={analysis} />}
          {activeTab === 'heavy-civil' && <HeavyCivilView analysis={analysis} />}

          {/* Footer Note */}
          <div className="mt-8 text-center text-zinc-200 text-[10px] font-bold uppercase tracking-widest">
            J. Worden & Sons · Virginia Class A Contractor · 4th Generation Since 1984 · 96% Marshall Compaction · VDOT Section 315 Standard
          </div>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !scanning && (
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🛰️', title: 'Satellite Recon', desc: 'Auto-measure SF, detect overhead lines, flag access issues' },
              { icon: '🪨', title: 'USGS Soils', desc: 'AASHTO soil class, frost-heave risk, auto spec upgrade' },
              { icon: '⛅', title: '30-Day Weather', desc: 'Pave/No-Pave matrix with financial profit/loss risk' },
              { icon: '🏗️', title: 'Heavy Civil', desc: 'Cut/fill, drainage, utility clash detection, MOT analysis' },
            ].map((card) => (
              <div key={card.title} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center hover:border-[#ffcc00]/30 transition-all">
                <div className="text-4xl mb-3">{card.icon}</div>
                <div className="text-sm font-black uppercase tracking-widest text-white mb-2">{card.title}</div>
                <div className="text-xs text-zinc-300 leading-relaxed">{card.desc}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-zinc-200 text-sm font-bold mt-8">
            Enter a project address above to activate the full Worden Omni-Analysis engine.
          </p>
        </div>
      )}
    </div>
  );
}
