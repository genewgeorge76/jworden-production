import React, { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

interface QuizQuestion {
  question: string
  options: string[]
  correct: number  // index into options
}

interface Module {
  title: string
  content: string  // markdown-style text, rendered as paragraphs
  keyPoints: string[]
}

interface CourseData {
  id: string
  title: string
  icon: string
  modules: Module[]
  quiz: QuizQuestion[]
}

const COURSES: Record<string, CourseData> = {
  'asphalt-fundamentals': {
    id: 'asphalt-fundamentals',
    title: 'Asphalt Fundamentals',
    icon: '🛣️',
    modules: [
      {
        title: 'What Is Asphalt?',
        content: 'Asphalt is a mixture of aggregate (stone, sand, gravel) and bitumen binder — a byproduct of crude oil refining. The binder holds aggregate particles together and waterproofs the surface. Mix design determines what percentage of binder vs. aggregate creates the optimal performance characteristics for traffic load, climate, and service life.',
        keyPoints: [
          'Bitumen binder typically 4–7% of total mix weight',
          'Aggregate gradation controls strength, texture, and drainage',
          'Dense-graded mix (most common) vs. open-graded (permeable)',
        ],
      },
      {
        title: 'The Tonnage Formula',
        content: 'Every paving estimate starts with tonnage. The Worden Standard formula: tons = (sqft / 9 × depth_in × density_pcf) / 24000. Depth in inches. Density: 145 pcf residential, 148 pcf commercial. Dividing by 24000 converts cubic feet to tons (2000 lb/ton × 12 inches/foot).',
        keyPoints: [
          'Residential: 145 pcf × 2 inch typical residential overlay',
          'Commercial: 148 pcf × 3–4 inches for driveways and parking lots',
          'Never round down — always round up to nearest half-ton',
        ],
      },
      {
        title: 'Marshall Compaction Standard',
        content: 'Compaction is the most critical quality variable in asphalt work. The Worden Standard requires 96% Marshall compaction (AASHTO T99/T180). Under-compacted asphalt oxidizes faster, ruts under traffic, and voids allow water infiltration leading to freeze-thaw failure. Check compaction with a nuclear density gauge or by core sample.',
        keyPoints: [
          '96% Marshall compaction is the Worden non-negotiable floor',
          'Under-compaction leads to rutting, cracking, and shortened lifespan',
          'Rollers: breakdown (steel drum), intermediate (rubber tire), finish passes',
        ],
      },
      {
        title: 'VDOT Section 315 Base',
        content: 'The structural stone base is the foundation of any quality paving job. VDOT Section 315 specifies 21-A aggregate (crushed stone) compacted to proper density. Skipping or skimping the base is the #1 cause of premature pavement failure. Minimum 6-inch base for residential, deeper for commercial or weak subgrade.',
        keyPoints: [
          'VDOT 21-A: angular, well-graded crushed stone',
          'Minimum 6-inch compacted base depth for residential',
          'Proof-roll the subgrade before base installation',
        ],
      },
      {
        title: 'Material Pricing & Binder Index',
        content: 'Asphalt pricing follows the oil market. The PG binder index fluctuates with crude prices. The Worden Standard uses a binder index of $627.50 per ton with an oil shield buffer of ±$9/ton. Always get fresh plant quotes within 5 days of bidding. The binder content of the mix (typically 5–6%) drives cost more than aggregate.',
        keyPoints: [
          'Binder index baseline: $627.50/ton',
          'Oil shield buffer: ±$9/ton price volatility protection',
          'Request current plant ticket before finalizing any bid over $25K',
        ],
      },
      {
        title: 'Seasonal Timing',
        content: 'Asphalt cures poorly in cold weather. Minimum ambient temperature: 50°F rising. Minimum surface temperature: 45°F. Never pave on frozen subgrade or when rain is forecast within 4 hours of finishing. The Worden production season runs approximately mid-March through mid-November in Virginia, with shoulder-month risk assessment required.',
        keyPoints: [
          'Minimum air temp 50°F and rising at time of paving',
          'Do not pave on frozen or saturated subgrade',
          'November–February: high risk, price accordingly or decline',
        ],
      },
    ],
    quiz: [
      {
        question: 'What is the Worden Standard Marshall compaction floor?',
        options: ['90%', '93%', '96%', '99%'],
        correct: 2,
      },
      {
        question: 'Using the tonnage formula, what density do you use for a commercial parking lot?',
        options: ['135 pcf', '140 pcf', '145 pcf', '148 pcf'],
        correct: 3,
      },
      {
        question: 'What is the minimum base depth for a standard residential driveway?',
        options: ['2 inches', '4 inches', '6 inches', '8 inches'],
        correct: 2,
      },
      {
        question: 'The Worden binder index baseline is:',
        options: ['$425.00', '$525.50', '$627.50', '$750.00'],
        correct: 2,
      },
      {
        question: 'What aggregate specification does VDOT Section 315 require for base?',
        options: ['VDOT 21-A crushed stone', 'VDOT 57 stone', 'Crusher run', 'Sand'],
        correct: 0,
      },
    ],
  },

  'bidding-business': {
    id: 'bidding-business',
    title: 'Bidding & Business',
    icon: '📊',
    modules: [
      {
        title: 'The 35% Margin Floor',
        content: 'J. Worden & Sons does not accept jobs below a 35% gross margin. Period. Gross margin = (price − direct cost) / price. Direct cost includes material, labor, equipment, and subcontractors. Overhead and profit come from that 35%. If a job cannot hit 35%, either reprice or walk away — unprofitable volume destroys a business faster than no volume.',
        keyPoints: [
          'Gross margin = (revenue − direct cost) / revenue',
          'Never compromise the 35% floor — not for relationships, volume, or competition',
          "If market won't accept your price, fix your cost structure not your margin",
        ],
      },
      {
        title: 'Tier Pricing: Whale, Shark, Fish',
        content: 'Different job sizes require different pricing strategies. Fish (residential <$50K) are high-touch, high-margin, won on reputation and speed. Sharks ($50K–$500K) are commercial jobs won on relationships and technical credibility. Whales ($500K+) are VDOT, federal, or airport jobs requiring bonding, union labor, and full RFP processes. Each tier has different margin expectations and sales cycles.',
        keyPoints: [
          'Fish: <$50K — residential, high margin (40%+), won on referrals',
          'Shark: $50K–$500K — commercial, 35–40%, won on relationships',
          'Whale: $500K+ — federal/VDOT, 35–38%, needs bid bond + certified payroll',
        ],
      },
      {
        title: 'Estimating a Residential Driveway',
        content: 'Step 1: Measure the sqft. Step 2: Calculate tonnage (sqft/9 × 2in × 145pcf / 24000). Step 3: Get current plant price per ton. Step 4: Add labor ($0.08/ton machine health + crew rate). Step 5: Add mobilization ($300 minimum for residential). Step 6: Apply 35% margin markup on cost. Step 7: Round to nearest $50.',
        keyPoints: [
          'Always measure twice — sqft errors kill profitability',
          '$300 minimum mobilization fee for any residential job',
          'Round final price to nearest $50 for clean presentation',
        ],
      },
      {
        title: 'The VDOT Bid Process',
        content: 'VDOT publishes letting schedules 6–8 weeks in advance. The Worden Standard monitors VDOT bid results weekly to track competitor pricing and identify where we can win. Prequalification is required for most VDOT work — maintain current certification. Performance and payment bonds (typically 100% of contract) are required. VDOT pays on completion of work items, not monthly draws.',
        keyPoints: [
          'VDOT prequalification renewed annually — never let it lapse',
          'Bond capacity determines your maximum VDOT contract size',
          'Study previous letting results to calibrate competitive pricing',
        ],
      },
      {
        title: 'Writing a Winning Proposal',
        content: 'A great proposal answers three questions: Why us? What exactly will we do? What will it cost and when? Lead with the company\'s 40-year track record and specific local references. Be explicit about scope — what\'s included and what\'s not. Use line-item pricing to show value, not just a total number. Include timeline, warranty terms, and payment schedule.',
        keyPoints: [
          'Lead with credibility: 4th-generation, est. 1984, local references',
          'Scope explicitly includes base, asphalt layer depths, compaction standard',
          '5-year workmanship warranty differentiates from lower-quality competition',
        ],
      },
      {
        title: 'Collections & Cash Flow',
        content: 'Residential: 50% deposit at contract signing, 50% on completion. Commercial: net-30 with 1.5%/month late fee. VDOT: progress billing per VDOT pay estimate cycle. Never start a residential job without the deposit in hand. Invoice the day work is completed. Follow up unpaid invoices at 15, 30, and 45 days.',
        keyPoints: [
          '50% deposit before any residential job starts — no exceptions',
          'Commercial net-30, 1.5%/month late fee in contract',
          'Lien rights: preliminary notice within first 30 days protects your position',
        ],
      },
      {
        title: 'Market Intelligence',
        content: 'Know your competition. Track who won recent jobs and at what price. VDOT publishes all bid results publicly. For commercial work, GBP reviews and referrals signal market share. Seasonal demand peaks in spring (Mar–May) and fall (Sep–Oct). Price up in peak season — customers are buying, not shopping. In off-season, selectively discount to keep crews busy.',
        keyPoints: [
          'VDOT bid results: public data, analyze monthly',
          'Spring and fall are peak demand — hold pricing firm',
          'Winter volume strategy: selective discounting to maintain crew continuity',
        ],
      },
      {
        title: 'Growing the Business',
        content: 'The Worden growth formula: referrals + reputation + recurring customers. Every satisfied residential customer is a walking billboard for the next 5 years. Ask for a Google review within 48 hours of job completion. Build a commercial roster of 20+ accounts that re-pave on 3–5 year cycles. Each franchise/licensee territory should target 300+ residential jobs and 40+ commercial accounts in year 3.',
        keyPoints: [
          'Request Google review within 48h of every residential completion',
          'Commercial maintenance agreements: seal, crack-fill, restripe annually',
          'Target: 300 residential + 40 commercial per territory in year 3',
        ],
      },
    ],
    quiz: [
      {
        question: 'The Worden Standard gross margin floor is:',
        options: ['25%', '30%', '35%', '40%'],
        correct: 2,
      },
      {
        question: 'Which tier describes a $250,000 commercial parking lot resurfacing?',
        options: ['Fish', 'Shark', 'Whale', 'Depends on the client'],
        correct: 1,
      },
      {
        question: 'What is the minimum mobilization fee for a residential driveway?',
        options: ['$100', '$200', '$300', '$500'],
        correct: 2,
      },
      {
        question: 'Residential payment terms should be:',
        options: ['100% on completion', '50% deposit, 50% on completion', 'Net-30', 'COD only'],
        correct: 1,
      },
      {
        question: 'When should you request a Google review from a residential customer?',
        options: ['Never — let them do it organically', 'Within 48 hours of completion', 'After 1 week', 'Only if they mention it first'],
        correct: 1,
      },
      {
        question: 'VDOT bid results are:',
        options: ['Confidential', 'Only available to prequalified contractors', 'Publicly available', 'Released only to the low bidder'],
        correct: 2,
      },
      {
        question: 'During peak spring season you should:',
        options: ['Discount to win more volume', 'Hold pricing firm — demand supports it', 'Reduce your crew size', 'Pause residential work'],
        correct: 1,
      },
      {
        question: 'What is required before starting any residential job?',
        options: ['A signed contract only', '50% deposit in hand', 'Full payment upfront', 'Written approval from VDOT'],
        correct: 1,
      },
    ],
  },
}

const PASS_THRESHOLD = 0.80

export function LMSCoursePage() {
  const { courseId } = useParams({ strict: false }) as { courseId: string }
  const course = COURSES[courseId]

  const [moduleIndex, setModuleIndex] = useState(() =>
    Number(localStorage.getItem(`lms:${courseId}:module`) ?? 0)
  )
  const [phase, setPhase] = useState<'learn' | 'quiz' | 'result'>(() => {
    if (localStorage.getItem(`lms:${courseId}:certificate`) === 'true') return 'result'
    return 'learn'
  })
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Course not found.</p>
          <Link to="/lms" className="text-yellow-500 underline">Back to Worden University</Link>
        </div>
      </div>
    )
  }

  const alreadyCertified = localStorage.getItem(`lms:${courseId}:certificate`) === 'true'
  const totalModules = course.modules.length
  const currentModule = course.modules[moduleIndex]

  function advanceModule() {
    const next = moduleIndex + 1
    if (next < totalModules) {
      setModuleIndex(next)
      localStorage.setItem(`lms:${courseId}:module`, String(next))
      localStorage.setItem(`lms:${courseId}:progress`, String(next / totalModules))
    } else {
      setPhase('quiz')
      setAnswers(Array(course.quiz.length).fill(null))
      setSubmitted(false)
    }
  }

  function selectAnswer(qIdx: number, aIdx: number) {
    if (submitted) return
    setAnswers(prev => {
      const next = [...prev]
      next[qIdx] = aIdx
      return next
    })
  }

  function submitQuiz() {
    const correct = course.quiz.filter((q, i) => answers[i] === q.correct).length
    const pct = correct / course.quiz.length
    setScore(pct)
    setSubmitted(true)
    if (pct >= PASS_THRESHOLD) {
      localStorage.setItem(`lms:${courseId}:certificate`, 'true')
      localStorage.setItem(`lms:${courseId}:progress`, '1')
    }
  }

  function retakeQuiz() {
    setAnswers(Array(course.quiz.length).fill(null))
    setSubmitted(false)
    setModuleIndex(0)
    localStorage.setItem(`lms:${courseId}:module`, '0')
    setPhase('learn')
  }

  const passed = submitted && score >= PASS_THRESHOLD

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{course.icon}</span>
          <div>
            <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">Worden University</p>
            <h1 className="font-bold text-lg leading-tight">{course.title}</h1>
          </div>
        </div>
        <Link to="/lms" className="text-xs text-gray-500 hover:text-white transition-colors">
          ← Back to Courses
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">

        {/* LEARN PHASE */}
        {phase === 'learn' && (
          <div>
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Module {moduleIndex + 1} of {totalModules}</span>
                <span>{Math.round(((moduleIndex) / totalModules) * 100)}% complete</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all"
                  style={{ width: `${(moduleIndex / totalModules) * 100}%` }}
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">{currentModule.title}</h2>
            <p className="text-gray-300 leading-relaxed mb-6">{currentModule.content}</p>

            <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-8">
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-3">Key Points</h3>
              <ul className="space-y-2">
                {currentModule.keyPoints.map(kp => (
                  <li key={kp} className="flex gap-3 text-sm text-gray-300">
                    <span className="text-yellow-500 mt-0.5 shrink-0">▸</span>
                    {kp}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={advanceModule}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors"
            >
              {moduleIndex + 1 < totalModules ? `Next: ${course.modules[moduleIndex + 1].title} →` : 'Take the Quiz →'}
            </button>
          </div>
        )}

        {/* QUIZ PHASE */}
        {phase === 'quiz' && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Course Quiz</h2>
            <p className="text-gray-400 text-sm mb-8">
              Answer all questions. You need {Math.round(PASS_THRESHOLD * 100)}% to earn your certificate.
            </p>

            <div className="space-y-8">
              {course.quiz.map((q, qi) => (
                <div key={qi} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                  <p className="font-semibold mb-4 text-sm">
                    <span className="text-yellow-500 mr-2">{qi + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      let cls = 'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm '
                      if (!submitted) {
                        cls += answers[qi] === oi
                          ? 'border-yellow-500 bg-yellow-500/10 text-white'
                          : 'border-gray-700 hover:border-gray-500 text-gray-300'
                      } else {
                        if (oi === q.correct) {
                          cls += 'border-green-500 bg-green-500/10 text-green-300'
                        } else if (answers[qi] === oi) {
                          cls += 'border-red-500 bg-red-500/10 text-red-300'
                        } else {
                          cls += 'border-gray-800 text-gray-600'
                        }
                      }
                      return (
                        <div key={oi} className={cls} onClick={() => selectAnswer(qi, oi)}>
                          <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs shrink-0">
                            {submitted
                              ? oi === q.correct ? '✓' : answers[qi] === oi ? '✗' : ''
                              : answers[qi] === oi ? '●' : ''}
                          </span>
                          {opt}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!submitted ? (
              <button
                onClick={submitQuiz}
                disabled={answers.some(a => a === null)}
                className="mt-8 w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-colors"
              >
                Submit Quiz
              </button>
            ) : (
              <div className={`mt-8 rounded-xl p-6 text-center border ${passed ? 'bg-green-900/20 border-green-600' : 'bg-red-900/20 border-red-600'}`}>
                <p className="text-3xl font-extrabold mb-2">{Math.round(score * 100)}%</p>
                <p className="font-bold text-lg mb-3">
                  {passed ? '🎉 You passed!' : 'Not quite — review the material and try again'}
                </p>
                <p className="text-sm text-gray-400 mb-5">
                  {course.quiz.filter((q, i) => answers[i] === q.correct).length} / {course.quiz.length} correct
                </p>
                {passed ? (
                  <button
                    onClick={() => setPhase('result')}
                    className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-lg transition-colors"
                  >
                    View Certificate →
                  </button>
                ) : (
                  <button
                    onClick={retakeQuiz}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-8 py-3 rounded-lg transition-colors"
                  >
                    Review &amp; Retake
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* RESULT/CERTIFICATE PHASE */}
        {phase === 'result' && (
          <div className="text-center">
            <div className="bg-gray-900 border-2 border-yellow-500 rounded-2xl p-10 mb-8">
              <p className="text-yellow-500 font-bold tracking-widest text-xs uppercase mb-4">
                Certificate of Completion
              </p>
              <span className="text-6xl block mb-4">{course.icon}</span>
              <h2 className="text-2xl font-extrabold mb-2">Worden University</h2>
              <p className="text-gray-400 text-sm mb-6">This certifies completion of</p>
              <p className="text-xl font-bold text-yellow-400 mb-6">{course.title}</p>
              <p className="text-xs text-gray-500">
                Completed {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/lms"
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition-colors block"
              >
                Back to Course Catalog
              </Link>
              <button
                onClick={() => window.print()}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Print Certificate
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
