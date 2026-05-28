import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'

const PAGE_SECTIONS = [
  {
    "heading": "OSHA 10 & 30 Compliance Overviews",
    "body": "Mandatory foundational safety videos covering trenching, excavation, fall protection, and site hazard recognition. Crews cannot step foot on a job site without passing the baseline OSHA awareness modules."
  },
  {
    "heading": "Hazardous Materials & Silica Dust",
    "body": "Specialized video modules detailing the legal requirements for handling hot asphalt emulsions, tack coat, and concrete silica dust. Includes proper usage of P100 respirators and immediate exposure reporting."
  },
  {
    "heading": "Heavy Equipment & Blind Spot Training",
    "body": "Required viewings for all CDL Class A/B drivers and equipment operators. Modules cover loader/paver blind spots, VDOT work-zone traffic control, and FMCSA commercial fleet pre-trip inspection standards."
  }
]

export default function TrainingVideosAIPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Mandatory Safety & Compliance Training Videos | The Worden Standard',
    description: 'Interactive training hub for OSHA compliance, equipment certification, and hazard recognition.',
    url: 'https://www.thewordenstandard.com/training-videos',
  }

  // Liquid Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  }

  return (
    <div className="min-h-screen bg-background font-body relative overflow-hidden">
      {/* High-end ambient background mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vw] h-[50vh] bg-primary/5 blur-[120px] pointer-events-none" />

      <SEO
        title={'Mandatory Safety & Compliance Training Videos | The Worden Standard'}
        description={'Interactive training hub for OSHA compliance, equipment certification, and hazard recognition.'}
        canonicalPath={'/training-videos'}
        jsonLd={jsonLd}
      />
      <Navbar />

      <motion.section 
        className="relative pt-40 pb-20 md:pb-32 overflow-hidden z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center md:text-left">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-display tracking-[0.2em] uppercase mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            AI SYNDICATE
          </motion.div>
          <h1 className="font-display font-black text-foreground text-5xl md:text-7xl lg:text-8xl uppercase tracking-tight leading-[0.9] flex flex-col gap-2">
            Worden Certified Training Engine
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mt-8 max-w-3xl leading-relaxed">
            All new hires and active crews must complete mandatory video modules and pass the associated certification quizzes to remain compliant with State, Federal, and Worden Standard regulations.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <Link
              to={'/certification-testing'}
              className="group relative inline-flex items-center justify-center px-8 py-5 font-display font-bold text-sm tracking-[0.2em] uppercase text-primary-foreground bg-primary overflow-hidden transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full -mt-1 opacity-20 bg-gradient-to-b from-transparent via-transparent to-black" />
              <span className="relative flex items-center gap-2">
                Begin Final Certification Quiz
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </span>
            </Link>
          </div>
        </div>
      </motion.section>

      <section className="py-20 md:py-32 relative z-10">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="max-w-5xl mx-auto px-6 lg:px-8 space-y-8"
        >
          {PAGE_SECTIONS.map((section, index) => (
            <motion.article 
              key={section.heading} 
              variants={itemVariants}
              className="group relative bg-card/60 backdrop-blur-xl border border-border/50 p-8 md:p-12 hover:bg-card hover:border-primary/30 transition-all overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-colors duration-500" />
              <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
                <span className="font-display text-5xl md:text-6xl text-primary/10 group-hover:text-primary/20 transition-colors font-black hidden md:block">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h2 className="font-display font-black text-foreground text-2xl md:text-4xl uppercase tracking-tight mb-4">
                    {section.heading}
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    {section.body}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
