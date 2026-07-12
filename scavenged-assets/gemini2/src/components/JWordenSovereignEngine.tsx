import { useState, useEffect, useRef, type CSSProperties } from 'react';

type View = 'MAIN' | 'SUCCESS' | 'EVIDENCE';
type Role = 'jarvis' | 'user';
interface Message {
  role: Role;
  content: string;
}
interface KbpRecord {
  state: string;
  units: number;
  year: string;
  files: string;
}

const LEGACY_YEARS: ReadonlyArray<string> = [
  '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026',
];

const KBP_DATA: ReadonlyArray<KbpRecord> = [
  { state: 'Michigan', units: 14, year: '2024', files: 'Dropbox Verified' },
  { state: 'Texas', units: 42, year: '2025', files: 'Dropbox Verified' },
  { state: 'Louisiana', units: 18, year: '2025', files: 'Dropbox Verified' },
];

const THEME = {
  bg: '#000',
  gold: '#D4AF37',
  glass: 'rgba(20, 20, 20, 0.95)',
  border: '1px solid #333',
  text: '#FFF',
  muted: '#888',
} as const;

const calculateSavings = (sq: number): number => {
  const annualStandard = (sq * 4.5) / 10;
  const annualWorden = (sq * 5.25) / 17;
  return Math.round(annualStandard - annualWorden);
};

