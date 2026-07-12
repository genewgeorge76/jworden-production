import React, { useState } from 'react';
import { BookOpen, ArrowLeft, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { COURSES } from '../data/wordenStandardData';
import { PRIMARY_DOMAIN } from '@/lib/locations';

export default function WordenStandardHub() {
  const [selectedCourse, setSelectedCourse] = useState(null);

  const renderCatalog = () => (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <div className="mb-16">
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase text-foreground mb-4">
          The Worden Standard <span className="text-primary">Library</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
          We believe in raising the bar for the entire paving industry. That's why we're open-sourcing our internal training manuals, safety protocols, and operational standards.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {COURSES.map((course) => (
          <div 
            key={course.id}
            onClick={() => setSelectedCourse(course)}
            className="group relative bg-card border border-border p-8 cursor-pointer hover:border-primary/50 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-6 text-4xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
              {course.icon}
            </div>
            
            <div className="relative z-10">
              <h2 className="font-display text-xl font-bold text-foreground mb-2">{course.title}</h2>
              <p className="text-sm text-primary font-bold uppercase tracking-wider mb-4">{course.sub}</p>
              
              <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                {course.desc}
              </p>
              
              <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase text-muted-foreground">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary" /> {course.modules.length} Chapters</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> {course.hours} Hours</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCourseDetail = () => (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <button 
        onClick={() => setSelectedCourse(null)}
        className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-12"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Library
      </button>

      <div className="mb-16">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{selectedCourse.icon}</span>
          <h1 className="font-display text-3xl md:text-4xl font-black uppercase text-foreground">
            {selectedCourse.title}
          </h1>
        </div>
        <p className="text-xl text-primary font-display font-bold uppercase tracking-wider mb-6">
          {selectedCourse.sub}
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {selectedCourse.desc}
        </p>
      </div>

      <div className="space-y-12">
        {selectedCourse.modules.map((module, idx) => (
          <div key={module.id} className="relative pl-8 md:pl-12 border-l-2 border-primary/20 pb-12 last:pb-0">
            <div className="absolute top-0 left-[-9px] w-4 h-4 rounded-full bg-primary" />
            
            <h3 className="font-display text-xl font-bold text-foreground mb-2 mt-[-6px]">
              Chapter {idx + 1}: {module.title}
            </h3>
            
            <div className="prose prose-invert max-w-none mt-6">
              {module.content.split('\n\n').map((paragraph, pIdx) => (
                <p key={pIdx} className="text-muted-foreground leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "The Worden Standard Library",
    "description": "Open-source paving industry standards, safety protocols, and operational excellence guides.",
    "url": `${PRIMARY_DOMAIN}/worden-standard`,
    "publisher": {
      "@type": "Organization",
      "name": "J. Worden & Sons Paving LLC"
    }
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <SEO
        title={selectedCourse ? `${selectedCourse.title} | The Worden Standard` : 'The Worden Standard Library | Industry Paving Authority'}
        description={selectedCourse ? selectedCourse.desc : "We're open-sourcing our internal training manuals, safety protocols, and operational standards to raise the bar for the entire paving industry."}
        canonicalPath="/worden-standard"
        jsonLd={schema}
      />
      
      <Navbar />
      
      <div className="pt-24 md:pt-32 pb-20">
        {selectedCourse ? renderCourseDetail() : renderCatalog()}
      </div>
      
      <Footer />
    </div>
  );
}
