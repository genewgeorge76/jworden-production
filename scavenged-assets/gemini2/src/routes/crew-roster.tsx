import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/crew-roster')({
  component: CrewRoster,
});

const ASTRONAUTS = [
  {
    id: 'worden',
    name: 'Alfred Worden',
    role: 'Command Module Pilot',
    missions: ['Apollo 15'],
    bio: 'Alfred Merrill Worden was an American astronaut and engineer who was the Command Module Pilot for the Apollo 15 lunar mission in 1971. One of only 24 people to have flown to the Moon.',
    image: 'https://images.unsplash.com/photo-1614729939124-032f0b5609ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'grissom',
    name: 'Gus Grissom',
    role: 'Command Pilot',
    missions: ['Gemini 3'],
    bio: 'Virgil Ivan "Gus" Grissom was one of the original NASA Project Mercury astronauts, a United States Air Force pilot, and the commander of Gemini 3.',
    image: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'young',
    name: 'John Young',
    role: 'Command Pilot',
    missions: ['Gemini 3', 'Gemini 10'],
    bio: 'John Watts Young was an American astronaut, naval officer and aviator, test pilot, and aeronautical engineer. He became the ninth person to walk on the Moon.',
    image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mcdivitt',
    name: 'James McDivitt',
    role: 'Command Pilot',
    missions: ['Gemini 4'],
    bio: 'James Alton McDivitt was an American test pilot, United States Air Force pilot, aeronautical engineer, and NASA astronaut who flew in the Gemini and Apollo programs.',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d5734c106?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'white',
    name: 'Ed White',
    role: 'Pilot',
    missions: ['Gemini 4'],
    bio: 'Edward Higgins White II was an American aeronautical engineer, United States Air Force officer, test pilot, and NASA astronaut. He was the first American to walk in space.',
    image: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  }
];

function CrewRoster() {
  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
      <div className="mb-12 border-b border-slate-800/50 pb-6">
        <h1 className="text-3xl md:text-4xl font-light text-white tracking-tight mb-2">Crew Roster</h1>
        <p className="text-sm font-mono text-cyan-500 uppercase tracking-widest">Gemini & Apollo Archive</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ASTRONAUTS.map((astronaut) => (
          <div key={astronaut.id} className="border border-slate-800/50 bg-slate-900/20 hover:bg-slate-900/40 transition-colors group flex flex-col h-full rounded-sm overflow-hidden">
            <div className="h-48 w-full overflow-hidden relative border-b border-slate-800/50">
               <div className="absolute inset-0 bg-cyan-900/20 mix-blend-overlay z-10"></div>
               <img src={astronaut.image} alt={astronaut.name} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white tracking-tight">{astronaut.name}</h2>
                <span className="text-[9px] px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-sm font-mono uppercase tracking-wider">{astronaut.role}</span>
              </div>
              
              <div className="mb-4">
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">Missions</p>
                <div className="flex flex-wrap gap-2">
                  {astronaut.missions.map(mission => (
                    <span key={mission} className="text-[10px] text-slate-300 font-mono tracking-wider">{mission}</span>
                  ))}
                </div>
              </div>
              
              <p className="text-sm text-slate-400 leading-relaxed pt-4 border-t border-slate-800/30 flex-1">
                {astronaut.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
