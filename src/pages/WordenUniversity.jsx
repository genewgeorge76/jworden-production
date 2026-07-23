import { useState, useEffect } from "react";

// ─── STYLES ───
// SpaceX Theme: Deep Space Black (#000000), Slate Dark (#111111), and Titanium accents
const S = {
  bg: "#000000",
  sf: "#111111",
  bd: "rgba(255,255,255,0.08)",
  am: "#f5a623", 
  amD: "rgba(245,166,35,0.06)",
  tx: "#c9cdd8",
  dm: "rgba(255,255,255,0.4)",
  gn: "#22c55e",
  rd: "#ef4444",
  mn: "'IBM Plex Mono', monospace",
  sr: "'Instrument Serif', Georgia, serif"
};

export default function WordenUniversity() {
  const [view, setView] = useState("catalog"); // catalog | course | module
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modIdx, setModIdx] = useState(0);
  const [lessonIdx, setLessonIdx] = useState(0);
  
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  useEffect(() => {
    fetchCourses();
    
    // Auto-refresh periodically to pick up background-generated AI courses
    const interval = setInterval(fetchCourses, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${apiBase}/api/v1/lms/courses?tenant_id=default`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      } else {
        console.error("Failed to fetch courses, status:", res.status);
      }
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCourse = (c) => {
    setCourse(c);
    setModIdx(0);
    setLessonIdx(0);
    setView("course");
  };

  const renderMarkdown = (markdown) => {
    if (!markdown) return null;
    // Simple naive markdown parsing for the AI bodies
    const html = markdown
      .replace(/^### (.*$)/gim, '<h3 style="color:#fff;margin: 24px 0 12px;font-size:18px">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="color:#fff;margin: 32px 0 16px;font-size:22px">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color:#fff;margin: 40px 0 20px;font-size:28px">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="color:#fff">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '<br/><br/>')
      .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 8px;">$1</li>');
    
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  if (loading) {
    return (
      <div style={{minHeight:"100vh",background:S.bg,color:S.tx,fontFamily:S.mn, display:"flex", alignItems:"center", justifyContent:"center"}}>
        <div style={{textAlign:"center", color: S.am, letterSpacing: "0.2em", fontSize: 12}} className="animate-pulse">
          INITIALIZING STARBASE LMS...
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:S.bg,color:S.tx,fontFamily:S.mn}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700;800&family=Instrument+Serif&display=swap');*{margin:0;padding:0;box-sizing:border-box}::selection{background:rgba(245,166,35,0.15);color:#f5a623}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.05);border-radius:2px}.wh:hover{background:#1a1a1a!important}`}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:S.bg+"e8",backdropFilter:"blur(16px)",borderBottom:`1px solid ${S.bd}`,padding:"0 20px",height:48,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span onClick={()=>{setView("catalog");setCourse(null)}} style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",color:S.am,cursor:"pointer"}}>STARBASE CAMPUS</span>
          <span style={{fontSize:10,color:S.gn,background:`${S.gn}12`,padding:"2px 8px",borderRadius:10}}>LIVE</span>
        </div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <a href="https://thewordenstandard.com" style={{fontSize:11,color:S.dm,textDecoration:"none"}}>Worden Standard →</a>
        </div>
      </nav>

      <div style={{maxWidth:780,margin:"0 auto",padding:"0 20px"}}>

        {/* CATALOG */}
        {view==="catalog"&&(
          <div>
            <div style={{padding:"48px 0 36px"}}>
              <div style={{fontFamily:S.sr,fontSize:"clamp(2rem,5vw,3rem)",color:"#fff",fontWeight:400,lineHeight:1.1,marginBottom:10}}>J. Worden <span style={{color:S.am}}>University</span></div>
              <div style={{fontSize:13,color:S.dm,lineHeight:1.8,maxWidth:520,marginBottom:24}}>
                The Launchpad For Asphalt Engineering Excellence. Complete your training tracks below to earn your certifications. 
                Courses are dynamically generated and updated by our AI Instructional Engine.
              </div>
              <div style={{display:"flex",gap:20,marginBottom:28}}>
                {[{v:courses.length,l:"Available Courses"},{v:courses.reduce((s,c)=>s+(c.modules?.length||0),0),l:"Total Modules"},{v:"SpaceX",l:"Engine"}].map((m,i)=>(
                  <div key={i}><div style={{fontSize:18,fontWeight:700,color:S.am}}>{m.v}</div><div style={{fontSize:10,color:S.dm}}>{m.l}</div></div>
                ))}
              </div>
            </div>

            <div style={{display:"flex",flexDirection:"column",gap:6,paddingBottom:48}}>
              {courses.length === 0 && (
                <div style={{padding: 40, textAlign: 'center', border: `1px solid ${S.bd}`, borderRadius: 8, color: S.dm}}>
                  No courses available yet. The AI is generating the curriculum. Check back in a moment...
                </div>
              )}
              {courses.map(c=>{
                return(
                  <div key={c.id} onClick={()=>loadCourse(c)} className="wh"
                    style={{background:S.sf,border:`1px solid ${S.bd}`,borderRadius:8,padding:"18px 16px",cursor:"pointer",transition:"all 0.15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,color:S.am,letterSpacing:"0.08em",marginBottom:4,textTransform:"uppercase"}}>{c.category} • {c.difficulty}</div>
                        <div style={{fontSize:15,fontWeight:600,color:"#e0e2e8"}}>{c.title}</div>
                        <div style={{fontSize:12,color:S.dm,marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.description}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                         <span style={{fontSize:11,color:S.dm}}>{c.modules.length} modules</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* COURSE OVERVIEW */}
        {view==="course"&&course&&(
          <div style={{padding:"28px 0 48px"}}>
            <button onClick={()=>{setView("catalog");setCourse(null)}} style={{fontFamily:S.mn,fontSize:11,color:S.dm,background:"none",border:"none",cursor:"pointer",marginBottom:20}}>← All Courses</button>
            <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:20}}>
              <div>
                <div style={{fontSize:11,color:S.am,letterSpacing:"0.08em",marginBottom:4,textTransform:"uppercase"}}>{course.category} • {course.difficulty}</div>
                <div style={{fontFamily:S.sr,fontSize:26,color:"#fff"}}>{course.title}</div>
              </div>
            </div>
            <div style={{fontSize:13,color:S.dm,lineHeight:1.8,marginBottom:24}}>{course.description}</div>

            {/* Module List */}
            <div style={{fontSize:11,fontWeight:600,color:S.dm,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Syllabus</div>
            <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:24}}>
              {course.modules.length === 0 && <div style={{fontSize: 12, color: S.dm}}>No modules generated yet.</div>}
              {course.modules.map((m,i)=>{
                return(
                  <div key={m.id} onClick={()=>{setModIdx(i);setLessonIdx(0);setView("module")}} className="wh"
                    style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:6,cursor:"pointer",background:S.sf,border:`1px solid ${S.bd}`}}>
                    <span style={{width:24,height:24,borderRadius:4,background:"rgba(255,255,255,0.02)",border:`1px solid rgba(255,255,255,0.1)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:S.am,flexShrink:0}}>{String(i+1).padStart(2,"0")}</span>
                    <div style={{flex:1}}>
                        <div style={{fontSize:14,color:"#e0e2e8"}}>{m.title}</div>
                        <div style={{fontSize:11,color:S.dm,marginTop:2}}>{m.lessons.length} lessons</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODULE / LESSON VIEWER */}
        {view==="module"&&course&&(
          <div style={{padding:"28px 0 48px",maxWidth:680}}>
            <button onClick={()=>setView("course")} style={{fontFamily:S.mn,fontSize:11,color:S.dm,background:"none",border:"none",cursor:"pointer",marginBottom:16}}>← Back to {course.title}</button>
            
            {/* Context Header */}
            <div style={{background:S.sf, borderBottom: `1px solid ${S.bd}`, margin: "0 -20px 24px", padding: "0 20px 20px"}}>
                <div style={{fontSize:10,color:S.am,fontWeight:600,letterSpacing:"0.08em",marginBottom:6}}>MODULE {String(modIdx+1).padStart(2,"0")} OF {String(course.modules.length).padStart(2,"0")}</div>
                <div style={{fontFamily:S.sr,fontSize:22,color:"#fff",marginBottom:6}}>{course.modules[modIdx].title}</div>
            </div>

            {/* Lesson Content */}
            {course.modules[modIdx].lessons.length > 0 ? (
                <div>
                    <div style={{fontSize:10,color:S.dm,fontWeight:600,letterSpacing:"0.08em",marginBottom:12}}>LESSON {lessonIdx+1} OF {course.modules[modIdx].lessons.length}</div>
                    <div style={{fontFamily:S.sr,fontSize:28,color:"#fff",marginBottom:24}}>{course.modules[modIdx].lessons[lessonIdx].title}</div>

                    <div style={{fontSize:15,color:"rgba(255,255,255,0.7)",lineHeight:1.8,marginBottom:40, fontFamily: "sans-serif"}}>
                        {renderMarkdown(course.modules[modIdx].lessons[lessonIdx].body_markdown)}
                    </div>
                    
                    <div style={{display:"flex",gap:8}}>
                        {lessonIdx > 0 && <button onClick={()=>setLessonIdx(lessonIdx-1)} style={{flex:1,padding:14,borderRadius:6,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontFamily:S.mn,fontSize:13,cursor:"pointer"}}>← Previous Lesson</button>}
                        <button onClick={()=>{
                            if(lessonIdx < course.modules[modIdx].lessons.length-1){
                                setLessonIdx(lessonIdx+1)
                            } else {
                                setView("course")
                            }
                        }}
                        style={{flex:1,padding:14,borderRadius:6,background:S.am,color:S.bg,fontFamily:S.mn,fontSize:13,fontWeight:700,border:"none",cursor:"pointer"}}>
                            {lessonIdx < course.modules[modIdx].lessons.length-1 ? "Complete & Next Lesson →" : "Finish Module ✓"}
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{color: S.dm, fontSize: 13}}>No lessons in this module.</div>
            )}
          </div>
        )}

      </div>

      <footer style={{borderTop:`1px solid ${S.bd}`,padding:"20px",textAlign:"center",fontSize:10,color:"rgba(255,255,255,0.2)", letterSpacing:"0.05em", marginTop:40}}>
        © 2026 STARBASE LMS · <a href="https://thewordenstandard.com" style={{color:S.dm,textDecoration:"none"}}>POWERED BY J. WORDEN & SONS</a>
      </footer>
    </div>
  );
}
