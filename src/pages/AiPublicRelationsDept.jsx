import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function AiPublicRelationsDept() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [format, setFormat] = useState('Press Release');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation for now
    setTimeout(() => {
      let content = '';
      if (format === 'Social Media') {
        content = `[AUTO-GENERATED SOCIAL MEDIA POST]\n\n🚧 ${topic} 🚧\n\nWe're committed to the Worden Standard. Expect top-quality results and minimal disruption!\n\n#WordenStandard #AsphaltPaving #CommunityFirst #RichmondVA`;
      } else if (format === 'Print-Ready Mailer') {
        content = `[AUTO-GENERATED PRINT-READY MAILER]\n\nDear Resident / Business Owner,\n\nThis notice is to inform you regarding our upcoming activities concerning: ${topic}.\n\nAs a dedicated local partner, J. Worden Asphalt Paving operates under the "Worden Standard"—meaning we prioritize respect for your property, safety, and clear communication. Please contact our main office if you have any questions.\n\nSincerely,\nThe Worden Team`;
      } else {
        content = `[AUTO-GENERATED PRESS RELEASE]\n\nFOR IMMEDIATE RELEASE\n\nJ. Worden Asphalt Paving Announces Updates Regarding: "${topic}".\n\nRICHMOND, VA — Demonstrating a continued commitment to quality and community integration, J. Worden Asphalt Paving today detailed new initiatives. Speaking on the new development, a company representative emphasized a strict adherence to the Worden Standard. "We believe in paving the way for future generations safely and efficiently," the statement read.\n\n###`;
      }
      setGeneratedContent(content);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-900 border-b border-blue-950 px-6 py-6">
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <span>🎙️</span> AI Public Relations Dept
          </h1>
          <p className="text-blue-200 text-sm mt-2">
            Generate compliant press releases, community notices (Pardon Our Dust), and reputation management responses.
          </p>
        </div>

        {/* Control Panel */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Topic / Incident / Announcement Subject
              </label>
              <Textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Warning the neighborhood of heavy machinery traffic next week, or announcing a new municipal contract win."
                className="w-full"
                rows={3}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-wide">
                Desired Tone
              </label>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm h-10 px-3"
              >
                <option>Professional / Authoritative</option>
                <option>Community Friendly / Apologetic</option>
                <option>Crisis Management / Legal Neutral</option>
                <option>Aggressive / Firm Defense</option>
              </select>
            </div>
            
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !topic.trim()}
              className="w-full bg-blue-700 hover:bg-blue-800 h-10"
            >
              {isGenerating ? 'Generating Statement...' : 'Generate PR Statement'}
            </Button>
          </div>
        </div>

        {/* Output Console */}
        <div className="p-6 bg-slate-900 border-t border-slate-700 rounded-b-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-blue-400 font-mono text-sm tracking-widest uppercase">Output Console</h3>
            <Button variant="outline" size="sm" className="text-xs h-8 bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700" onClick={() => {navigator.clipboard.writeText(generatedContent)}}>
              Copy to Clipboard
            </Button>
          </div>
          <div className="w-full h-80 bg-black border border-slate-700 p-4 font-mono text-emerald-400 text-sm overflow-y-auto whitespace-pre-wrap rounded">
            {generatedContent || 'Awaiting PR directives...'}
          </div>
        </div>

      </div>
    </div>
  );
}
