import { useState, useEffect } from "react";
/* WORDEN UNIVERSITY v2 — NATIVE MONOREPO INTEGRATION */

const storage = typeof window !== 'undefined' && window.storage ? window.storage : {
  get: async (key) => {
    const val = localStorage.getItem(key);
    return val ? { value: val } : null;
  },
  set: async (key, val) => {
    localStorage.setItem(key, val);
  }
};

async function ld(k,fb){try{const r=await storage.get(k);return r?JSON.parse(r.value):fb}catch{return fb}}
async function sv(k,d){try{await storage.set(k,JSON.stringify(d))}catch{}}

// ─── COURSE DATABASE WITH REAL CONTENT ───
const COURSES = [
  {
    id:"classification", icon:"⚖️", title:"Worker Classification",
    sub:"Employee vs. Contractor vs. Day Labor", price:"$99", hours:"2.5",
    desc:"The #1 mistake that destroys contractors. One wrong classification costs $50,000+ in IRS penalties, back taxes, and state fines. This course teaches you exactly how to classify every worker correctly in every state.",
    audience:"All trades · All states",
    modules:[
      { id:"c1", title:"The Three Types of Workers", mins:15, content:`Every worker on your job site falls into one of three categories: Employee (W-2), Independent Contractor (1099), or Statutory Employee. The distinction isn't about what you call them — it's about how they work.\n\nAn Employee works under your direction. You control when, where, and how they work. You provide tools, set hours, and can fire them. You withhold taxes and pay employer FICA.\n\nAn Independent Contractor controls their own methods. They set their own hours, use their own tools, can work for multiple clients, and profit or lose based on their own decisions. You issue a 1099 if you pay them $600+ in a year.\n\nA Statutory Employee is a hybrid — legally treated as an employee for tax withholding but may operate independently. Common in delivery and sales.\n\nThe consequences of misclassification:\n• IRS penalty: 100% of unpaid employment taxes\n• State penalties: vary, but California starts at $5,000-$25,000 PER WORKER\n• Back wages owed: overtime, benefits, workers comp\n• Criminal prosecution in extreme cases\n\nKey principle: when in doubt, classify as Employee. The cost of over-classifying is higher wages. The cost of under-classifying is business-ending penalties.` },
      { id:"c2", title:"The IRS 20-Factor Test", mins:20, content:`The IRS uses 20 factors grouped into three categories to determine worker classification. No single factor is decisive — it's the overall picture.\n\nBEHAVIORAL CONTROL (how work is done):\n1. Instructions — do you tell them how to do the work, or just what result you need?\n2. Training — do you train them in your methods?\n3. Integration — is their work integral to your business operations?\n4. Personal services — must they personally do the work, or can they hire subs?\n5. Assistants — do you hire their helpers, or do they?\n6. Continuing relationship — is this ongoing or project-based?\n7. Set hours — do you set their schedule?\n8. Full time — do they work for you full time?\n\nFINANCIAL CONTROL (business economics):\n9. Payment method — hourly/salary (employee) vs. per job (contractor)?\n10. Business expenses — who pays for tools, materials, fuel?\n11. Investment — have they invested in their own equipment?\n12. Profit/loss — can they make a profit or take a loss on the job?\n13. Multiple clients — do they work for others?\n\nRELATIONSHIP TYPE:\n14. Written contracts — what does your agreement say?\n15. Benefits — do you provide insurance, vacation, retirement?\n16. Permanency — is this permanent or for a defined period?\n17. Firing — can you fire them without breach of contract?\n18. Right to quit — can they quit without liability?\n\nIf most factors point to you controlling the work → Employee.\nIf most factors point to them controlling the work → Contractor.` },
      { id:"c3", title:"The ABC Test — State by State", mins:25, content:`Several states use the ABC Test, which is STRICTER than the IRS test. Under ABC, a worker is an Employee UNLESS all three conditions are met:\n\nA — The worker is FREE from control and direction in performing the work, both under the contract and in fact.\n\nB — The worker performs work that is OUTSIDE the usual course of your business. (This is the killer — if you're a paving company and the worker does paving, they fail B.)\n\nC — The worker is customarily engaged in an independently established trade, occupation, or business of the same nature.\n\nStates using ABC Test (full or modified):\n• California (AB5 — strictest in the nation)\n• Massachusetts\n• New Jersey (Dynamex decision)\n• Illinois (Employee Classification Act)\n• Connecticut\n• Vermont\n• Several others with variations\n\nThe "B" prong is critical for construction: if you're a paving contractor and you hire a "1099 paver" — they fail the B test because paving IS your usual course of business. In ABC states, that worker is an employee regardless of what your contract says.\n\nExceptions exist for licensed professionals, certain trades, and specific business-to-business relationships. Check your state's specific exceptions.` },
      { id:"c4", title:"Day Labor Laws", mins:20, content:`Day labor is legal in every state but heavily regulated. The rules vary dramatically.\n\nFederal baseline:\n• Day laborers are generally employees, not contractors\n• Minimum wage and overtime laws apply\n• You must maintain records of hours worked\n• Workers comp coverage may be required\n\nState-specific examples:\n\nVirginia: No specific day labor statute. Follows federal guidelines. Workers comp required if 2+ employees.\n\nCalifornia: Day labor is presumed employment under AB5. Must provide workers comp, meal breaks, and written pay notices. Penalties for misclassification start at $5,000.\n\nTexas: No state income tax simplifies withholding. Workers comp is optional (one of few states). But federal wage/hour still applies.\n\nGeorgia: Follows federal guidelines. No state-specific day labor law. Workers comp required for 3+ employees.\n\nRed flags that trigger audits:\n• Using the same "day laborers" repeatedly (pattern = employment)\n• Providing tools and equipment to "day laborers"\n• Setting hours for "day laborers"\n• Not reporting payments over $600\n\nProtection: if you use day labor, document each engagement separately, track hours, ensure you're paying at least minimum wage, and consider them employees for tax purposes.` },
      { id:"c5", title:"Contracts That Protect You", mins:15, content:`The right written agreement doesn't guarantee contractor status, but the wrong one guarantees employee status.\n\nEssential Independent Contractor Agreement clauses:\n\n1. Statement of independent relationship — explicitly state they are not an employee\n2. Control — state that they control methods, means, and manner of work\n3. Tools and equipment — they provide their own\n4. Insurance — they carry their own GL and workers comp\n5. Multiple clients — they are free to work for others\n6. No benefits — no insurance, vacation, retirement provided\n7. Payment — per project, not hourly/salary\n8. Termination — per contract terms, not at-will\n9. Taxes — they are responsible for their own\n10. Indemnification — they hold you harmless\n\nCRITICAL: A contract calling someone a "contractor" means nothing if you treat them like an employee. The IRS looks at the actual working relationship, not the paper.\n\nEmployee agreements are different:\n• At-will employment statement\n• Job description and duties\n• Compensation and pay schedule\n• Benefits (if applicable)\n• Work hours and location\n• Company policies and handbook reference\n• Confidentiality and non-compete (if applicable)` },
      { id:"c6", title:"Real Cases — What Went Wrong", mins:15, content:`Case 1: Georgia Paving Contractor\nUsed the same 8 "1099 contractors" for 3 years. Provided all equipment. Set daily schedule. IRS audit found all 8 were employees. Result: $127,000 in back employment taxes, penalties, and interest. Company closed.\n\nCase 2: California Landscaper\nHired "independent" crew leaders who brought their own workers. AB5 audit found crew leaders were employees (failed B test — landscaping IS the company's business). Result: $340,000 in penalties across 3 years of misclassification.\n\nCase 3: Texas Roofing Company\nUsed day laborers from a parking lot. Paid cash. Worker fell from a roof and was seriously injured. No workers comp. OSHA investigated. Result: $67,000 OSHA fine + $450,000 personal injury settlement. Owner personally liable because worker was classified as employee under federal law.\n\nCase 4: Virginia Electrical Contractor\nProperly classified subs with written contracts, separate insurance, own tools, multiple clients. IRS audit confirmed contractor status. No penalties. The difference: real independence, not just paperwork.\n\nThe pattern: companies that lose are controlling the workers but calling them contractors. Companies that win are letting contractors truly operate independently.` },
    ],
    quiz:[
      { q:"Under the IRS test, which factor is MOST important for determining classification?", opts:["Written contract","Who provides the tools","No single factor — it's the overall picture","Whether they work full time"], a:2 },
      { q:"What does the 'B' prong of the ABC test require?", opts:["The worker is free from control","The work is outside your usual course of business","The worker has an established business","The worker has a written contract"], a:1 },
      { q:"In California under AB5, a paving company hires a '1099 paver.' What is their likely classification?", opts:["Independent contractor","Statutory employee","Employee — fails the B prong","Exempt professional"], a:2 },
      { q:"What is the IRS penalty for misclassifying employees as contractors?", opts:["$500 per worker","Warning letter","Up to 100% of unpaid employment taxes","10% surcharge"], a:2 },
      { q:"Which of these protects contractor status?", opts:["Calling them a contractor in the contract","Having them use your tools but their truck","They control methods, provide own tools, work for multiple clients","Paying them per hour but issuing a 1099"], a:2 },
      { q:"A 'day laborer' you use 3 days per week for 6 months is most likely classified as:", opts:["Day laborer","Independent contractor","Employee","Statutory employee"], a:2 },
      { q:"In an ABC test state, how does a worker PASS all three prongs?", opts:["Have a written contract calling them independent","Work outside your core business, be free from control, have their own established business","Work more than 30 hours per week","Have their own vehicle"], a:1 },
      { q:"What is the BEST protection against misclassification penalties?", opts:["Strong written contracts","When in doubt, classify as employee and pay proper taxes","Only use day labor","Hire through a temp agency"], a:1 },
    ],
  },
  {
    id:"osha", icon:"🦺", title:"OSHA Construction Safety",
    sub:"Compliance, Documentation, Prevention", price:"$149", hours:"4",
    desc:"OSHA fines start at $16,131 per violation. Willful violations hit $161,323. This course covers required safety programs, documentation, and how to survive an inspection.",
    audience:"All trades · Foremen & safety officers",
    modules:[
      { id:"o1", title:"OSHA Construction Standards Overview", mins:20, content:`OSHA's construction standards are found in 29 CFR 1926. Every construction employer must comply regardless of company size.\n\nThe "Fatal Four" — causes of most construction deaths:\n1. Falls (38.7%) — leading cause every year\n2. Struck-by (9.4%) — vehicles, falling objects, swinging loads\n3. Electrocution (7.2%) — contact with power lines, faulty equipment\n4. Caught-in/between (5.4%) — trenching, machinery, collapsing structures\n\nThese four hazards account for over 60% of construction worker deaths. Eliminating them is OSHA's primary enforcement focus.\n\nPenalty structure (2024/2025):\n• Other-than-serious: up to $16,131 per violation\n• Serious: up to $16,131 per violation\n• Willful: $16,131 to $161,323 per violation\n• Repeat: up to $161,323 per violation\n• Failure to abate: $16,131 per day\n\nEvery contractor needs these written programs:\n• Hazard Communication (HazCom)\n• Fall Protection Plan\n• Personal Protective Equipment (PPE) Assessment\n• Emergency Action Plan\n• Silica Exposure Control Plan (if applicable)\n• Heat Illness Prevention Plan\n• Trenching/Excavation Plan (if applicable)` },
      { id:"o2", title:"Fall Protection — The #1 Killer", mins:20, content:`Fall protection is required at 6 feet in construction (lower than the 10-foot general industry threshold).\n\nThree methods of fall protection:\n1. Guardrail systems — 42" top rail, 21" mid rail, can withstand 200 lbs force\n2. Safety net systems — installed within 30 feet of working surface\n3. Personal fall arrest systems — harness + lanyard + anchor point rated for 5,000 lbs\n\nFor paving contractors, falls typically occur:\n• Loading/unloading trucks\n• Working on elevated structures (bridges, overpasses)\n• Excavation/trench edges\n• Roof work (for waterproofing, coating)\n\nDocumentation required:\n• Written fall protection plan for each site\n• Training records for each employee\n• Equipment inspection logs (harnesses, lanyards, anchors)\n• Rescue plan — how will you get a fallen worker down?\n\nCommon violations:\n• No fall protection above 6 feet\n• Untrained workers at height\n• Uninspected equipment\n• No rescue plan` },
      { id:"o3", title:"Hazard Communication (HazCom)", mins:15, content:`Every chemical on your job site needs a Safety Data Sheet (SDS). Every worker needs to know what they're working with.\n\nHazCom requirements:\n1. Written HazCom program\n2. SDS for every chemical product (asphalt emulsions, sealcoat, tack coat, solvents, fuels, concrete admixtures)\n3. Labels on all containers\n4. Employee training on hazards\n\nFor paving contractors, common HazCom chemicals:\n• Asphalt emulsions — skin/eye irritant, heated fumes\n• Coal tar sealant — known carcinogen (banned in some cities)\n• Tack coat — flammable, skin irritant\n• Diesel fuel — flammable, skin irritant\n• Concrete release agents — varies by product\n• Line striping paint — VOCs, respiratory hazard\n\nTraining must cover:\n• Location of SDS sheets\n• How to read an SDS\n• What PPE is required for each chemical\n• What to do if exposed\n• Emergency procedures for spills` },
      { id:"o4", title:"Silica Exposure — New Enforcement Priority", mins:20, content:`Crystalline silica exposure is OSHA's fastest-growing enforcement area. Cutting, grinding, or drilling concrete, asphalt, brick, or stone generates silica dust.\n\nThe rule: if workers are exposed above 25 μg/m³ (action level), you must have a written Exposure Control Plan.\n\nConstruction activities that generate silica:\n• Concrete cutting and sawing\n• Asphalt milling\n• Brick/block cutting\n• Grinding concrete surfaces\n• Jackhammering\n• Drilling into concrete/masonry\n\nTable 1 compliance (simplified):\nOSHA provides Table 1 — specific control methods for common tasks. If you follow Table 1 exactly, you don't need air monitoring.\n\nExample: Handheld power saw cutting concrete\n→ Use saw with integrated water delivery system\n→ Operate and maintain per manufacturer\n→ No exposure monitoring needed if following Table 1\n\nIf NOT following Table 1:\n→ Must conduct air monitoring\n→ Must have a written Exposure Control Plan\n→ Medical surveillance for workers above PEL\n→ Respirator program required\n\nPenalties for silica violations are among the highest OSHA issues. Multiple citations per site are common.` },
      { id:"o5", title:"Heat Illness Prevention", mins:15, content:`OSHA is actively developing a federal heat standard. Several states already enforce their own (California, Washington, Oregon, Minnesota).\n\nCurrent federal requirement: General Duty Clause — employers must provide a workplace free from recognized hazards. Heat IS a recognized hazard in construction.\n\nOSHA's recommended program:\n\nWater: Cold water available at all times. Minimum 1 quart per worker per hour.\n\nRest: Shade or cool-down area available. Mandatory breaks when heat index exceeds thresholds.\n\nShade: Access to shade within 2 minutes when temp exceeds 80°F.\n\nAcclimatization: New workers or those returning from absence — gradually increase workload over 7-14 days.\n\nTraining: Every worker must know:\n• Signs and symptoms of heat illness\n• How to respond to a coworker showing symptoms\n• How to call for emergency help\n• Their right to take a break without retaliation\n\nHeat illness stages:\n1. Heat cramps — muscle cramps, sweating\n2. Heat exhaustion — heavy sweating, weakness, nausea, dizziness\n3. Heat stroke — body temp >104°F, confusion, loss of consciousness — THIS IS FATAL WITHOUT IMMEDIATE TREATMENT\n\nDocumentation: log all heat-related incidents, breaks taken, training provided, and acclimatization schedules.` },
      { id:"o6", title:"Trenching and Excavation", mins:15, content:`Trenching kills more construction workers than most people realize. A cubic yard of soil weighs 3,000+ pounds. A trench collapse is almost always fatal.\n\nOSHA rules (29 CFR 1926 Subpart P):\n\nDepth triggers:\n• Under 5 feet: protection required if hazardous conditions exist\n• 5 to 20 feet: protective system REQUIRED (sloping, shoring, or trench box)\n• Over 20 feet: must be designed by a registered professional engineer\n\nCompetent Person: EVERY excavation must have a designated competent person who:\n• Identifies hazards\n• Inspects the excavation daily and after rain\n• Has authority to stop work immediately\n• Classifies soil type (Type A, B, or C)\n\nSoil classification determines protection method:\n• Type A (stable, cohesive): 3/4:1 slope\n• Type B (medium stability): 1:1 slope\n• Type C (granular, loose): 1.5:1 slope\n\nFor paving contractors, excavation typically involves:\n• Full-depth removal and replacement\n• Utility trenching\n• Base preparation for new construction\n• Drainage installation\n\nALWAYS call 811 before digging. Underground utilities kill.` },
      { id:"o7", title:"Tailgate Safety Meetings", mins:10, content:`A tailgate safety meeting is a brief (5-15 minute) crew meeting at the start of each work day or before starting a new task. OSHA doesn't explicitly require them, but they are the best documentation of your safety program.\n\nFormat:\n1. Topic of the day (specific to today's work)\n2. Hazards to watch for\n3. Required PPE\n4. Emergency procedures\n5. Questions from crew\n6. Sign-in sheet\n\nSample topics for paving crews:\n• Hot asphalt burn prevention\n• Traffic control zone setup\n• Rolling equipment blind spots\n• Heat illness prevention (summer)\n• Silica dust exposure from milling\n• Backing safety — use a spotter\n• Proper lifting technique for manhole adjustments\n• Proper tool inspection before starting work\n\nDocumentation is everything:\n• Date, time, location, project name\n• Topic covered\n• Attendee signatures (every person on site signs)\n• Keep records for minimum 5 years\n\nWhen OSHA inspects, the first thing they ask for is your safety meeting documentation. If you have a stack of signed tailgate meeting records, it demonstrates a safety culture. If you have nothing, every violation becomes "willful" — $161,323 per occurrence.` },
      { id:"o8", title:"PPE Requirements", mins:10, content:`Personal Protective Equipment is the LAST line of defense, not the first. OSHA's hierarchy of controls:\n\n1. Elimination — remove the hazard\n2. Substitution — replace with less hazardous\n3. Engineering controls — isolate workers from hazard\n4. Administrative controls — change work practices\n5. PPE — worn by the worker\n\nRequired PPE for construction:\n\nHead: Hard hat (Type I top impact, Type II top and side) — required whenever overhead hazards exist or objects could fall\n\nEyes: Safety glasses (ANSI Z87.1) — required during cutting, grinding, chipping, or when debris is generated\n\nHearing: Protection required when noise exceeds 85 dB for 8 hours. Asphalt pavers, rollers, and saws typically exceed this.\n\nHands: Gloves appropriate to hazard — heat-resistant for hot asphalt, chemical-resistant for sealcoat/tack, cut-resistant for handling sharp materials\n\nFeet: Steel-toe boots minimum. For paving — heat-resistant soles rated for hot asphalt (250°F+)\n\nVisibility: High-visibility vest required for all workers exposed to traffic or mobile equipment. ANSI/ISEA 107 Class 2 minimum.\n\nRespiratory: Required when airborne hazards exceed PEL (silica, asphalt fumes in enclosed spaces). Must have a written respiratory protection program.\n\nEmployer must: assess hazards, select appropriate PPE, provide PPE at no cost, train workers on proper use, maintain and replace as needed.` },
      { id:"o9", title:"OSHA 300 Log Management", mins:10, content:`Every employer with 11+ employees must maintain OSHA injury and illness records.\n\nThree forms:\n• OSHA 300 — Log of injuries and illnesses (running log for the year)\n• OSHA 300A — Summary (posted February 1 through April 30 each year)\n• OSHA 301 — Individual incident report (detailed form for each recordable case)\n\nWhat's recordable:\n• Any work-related death\n• Days away from work\n• Restricted work or transfer\n• Medical treatment beyond first aid\n• Loss of consciousness\n• Significant injury/illness diagnosed by physician\n\nWhat's NOT recordable:\n• First aid treatment only\n• Visits to doctor for observation/counseling only\n• Diagnostic procedures (X-rays, blood tests)\n• Tetanus shots\n• OTC medications at nonprescription strength\n\nElectronic reporting: establishments with 20+ employees in certain industries must electronically submit 300A data annually to OSHA.\n\nRetention: keep all records for 5 years following the year they cover.\n\nDuring an inspection, OSHA will request your 300 log. Having it accurate and current demonstrates compliance. Not having it is an automatic citation.` },
      { id:"o10", title:"Surviving an OSHA Inspection", mins:15, content:`OSHA can inspect your job site without notice. Knowing your rights and responsibilities determines whether you get a warning or a $161,323 citation.\n\nOSHA inspection triggers:\n• Fatality or hospitalization (mandatory investigation)\n• Worker complaint (formal or informal)\n• Referral from another agency\n• Planned/programmed inspection (high-hazard industries)\n• Follow-up from previous inspection\n\nYour rights during an inspection:\n1. Ask for credentials — verify the inspector is real OSHA\n2. You MAY accompany the inspector (and should)\n3. You MAY ask why they're inspecting\n4. You MAY take notes and photos alongside the inspector\n5. You may NOT refuse entry (they'll get a warrant)\n6. You may NOT coach workers on what to say\n7. Workers have the right to speak privately with the inspector\n\nDuring the walkaround:\n• Be cooperative but don't volunteer information\n• Take the same photos the inspector takes\n• Note everything they look at, ask about, or comment on\n• Have your competent person present\n• Have your safety documentation ready (300 log, tailgate meeting records, training records, written programs)\n\nAfter the inspection:\n• You'll receive citations by mail within 6 months\n• You have 15 working days to contest\n• Informal conference can reduce penalties 30-50%\n• Abatement must be completed by the date specified\n\nBest defense: a stack of tailgate meeting records, current training documentation, written safety programs, and a clean 300 log. These demonstrate a safety culture that inspectors respect.` },
    ],
    quiz:[
      { q:"What are OSHA's 'Fatal Four' in construction?", opts:["Falls, struck-by, electrocution, caught-in/between","Fire, collapse, drowning, heat stroke","Chemical, radiation, noise, vibration","Equipment failure, falls, traffic, weather"], a:0 },
      { q:"At what height is fall protection REQUIRED in construction?", opts:["4 feet","6 feet","10 feet","15 feet"], a:1 },
      { q:"What is the maximum OSHA penalty for a willful violation?", opts:["$16,131","$50,000","$100,000","$161,323"], a:3 },
      { q:"Which is TRUE about silica exposure in construction?", opts:["Only applies to concrete work","Following Table 1 eliminates need for air monitoring","Only affects workers over age 50","Silica dust is harmless when wet"], a:1 },
      { q:"At what trench depth is a protective system REQUIRED?", opts:["Any depth","4 feet","5 feet","10 feet"], a:2 },
      { q:"What is the FIRST thing OSHA asks for during an inspection?", opts:["Your business license","Worker immigration status","Safety meeting documentation and 300 log","Equipment purchase receipts"], a:2 },
      { q:"Heat stroke body temperature threshold is:", opts:["100°F","102°F","104°F","106°F"], a:2 },
      { q:"How long must OSHA 300 logs be retained?", opts:["1 year","3 years","5 years","10 years"], a:2 },
    ],
  },
];

