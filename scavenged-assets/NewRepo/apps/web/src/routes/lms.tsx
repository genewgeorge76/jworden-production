import { Link } from '@tanstack/react-router'

const COURSES = [
  {
    id: 'asphalt-fundamentals',
    title: 'Asphalt Fundamentals',
    subtitle: 'Tonnage math, mix design, and compaction science',
    modules: 6,
    duration: '45 min',
    level: 'Beginner',
    icon: '🛣️',
    topics: ['Mix design basics', 'Tonnage formula', 'Marshall compaction', 'Seasonal timing'],
  },
  {
    id: 'bidding-business',
    title: 'Bidding &amp; Business',
    subtitle: 'Estimating, margin floors, and winning commercial work',
    modules: 8,
    duration: '60 min',
    level: 'Intermediate',
    icon: '📊',
    topics: ['35% margin floor', 'Tier pricing (Whale/Shark/Fish)', 'VDOT bid process', 'Proposal writing'],
  },
]

function LevelBadge({ level }: { level: string }) {
  const color =
    level === 'Beginner'
      ? 'bg-green-900 text-green-300'
      : level === 'Intermediate'
      ? 'bg-yellow-900 text-yellow-300'
      : 'bg-red-900 text-red-300'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>{level}</span>
}

export function LMSPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 border-b border-gray-800 px-6 py-14 text-center">
        <p className="text-yellow-500 font-bold tracking-widest text-xs mb-3 uppercase">
          Worden University
        </p>
        <h1 className="text-4xl font-extrabold mb-4">Learn the Worden Standard</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          Structured field training built on 40 years of asphalt science. Complete a course,
          pass the quiz at 80%, earn your certificate.
        </p>
      </div>

      {/* Course catalog */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-lg font-bold text-gray-300 mb-6">Course Catalog</h2>
        <div className="space-y-6">
          {COURSES.map(course => {
            const progress = Number(localStorage.getItem(`lms:${course.id}:progress`) ?? 0)
            const passed = localStorage.getItem(`lms:${course.id}:certificate`) === 'true'
            return (
              <div
                key={course.id}
                className="bg-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-yellow-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{course.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-bold text-lg">{course.title}</h3>
                      <LevelBadge level={course.level} />
                      {passed && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-yellow-500 text-black">
                          ✓ CERTIFIED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-3"
                       dangerouslySetInnerHTML={{ __html: course.subtitle }} />
                    <div className="flex gap-4 text-xs text-gray-500 mb-4">
                      <span>{course.modules} modules</span>
                      <span>·</span>
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.topics.map(t => (
                        <span key={t} className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                    {progress > 0 && !passed && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500 rounded-full"
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <Link
                      to="/lms/$courseId"
                      params={{ courseId: course.id }}
                      className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold px-5 py-2 rounded-lg transition-colors"
                    >
                      {passed ? 'Review Course' : progress > 0 ? 'Continue' : 'Start Course'}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