const JWordenSovereignEngine = () => {
  const [view, setView] = useState<View>('MAIN');
  const [jarvisOpen, setJarvisOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sqFt, setSqFt] = useState(5000);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendJarvisMessage = (text: string) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'jarvis', content: text }]);
      setIsTyping(false);
    }, 1000);
  };

  useEffect(() => {
    const handshake = setTimeout(() => {
      setJarvisOpen(true);
      sendJarvisMessage(
        'Good day. I am Jarvis, the Worden Digital Foreman. Mr. George is overseeing the fleet at our Chester HQ, but I am authorized to walk you through our Gold Standard protocols. We are currently active in our April 2026 Richmond sprint. Are we discussing a national commercial asset or a private estate today?',
      );
    }, 1500);
    return () => clearTimeout(handshake);
  }, []);

  const processInput = (val: string) => {
    const userText = val.trim();
    if (!userText) return;
    const input = userText.toLowerCase();
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setInputValue('');

    if (input.includes('kbp') || input.includes('proof') || input.includes('files')) {
      sendJarvisMessage(
        'Our national operations for KBP Foods are a matter of record. Between 2024 and 2025, we modernized over 100 KFC assets across MI, TX, and LA. I have the Dropbox photocopies and field logs ready. Would you like to see the hand-tamped edge details from our Texas sprint?',
      );
      setView('EVIDENCE');
    } else if (input.includes('price') || input.includes('cost') || input.includes('roi')) {
      sendJarvisMessage(
        "Mr. George's grandfather taught us: you either pay for the foundation once, or the repairs every three years. I have initialized the Sovereign ROI Calculator below to show you the year-over-year savings of our 22nd-century mix.",
      );
    } else if (input.includes('years') || input.includes('history')) {
      sendJarvisMessage(
        `The Worden Alliance has maintained a continuous paving sprint every year from ${LEGACY_YEARS[0]} straight through to this current ${LEGACY_YEARS[LEGACY_YEARS.length - 1]} season. 1984 founded, 2026 perfected.`,
      );
    } else if (input.includes('pay') || input.includes('hire')) {
      setView('SUCCESS');
    } else {
      sendJarvisMessage(
        'I want to ensure we provide the exact engineering your property requires. Are we looking at a commercial modernization or a premium residential enhancement with our signature seal-coat agreement?',
      );
    }
  };

  const s: {
    section: CSSProperties;
    card: CSSProperties;
    grid: CSSProperties;
    jarvis: CSSProperties;
    button: CSSProperties;
  } = {
    section: {
      padding: '60px 20px',
      backgroundColor: THEME.bg,
      color: THEME.text,
      fontFamily: '"Inter", sans-serif',
      minHeight: '100vh',
    },
    card: {
      background: '#0A0A0A',
      border: `1px solid ${THEME.gold}`,
      borderRadius: '15px',
      padding: '30px',
      margin: '20px auto',
      maxWidth: '900px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
    },
    jarvis: {
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '380px',
      height: '500px',
      backgroundColor: THEME.glass,
      border: `1px solid ${THEME.gold}`,
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10000,
      boxShadow: '0 0 40px rgba(0,0,0,1)',
    },
    button: {
      background: THEME.gold,
      color: '#000',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '8px',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
  };

  return (
    <div style={s.section}>
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <div
          style={{
            border: `1px solid ${THEME.gold}`,
            display: 'inline-block',
            padding: '5px 15px',
            borderRadius: '20px',
            fontSize: '12px',
            color: THEME.gold,
          }}
        >
          OFFICIAL HQ: 1601 WARE BOTTOM SPRINGS RD, CHESTER, VA
        </div>
        <h1 style={{ fontSize: '48px', fontWeight: 900, marginTop: '20px' }}>
          THE WORDEN ALLIANCE
        </h1>
        <p style={{ color: THEME.muted }}>
          CONTINUOUS OPERATIONS: {LEGACY_YEARS.join(' \u2022 ')}
        </p>
      </div>

      <div style={s.card}>
        <h2 style={{ color: THEME.gold }}>SOVEREIGN ASSET ANALYSIS</h2>
        <input
          type="range"
          min={1000}
          max={50000}
          step={500}
          value={sqFt}
          onChange={(e) => setSqFt(Number(e.target.value))}
          style={{ width: '100%', accentColor: THEME.gold, margin: '20px 0' }}
          aria-label="Project size in square feet"
        />
        <div style={s.grid}>
          <div>
            <span style={{ fontSize: '12px', color: THEME.muted }}>PROJECT SIZE</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {sqFt.toLocaleString()} SQ FT
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: THEME.muted }}>
              WORDEN ANNUAL SAVINGS
            </span>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: THEME.gold }}>
              ${calculateSavings(sqFt).toLocaleString()} / YR
            </div>
          </div>
        </div>
      </div>

      {view === 'EVIDENCE' && (
        <div style={s.card}>
          <h2 style={{ color: THEME.gold }}>KBP FOODS NATIONAL LOGS (2024-2025)</h2>
          <div style={s.grid}>
            {KBP_DATA.map((d) => (
              <div
                key={d.state}
                style={{ borderLeft: `2px solid ${THEME.gold}`, paddingLeft: '15px' }}
              >
                <div style={{ fontWeight: 'bold' }}>{d.state}</div>
                <div style={{ fontSize: '12px', color: THEME.muted }}>
                  {d.units} Units &middot; {d.year} &middot; {d.files}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'SUCCESS' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 20000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={s.card}>
            <h1 style={{ color: THEME.gold }}>ACCORD SEALED</h1>
            <p>
              Your property is now scheduled for the April 18-19 Priority Sprint. Jarvis is
              preparing your logistics log.
            </p>
            <button style={s.button} onClick={() => setView('MAIN')}>
              RETURN TO HQ
            </button>
          </div>
        </div>
      )}

      {jarvisOpen && (
        <div style={s.jarvis} role="dialog" aria-label="Jarvis Digital Foreman">
          <div
            style={{
              padding: '15px',
              background: THEME.gold,
              color: '#000',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#00FF00',
                borderRadius: '50%',
                marginRight: '10px',
              }}
              aria-hidden="true"
            />
            JARVIS | DIGITAL FOREMAN
          </div>
          <div
            style={{
              flex: 1,
              padding: '15px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'jarvis' ? 'flex-start' : 'flex-end',
                  backgroundColor: m.role === 'jarvis' ? '#222' : THEME.gold,
                  color: m.role === 'jarvis' ? '#FFF' : '#000',
                  padding: '10px 15px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  maxWidth: '85%',
                }}
              >
                {m.content}
              </div>
            ))}
            {isTyping && (
              <div style={{ color: THEME.muted, fontSize: '12px' }}>
                Foreman is calculating...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div
            style={{
              padding: '15px',
              borderTop: THEME.border,
              display: 'flex',
              gap: '10px',
            }}
          >
            <input
              style={{
                flex: 1,
                background: '#000',
                border: THEME.border,
                color: '#FFF',
                padding: '10px',
                borderRadius: '5px',
              }}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') processInput(inputValue);
              }}
              placeholder="Speak with the Foreman..."
              aria-label="Message the Foreman"
            />
            <button style={s.button} onClick={() => processInput(inputValue)}>
              SEND
            </button>
          </div>
        </div>
      )}

      <footer
        style={{
          marginTop: '100px',
          borderTop: THEME.border,
          paddingTop: '40px',
          textAlign: 'center',
        }}
      >
        <p style={{ letterSpacing: '2px', color: THEME.gold }}>
          HAND-TAMPED EDGES &middot; ZERO ROLLER MARKS &middot; PROFESSIONAL CLEANUP
        </p>
        <p style={{ color: THEME.muted, fontSize: '12px', marginTop: '10px' }}>
          &copy; 1984 - 2026 J. WORDEN &amp; SONS PAVING LLC. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
};

export default JWordenSovereignEngine;