// ─── STYLES ───
const S={bg:"#08090e",sf:"#0c0e15",bd:"rgba(255,255,255,0.04)",am:"#f5a623",amD:"rgba(245,166,35,0.06)",tx:"#c9cdd8",dm:"rgba(255,255,255,0.25)",gn:"#22c55e",rd:"#ef4444",mn:"'IBM Plex Mono',monospace",sr:"'Instrument Serif',Georgia,serif"};
const inp={width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid rgba(255,255,255,0.06)`,borderRadius:6,color:"#e0e2e8",fontFamily:S.mn,fontSize:14,padding:"10px 14px",outline:"none"};

export default function WordenUniversity(){
  const [view,setView]=useState("catalog"); // catalog | course | module | quiz | result | certs
  const [courseId,setCourseId]=useState(null);
  const [modIdx,setModIdx]=useState(0);
  const [progress,setProgress]=useState({}); // {courseId: {completed:[], quizScore:null, certified:false}}
  const [quizAnswers,setQuizAnswers]=useState({});
  const [quizSubmitted,setQuizSubmitted]=useState(false);

  useEffect(()=>{ld("wu-progress",{}).then(setProgress)},[]);
  useEffect(()=>{if(Object.keys(progress).length)sv("wu-progress",progress)},[progress]);

  const course=courseId?COURSES.find(c=>c.id===courseId):null;
  const cp=course?progress[course.id]||{completed:[],quizScore:null,certified:false}:null;

  const markComplete=(modId)=>{
    setProgress(p=>{
      const cur=p[courseId]||{completed:[],quizScore:null,certified:false};
      if(cur.completed.includes(modId))return p;
      return{...p,[courseId]:{...cur,completed:[...cur.completed,modId]}};
    });
  };

  const submitQuiz=()=>{
    if(!course)return;
    let correct=0;
    course.quiz.forEach((q,i)=>{if(quizAnswers[i]===q.a)correct++});
    const score=Math.round((correct/course.quiz.length)*100);
    const passed=score>=80;
    setProgress(p=>({...p,[courseId]:{...p[courseId]||{completed:[]},quizScore:score,certified:passed}}));
    setQuizSubmitted(true);
  };

  const allModsDone=course&&cp?course.modules.every(m=>cp.completed.includes(m.id)):false;
  const totalCerts=Object.values(progress).filter(p=>p.certified).length;

  return(
    <div style={{minHeight:"100vh",background:S.bg,color:S.tx,fontFamily:S.mn}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700;800&family=Instrument+Serif&display=swap');*{margin:0;padding:0;box-sizing:border-box}::selection{background:rgba(245,166,35,0.15);color:#f5a623}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.05);border-radius:2px}.wh:hover{background:rgba(255,255,255,0.03)!important}`}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:S.bg+"e8",backdropFilter:"blur(16px)",borderBottom:`1px solid ${S.bd}`,padding:"0 20px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span onClick={()=>{setView("catalog");setCourseId(null)}} style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:S.am,cursor:"pointer"}}>WORDEN UNIVERSITY</span>
          {totalCerts>0&&<span style={{fontSize:10,color:S.gn,background:`${S.gn}12`,padding:"2px 8px",borderRadius:10}}>{totalCerts} cert{totalCerts>1?"s":""}</span>}
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <button onClick={()=>{setView("certs");setCourseId(null)}} style={{fontFamily:S.mn,fontSize:11,color:S.dm,background:"none",border:"none",cursor:"pointer"}}>My Certificates</button>
          <a href="https://thewordenstandard.com" style={{fontSize:11,color:S.dm,textDecoration:"none"}}>Worden Standard →</a>
        </div>
      </nav>

      <div style={{maxWidth:780,margin:"0 auto",padding:"0 20px"}}>

        {/* CATALOG */}
        {view==="catalog"&&(
          <div>
            <div style={{padding:"48px 0 36px"}}>
              <div style={{fontFamily:S.sr,fontSize:"clamp(2rem,5vw,3rem)",color:"#e0e2e8",fontWeight:400,lineHeight:1.1,marginBottom:10}}>Worden <span style={{color:S.am}}>University</span></div>
              <div style={{fontSize:13,color:S.dm,lineHeight:1.8,maxWidth:520,marginBottom:24}}>Contractor training built by a contractor. Real content, real testing, real certificates. Complete a course, pass the exam at 80%, earn your certification.</div>
              <div style={{display:"flex",gap:20,marginBottom:28}}>
                {[{v:COURSES.length,l:"Courses"},{v:COURSES.reduce((s,c)=>s+c.modules.length,0),l:"Modules"},{v:totalCerts,l:"Earned"},{v:"51",l:"States"}].map((m,i)=>(
                  <div key={i}><div style={{fontSize:18,fontWeight:700,color:i===2&&totalCerts?S.gn:S.am}}>{m.v}</div><div style={{fontSize:10,color:S.dm}}>{m.l}</div></div>
                ))}
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6,paddingBottom:48}}>
              {COURSES.map(c=>{
                const p=progress[c.id]||{completed:[],quizScore:null,certified:false};
                const pct=Math.round((p.completed.length/c.modules.length)*100);
                return(
                  <div key={c.id} onClick={()=>{setCourseId(c.id);setView("course")}} className="wh"
                    style={{background:S.sf,border:`1px solid ${S.bd}`,borderRadius:8,padding:"18px 16px",cursor:"pointer",transition:"all 0.15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <span style={{fontSize:22}}>{c.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:600,color:"#e0e2e8"}}>{c.title}</div>
                        <div style={{fontSize:11,color:S.dm,marginTop:2}}>{c.sub} · {c.modules.length} modules · {c.hours} hrs</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        {p.certified?<span style={{fontSize:11,fontWeight:700,color:S.gn}}>✓ Certified</span>:
                         pct>0?<span style={{fontSize:11,color:S.am}}>{pct}%</span>:
                         <span style={{fontSize:13,fontWeight:700,color:S.am}}>{c.price}</span>}
                      </div>
                    </div>
                    {pct>0&&!p.certified&&(
                      <div style={{marginTop:10,height:2,background:"rgba(255,255,255,0.03)",borderRadius:1,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:S.am,borderRadius:1,transition:"width 0.3s"}}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COURSE OVERVIEW */}
        {view==="course"&&course&&(
          <div style={{padding:"28px 0 48px"}}>
            <button onClick={()=>{setView("catalog");setCourseId(null)}} style={{fontFamily:S.mn,fontSize:11,color:S.dm,background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← All Courses</button>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
              <span style={{fontSize:28}}>{course.icon}</span>
              <div>
                <div style={{fontFamily:S.sr,fontSize:22,color:"#e0e2e8"}}>{course.title}</div>
                <div style={{fontSize:12,color:S.dm,marginTop:2}}>{course.sub}</div>
              </div>
              {cp.certified&&<span style={{marginLeft:"auto",fontSize:12,fontWeight:700,color:S.gn,background:`${S.gn}10`,padding:"4px 12px",borderRadius:5}}>✓ Certified</span>}
            </div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.35)",lineHeight:1.8,marginBottom:24}}>{course.desc}</div>

            {/* Progress */}
            <div style={{marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:S.dm,marginBottom:6}}>
                <span>{cp.completed.length} of {course.modules.length} complete</span>
                <span>{Math.round((cp.completed.length/course.modules.length)*100)}%</span>
              </div>
              <div style={{height:3,background:"rgba(255,255,255,0.03)",borderRadius:2,overflow:"hidden"}}>
                <div style={{width:`${(cp.completed.length/course.modules.length)*100}%`,height:"100%",background:S.am,borderRadius:2,transition:"width 0.3s"}}/>
              </div>
            </div>

            {/* Module List */}
            <div style={{fontSize:11,fontWeight:600,color:S.dm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Modules</div>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:24}}>
              {course.modules.map((m,i)=>{
                const done=cp.completed.includes(m.id);
                return(
                  <div key={m.id} onClick={()=>{setModIdx(i);setView("module")}} className="wh"
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:6,cursor:"pointer",borderLeft:`2px solid ${done?S.gn:S.am+"30"}`}}>
                    <span style={{width:18,height:18,borderRadius:4,background:done?`${S.gn}15`:"rgba(255,255,255,0.02)",border:`1px solid ${done?S.gn+"30":"rgba(255,255,255,0.06)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:done?S.gn:S.dm,flexShrink:0}}>{done?"✓":String(i+1).padStart(2,"00")}</span>
                    <div style={{flex:1}}><div style={{fontSize:13,color:done?"rgba(255,255,255,0.3)":"#e0e2e8"}}>{m.title}</div></div>
                    <span style={{fontSize:10,color:S.dm}}>{m.mins} min</span>
                  </div>
                );
              })}
            </div>

            {/* Quiz Button */}
            {allModsDone&&!cp.certified&&(
              <button onClick={()=>{setQuizAnswers({});setQuizSubmitted(false);setView("quiz")}}
                style={{width:"100%",padding:14,background:S.am,color:S.bg,fontFamily:S.mn,fontSize:13,fontWeight:700,border:"none",borderRadius:6,cursor:"pointer",marginBottom:8}}>
                Take Certification Exam →
              </button>
            )}
            {!allModsDone&&<div style={{fontSize:11,color:S.dm,textAlign:"center",padding:10}}>Complete all modules to unlock the certification exam</div>}
            {cp.certified&&<div style={{textAlign:"center",padding:16,background:`${S.gn}08`,border:`1px solid ${S.gn}15`,borderRadius:6,fontSize:13,color:S.gn,fontWeight:600}}>✓ You passed with {cp.quizScore}% — Certificate earned</div>}
            {cp.quizScore!==null&&!cp.certified&&<div style={{textAlign:"center",padding:16,background:`${S.rd}08`,border:`1px solid ${S.rd}15`,borderRadius:6,fontSize:13,color:S.rd}}>Score: {cp.quizScore}% — Need 80% to certify. <button onClick={()=>{setQuizAnswers({});setQuizSubmitted(false);setView("quiz")}} style={{color:S.am,background:"none",border:"none",cursor:"pointer",fontFamily:S.mn,textDecoration:"underline"}}>Retake</button></div>}
          </div>
        )}

        {/* MODULE VIEWER */}
        {view==="module"&&course&&(
          <div style={{padding:"28px 0 48px",maxWidth:640}}>
            <button onClick={()=>setView("course")} style={{fontFamily:S.mn,fontSize:11,color:S.dm,background:"none",border:"none",cursor:"pointer",marginBottom:16}}>← {course.title}</button>
            <div style={{fontSize:10,color:S.am,fontWeight:600,letterSpacing:"0.08em",marginBottom:6}}>MODULE {String(modIdx+1).padStart(2,"0")} OF {String(course.modules.length).padStart(2,"0")}</div>
            <div style={{fontFamily:S.sr,fontSize:22,color:"#e0e2e8",marginBottom:6}}>{course.modules[modIdx].title}</div>
            <div style={{fontSize:11,color:S.dm,marginBottom:24}}>{course.modules[modIdx].mins} minutes</div>

            <div style={{fontSize:14,color:"rgba(255,255,255,0.45)",lineHeight:2,whiteSpace:"pre-wrap",marginBottom:32}}>
              {course.modules[modIdx].content}
            </div>

            <div style={{display:"flex",gap:8}}>
              {modIdx>0&&<button onClick={()=>setModIdx(modIdx-1)} style={{flex:1,padding:12,borderRadius:6,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontFamily:S.mn,fontSize:12,cursor:"pointer"}}>← Previous</button>}
              <button onClick={()=>{markComplete(course.modules[modIdx].id);if(modIdx<course.modules.length-1){setModIdx(modIdx+1)}else{setView("course")}}}
                style={{flex:1,padding:12,borderRadius:6,background:S.am,color:S.bg,fontFamily:S.mn,fontSize:12,fontWeight:700,border:"none",cursor:"pointer"}}>
                {modIdx<course.modules.length-1?"Complete & Next →":"Complete Module ✓"}
              </button>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {view==="quiz"&&course&&(
          <div style={{padding:"28px 0 48px",maxWidth:640}}>
            <button onClick={()=>setView("course")} style={{fontFamily:S.mn,fontSize:11,color:S.dm,background:"none",border:"none",cursor:"pointer",marginBottom:16}}>← Back</button>
            <div style={{fontFamily:S.sr,fontSize:22,color:"#e0e2e8",marginBottom:4}}>Certification Exam</div>
            <div style={{fontSize:12,color:S.dm,marginBottom:28}}>{course.title} · {course.quiz.length} questions · 80% required to pass</div>

            {!quizSubmitted?(
              <div style={{display:"flex",flexDirection:"column",gap:20}}>
                {course.quiz.map((q,qi)=>(
                  <div key={qi} style={{background:S.sf,border:`1px solid ${S.bd}`,borderRadius:8,padding:16}}>
                    <div style={{fontSize:13,color:"#e0e2e8",lineHeight:1.7,marginBottom:12}}><span style={{color:S.am,fontWeight:700}}>{qi+1}.</span> {q.q}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {q.opts.map((opt,oi)=>(
                        <button key={oi} onClick={()=>setQuizAnswers(p=>({...p,[qi]:oi}))} className="wh"
                          style={{textAlign:"left",padding:"10px 12px",borderRadius:5,border:`1px solid ${quizAnswers[qi]===oi?S.am+"40":S.bd}`,background:quizAnswers[qi]===oi?S.amD:"transparent",color:quizAnswers[qi]===oi?"#e0e2e8":"rgba(255,255,255,0.4)",fontFamily:S.mn,fontSize:12,cursor:"pointer",lineHeight:1.6}}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={submitQuiz} disabled={Object.keys(quizAnswers).length<course.quiz.length}
                  style={{width:"100%",padding:14,background:Object.keys(quizAnswers).length<course.quiz.length?"rgba(255,255,255,0.03)":S.am,color:Object.keys(quizAnswers).length<course.quiz.length?S.dm:S.bg,fontFamily:S.mn,fontSize:13,fontWeight:700,border:"none",borderRadius:6,cursor:Object.keys(quizAnswers).length<course.quiz.length?"not-allowed":"pointer"}}>
                  Submit Exam ({Object.keys(quizAnswers).length}/{course.quiz.length} answered)
                </button>
              </div>
            ):(
              <div>
                {course.quiz.map((q,qi)=>{
                  const correct=quizAnswers[qi]===q.a;
                  return(
                    <div key={qi} style={{background:S.sf,border:`1px solid ${correct?S.gn+"15":S.rd+"15"}`,borderRadius:8,padding:16,marginBottom:8}}>
                      <div style={{fontSize:13,color:"#e0e2e8",lineHeight:1.7,marginBottom:8}}><span style={{color:correct?S.gn:S.rd,fontWeight:700}}>{correct?"✓":"✗"}</span> {q.q}</div>
                      {!correct&&<div style={{fontSize:12,color:S.gn,padding:"6px 10px",background:`${S.gn}08`,borderRadius:4}}>Correct: {q.opts[q.a]}</div>}
                    </div>
                  );
                })}
                <div style={{textAlign:"center",padding:20,marginTop:16}}>
                  <div style={{fontSize:28,fontWeight:700,color:cp.certified?S.gn:S.rd}}>{cp.quizScore}%</div>
                  <div style={{fontSize:13,color:cp.certified?S.gn:S.rd,marginTop:4}}>{cp.certified?"PASSED — Certificate Earned":"Below 80% — Review and retake"}</div>
                  <button onClick={()=>setView("course")} style={{marginTop:16,padding:"10px 24px",borderRadius:6,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontFamily:S.mn,fontSize:12,cursor:"pointer"}}>Back to Course</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CERTIFICATES */}
        {view==="certs"&&(
          <div style={{padding:"48px 0"}}>
            <div style={{fontFamily:S.sr,fontSize:22,color:"#e0e2e8",marginBottom:20}}>My Certificates</div>
            {totalCerts===0?<div style={{fontSize:12,color:S.dm,padding:40,textAlign:"center"}}>No certificates earned yet. Complete a course and pass the exam at 80% to earn your first certificate.</div>:
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {COURSES.filter(c=>progress[c.id]?.certified).map(c=>(
                <div key={c.id} style={{background:S.sf,border:`1px solid ${S.gn}15`,borderRadius:8,padding:20,display:"flex",alignItems:"center",gap:14}}>
                  <span style={{fontSize:28}}>{c.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:600,color:"#e0e2e8"}}>{c.title}</div>
                    <div style={{fontSize:11,color:S.dm}}>Score: {progress[c.id].quizScore}% · Worden University Certified</div>
                  </div>
                  <span style={{fontSize:20,color:S.gn}}>✓</span>
                </div>
              ))}
            </div>}
          </div>
        )}
      </div>

      <footer style={{borderTop:`1px solid ${S.bd}`,padding:"20px",textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.08)"}}>
        © 2026 Worden University · <a href="https://thewordenstandard.com" style={{color:S.am,textDecoration:"none"}}>The Worden Standard</a> · Built by a contractor, for contractors
      </footer>
    </div>
  );
}
