// Portfolio Component — JWD
// React + Babel inline component shared across index.html & portfolio.html

const API_BASE_URL = window.__SITE_CONFIG?.apiBaseUrl || "";

async function fetchSignedReadUrl(r2Key) {
  if (!API_BASE_URL || !r2Key) return "";
  const response = await fetch(`${API_BASE_URL}/public/assets/sign-read`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ r2Key }),
  });
  if (!response.ok) throw new Error("Failed to sign image URL");
  const body = await response.json();
  return body.signedUrl || "";
}

async function fetchProjectsFromApi() {
  if (!API_BASE_URL) return [];
  const response = await fetch(`${API_BASE_URL}/public/case-studies`);
  if (!response.ok) throw new Error("Failed to load case studies");
  const body = await response.json();
  const caseStudies = body.caseStudies || [];
  const projects = await Promise.all(caseStudies.map(async (project, index) => {
    const images = await Promise.all(
      (project.images || []).map(async (image) => ({
        ...image,
        url: await fetchSignedReadUrl(image.r2Key).catch(() => ""),
      }))
    );

    return {
      id: project.id || index + 1,
      title: project.title || "",
      category: (project.categories || []).join(" · "),
      tags: (project.tags || []).filter(Boolean),
      tagline: project.shortDescription || "",
      accent: project.accentColor || "#00d4a8",
      bg: project.backgroundColor || "#0a2218",
      timeline: (project.timelineSteps || []).map((step) => ({
        phase: step.name,
        duration: `${step.durationWeeks} wk`,
        description: step.summary,
      })),
      images: images.filter((image) => image.url),
    };
  }));

  return projects;
}

// ── SVG Mockup Screens ──────────────────────────────────────────────────────
function ProjectMockup({ project, screenIndex = 0 }) {
  if (project.images && project.images[screenIndex] && project.images[screenIndex].url) {
    return (
      <img
        src={project.images[screenIndex].url}
        alt={project.images[screenIndex].alt || project.title}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  const screens = [
    // Screen 0: Main dashboard
    <svg key={0} viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <rect width="800" height="500" fill="#0a0e1a"/>
      {/* Sidebar */}
      <rect x="0" y="0" width="180" height="500" fill="#0f1623" opacity="0.9"/>
      <rect x="16" y="24" width="120" height="14" rx="3" fill={project.accent} opacity="0.9"/>
      {[0,1,2,3,4,5].map(i => (
        <g key={i}>
          <rect x="16" y={68 + i*44} width="28" height="28" rx="6" fill={i===0 ? project.accent : "#1e2d45"} opacity={i===0 ? 0.2 : 0.5}/>
          <rect x="52" y={76 + i*44} width="80" height="10" rx="3" fill={i===0 ? project.accent : "#4a5872"} opacity={i===0 ? 0.9 : 0.5}/>
        </g>
      ))}
      {/* Main area header */}
      <rect x="196" y="20" width="160" height="22" rx="4" fill="#e8edf5" opacity="0.9"/>
      <rect x="196" y="50" width="100" height="10" rx="3" fill="#4a5872" opacity="0.7"/>
      <rect x="600" y="18" width="90" height="28" rx="6" fill={project.accent} opacity="0.9"/>
      {/* Stat cards */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x={196 + i*153} y="90" width="138" height="80" rx="8" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
          <rect x={210 + i*153} y="106" width="60" height="8" rx="2" fill="#4a5872" opacity="0.7"/>
          <rect x={210 + i*153} y="122" width="90" height="24" rx="4" fill="#e8edf5" opacity="0.85"/>
          <rect x={210 + i*153} y="153" width="50" height="8" rx="2" fill={project.accent} opacity="0.7"/>
        </g>
      ))}
      {/* Chart area */}
      <rect x="196" y="186" width="420" height="220" rx="8" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
      <rect x="212" y="202" width="100" height="14" rx="3" fill="#e8edf5" opacity="0.8"/>
      {/* Bar chart */}
      {[40,70,55,85,45,90,60,75].map((h, i) => (
        <rect key={i} x={220 + i*48} y={370 - h} width="28" height={h} rx="3" fill={project.accent} opacity={i===5 ? 0.95 : 0.35 + i*0.07}/>
      ))}
      <line x1="212" y1="370" x2="580" y2="370" stroke="#1e2d45" strokeWidth="1"/>
      {/* Side panel */}
      <rect x="632" y="186" width="158" height="220" rx="8" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
      <rect x="648" y="202" width="80" height="12" rx="3" fill="#e8edf5" opacity="0.8"/>
      {[0,1,2,3,4].map(i => (
        <g key={i}>
          <circle cx="660" cy={232 + i*32} r="6" fill={project.accent} opacity={0.3 + i*0.1}/>
          <rect x="675" cy={228 + i*32} y={228 + i*32} width="80" height="8" rx="2" fill="#4a5872" opacity="0.7"/>
          <rect x="675" y={240 + i*32} width="50" height="6" rx="2" fill="#2a3a58" opacity="0.7"/>
        </g>
      ))}
      {/* Bottom table */}
      <rect x="196" y="418" width="594" height="62" rx="8" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={212 + i*116} y="434" width="90" height="8" rx="2" fill="#4a5872" opacity="0.5"/>
      ))}
      {[0,1,2,3,4].map(i => (
        <rect key={i} x={212 + i*116} y="450" width={60 + i*8} height="10" rx="2" fill="#e8edf5" opacity="0.6"/>
      ))}
    </svg>,

    // Screen 1: List / feed view
    <svg key={1} viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <rect width="800" height="500" fill="#0a0e1a"/>
      <rect x="0" y="0" width="800" height="56" fill="#0f1623" stroke="#1e2d45" strokeWidth="1"/>
      <rect x="24" y="18" width="80" height="18" rx="4" fill={project.accent} opacity="0.9"/>
      <rect x="300" y="16" width="200" height="24" rx="12" fill="#162033"/>
      <rect x="620" y="16" width="80" height="24" rx="6" fill={project.accent} opacity="0.8"/>
      <rect x="714" y="18" width="40" height="20" rx="4" fill="#1e2d45"/>
      {[0,1,2,3,4,5].map(i => (
        <g key={i}>
          <rect x="24" y={76 + i*68} width="752" height="56" rx="8" fill={i===1 ? "#1b2640" : "#0f1623"} stroke="#1e2d45" strokeWidth="1"/>
          <rect x="40" y={90 + i*68} width="40" height="28" rx="4" fill={project.accent} opacity={0.1 + i*0.05}/>
          <rect x="92" y={92 + i*68} width="120" height="10" rx="3" fill="#e8edf5" opacity="0.8"/>
          <rect x="92" y={108 + i*68} width="200" height="8" rx="2" fill="#4a5872" opacity="0.6"/>
          <rect x={620} y={90 + i*68} width="60" height="12" rx="3" fill={project.accent} opacity={i%2===0 ? 0.8 : 0.2}/>
          <rect x={696} y={90 + i*68} width="64" height="12" rx="3" fill="#1e2d45"/>
        </g>
      ))}
    </svg>,

    // Screen 2: Detail / settings view
    <svg key={2} viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <rect width="800" height="500" fill="#0a0e1a"/>
      <rect x="0" y="0" width="260" height="500" fill="#0f1623" stroke="#1e2d45" strokeWidth="1"/>
      <rect x="20" y="24" width="100" height="18" rx="4" fill="#e8edf5" opacity="0.8"/>
      <rect x="20" y="52" width="140" height="8" rx="2" fill="#4a5872" opacity="0.5"/>
      {/* Form fields in sidebar */}
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="20" y={80 + i*72} width="220" height="10" rx="2" fill="#4a5872" opacity="0.6"/>
          <rect x="20" y={96 + i*72} width="220" height="32" rx="6" fill="#162033" stroke="#1e2d45" strokeWidth="1"/>
          <rect x="30" y={108 + i*72} width="120" height="8" rx="2" fill="#4a5872" opacity="0.5"/>
        </g>
      ))}
      <rect x="20" y="380" width="220" height="36" rx="6" fill={project.accent} opacity="0.9"/>
      {/* Main content */}
      <rect x="280" y="20" width="500" height="180" rx="10" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
      {/* Line chart */}
      <polyline points="300,170 360,130 420,155 480,90 540,110 600,70 660,95 720,60 760,80" fill="none" stroke={project.accent} strokeWidth="2.5"/>
      <polyline points="300,170 360,130 420,155 480,90 540,110 600,70 660,95 720,60 760,80 760,195 300,195" fill={project.accent} opacity="0.07"/>
      <rect x="280" y="220" width="240" height="130" rx="10" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
      <rect x="296" y="236" width="80" height="10" rx="3" fill="#e8edf5" opacity="0.7"/>
      {[0,1,2].map(i => <rect key={i} x="296" y={258 + i*26} width={180 - i*30} height="14" rx="3" fill="#1e2d45"/>)}
      <rect x="536" y="220" width="244" height="130" rx="10" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
      <circle cx="658" cy="285" r="44" fill="none" stroke="#1e2d45" strokeWidth="18"/>
      <circle cx="658" cy="285" r="44" fill="none" stroke={project.accent} strokeWidth="18" strokeDasharray="180 96" strokeLinecap="round" transform="rotate(-90 658 285)"/>
      <rect x="280" y="368" width="500" height="110" rx="10" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
      {[0,1,2].map(i => <rect key={i} x="296" y={384 + i*28} width={300 + i*60} height="10" rx="3" fill="#1e2d45"/>)}
    </svg>,

    // Screen 3: Mobile-style narrow view
    <svg key={3} viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
      <rect width="800" height="500" fill="#0a0e1a"/>
      {/* Centered phone-width card */}
      <rect x="200" y="0" width="400" height="500" fill="#0f1623"/>
      <rect x="200" y="0" width="400" height="56" fill="#0f1623" stroke="#1e2d45" strokeWidth="1"/>
      <rect x="220" y="14" width="60" height="28" rx="4" fill={project.accent} opacity="0.15"/>
      <rect x="224" y="20" width="52" height="16" rx="3" fill={project.accent} opacity="0.9"/>
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="216" y={72 + i*104} width="368" height="90" rx="10" fill="#1b2640" stroke="#1e2d45" strokeWidth="1"/>
          <rect x="232" y={90 + i*104} width="180" height="12" rx="3" fill="#e8edf5" opacity="0.85"/>
          <rect x="232" y={110 + i*104} width="260" height="8" rx="2" fill="#4a5872" opacity="0.6"/>
          <rect x="232" y={126 + i*104} width="120" height="8" rx="2" fill="#4a5872" opacity="0.4"/>
          <rect x="492" y={86 + i*104} width="60" height="28" rx="6" fill={project.accent} opacity={i===0 ? 0.9 : 0.2}/>
        </g>
      ))}
      {/* Fade sides */}
      <rect x="0" y="0" width="200" height="500" fill="url(#fadeL)"/>
      <rect x="600" y="0" width="200" height="500" fill="url(#fadeR)"/>
      <defs>
        <linearGradient id="fadeL" x1="0" x2="1"><stop offset="0%" stopColor="#080c14"/><stop offset="100%" stopColor="transparent"/></linearGradient>
        <linearGradient id="fadeR" x1="0" x2="1"><stop offset="0%" stopColor="transparent"/><stop offset="100%" stopColor="#080c14"/></linearGradient>
      </defs>
    </svg>
  ];

  return screens[screenIndex % screens.length];
}

// ── Portfolio Card ──────────────────────────────────────────────────────────
function PortfolioCard({ project, featured, onOpen }) {
  const cardStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
    display: 'flex',
    flexDirection: featured ? 'row' : 'column',
  };

  const [hovered, setHovered] = React.useState(false);

  const tagsToShow =
    Array.isArray(project.tags) && project.tags.length > 0
      ? project.tags
      : (project.timeline || []).map((t) => t.phase);

  return (
    <div
      style={{
        ...cardStyle,
        borderColor: hovered ? 'var(--border-light)' : 'var(--border)',
        boxShadow: hovered ? '0 16px 60px rgba(0,0,0,0.5)' : 'none',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image area */}
      <div style={{
        background: project.bg,
        flex: featured ? '0 0 55%' : '0 0 auto',
        height: featured ? 'auto' : '220px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: featured ? '320px' : 'auto',
      }}>
        <ProjectMockup project={project} screenIndex={0} />
        {/* Accent glow */}
        <div style={{
          position:'absolute', inset:0,
          background: `radial-gradient(ellipse at 30% 50%, ${project.accent}22 0%, transparent 65%)`,
          pointerEvents:'none',
        }}/>
        {/* Category badge */}
        <div style={{
          position:'absolute', top:'1rem', left:'1rem',
          background:'rgba(8,12,20,0.75)',
          backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:'20px',
          padding:'0.3rem 0.75rem',
          fontSize:'0.72rem',
          fontWeight:600,
          letterSpacing:'0.06em',
          color: project.accent,
        }}>
          {project.category}
        </div>
      </div>

      {/* Content area */}
      <div style={{
        padding: featured ? 'clamp(1.5rem,4vw,2.5rem)' : '1.5rem',
        display:'flex', flexDirection:'column', gap:'1rem',
        flex: 1,
        justifyContent: 'center',
      }}>
        <h3 style={{ fontFamily:'var(--font-serif)', color:'var(--text-primary)', fontSize: featured ? 'clamp(1.6rem,3vw,2.2rem)' : '1.4rem', fontWeight:400 }}>
          {project.title}
        </h3>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.95rem', lineHeight:1.7, marginTop:0 }}>
          {project.tagline}
        </p>
        {/* Tags */}
        <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginTop:'0.25rem' }}>
          {tagsToShow.map((tag, i) => (
            <span key={i} style={{
              fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.05em',
              padding:'0.2rem 0.6rem', borderRadius:'4px',
              background:`${project.accent}14`,
              color: project.accent, border:`1px solid ${project.accent}30`,
            }}>{tag}</span>
          ))}
        </div>
        <button
          onClick={onOpen}
          style={{
            marginTop:'0.5rem',
            alignSelf:'flex-start',
            background: 'transparent',
            border: `1px solid ${project.accent}`,
            color: project.accent,
            padding:'0.6rem 1.25rem',
            borderRadius:'6px',
            fontFamily:'var(--font-sans)',
            fontSize:'0.85rem',
            fontWeight:600,
            letterSpacing:'0.04em',
            cursor:'pointer',
            transition:'background 0.3s, box-shadow 0.3s',
            display:'flex', alignItems:'center', gap:'0.4rem',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${project.accent}18`; e.currentTarget.style.boxShadow = `0 0 20px ${project.accent}30`; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          View Case Study
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Timeline Component (full-width segmented scrubber) ─────────────────────
function CaseTimeline({ project, activeIndex, onSelect }) {
  const trackRef    = React.useRef(null);
  const segRefs     = React.useRef([]);
  const [dragging, setDragging]         = React.useState(false);
  const [hoverIndex, setHoverIndex]     = React.useState(null);
  const [playheadPct, setPlayheadPct]   = React.useState(null);
  // Measured segment centres (% of track width) — populated after render
  const [measuredCenters, setMeasuredCenters] = React.useState(null);

  // Parse "2 wk" → 2 for proportional flex-grow
  const parseDur = (d) => { const m = d.match(/(\d+)/); return m ? parseInt(m[1]) : 1; };
  const durations = project.timeline.map(t => parseDur(t.duration));

  // Measure actual rendered positions so the playhead is always accurate
  const measure = React.useCallback(() => {
    if (!trackRef.current) return;
    const trackRect = trackRef.current.getBoundingClientRect();
    if (trackRect.width === 0) return;
    const centers = segRefs.current.map(el => {
      if (!el) return 50;
      const r = el.getBoundingClientRect();
      return ((r.left - trackRect.left + r.width / 2) / trackRect.width) * 100;
    });
    setMeasuredCenters(centers);
  }, []);

  React.useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [measure]);

  React.useEffect(() => {
    if (!dragging) return undefined;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = previousUserSelect;
    };
  }, [dragging]);

  // Keep a local playhead position so release never briefly snaps back to stale active state.
  const naturalPct   = measuredCenters ? measuredCenters[activeIndex] : null;
  const displayPct   = playheadPct ?? naturalPct;

  React.useEffect(() => {
    if (dragging) return;
    if (naturalPct === null || naturalPct === undefined) return;
    setPlayheadPct((prev) => {
      if (prev === null) return naturalPct;
      return Math.abs(prev - naturalPct) < 0.001 ? prev : naturalPct;
    });
  }, [dragging, naturalPct]);

  const getIndexFromPct = (pct) => {
    // Use actual rendered segment boundaries, not estimated centres
    if (segRefs.current.length && trackRef.current) {
      const trackRect = trackRef.current.getBoundingClientRect();
      if (trackRect.width > 0) {
        for (let i = 0; i < segRefs.current.length; i++) {
          const el = segRefs.current[i];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          const l = ((r.left  - trackRect.left) / trackRect.width) * 100;
          const r2 = ((r.right - trackRect.left) / trackRect.width) * 100;
          if (pct >= l && pct <= r2) return i;
        }
      }
    }
    // Fallback: closest measured centre
    if (!measuredCenters) return activeIndex;
    let closest = 0, minDist = Infinity;
    measuredCenters.forEach((c, i) => { const d = Math.abs(c - pct); if (d < minDist) { minDist = d; closest = i; } });
    return closest;
  };

  const getPctFromEvent = (e) => {
    if (!trackRef.current) return displayPct ?? 50;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  };

  const handleStart = (e) => {
    if (e.cancelable) e.preventDefault();
    setDragging(true);
    const p = getPctFromEvent(e);
    setPlayheadPct(p);
    onSelect(getIndexFromPct(p));
  };
  const handleMove  = (e) => { if (!dragging) return; if (e.touches) e.preventDefault(); const p = getPctFromEvent(e); setPlayheadPct(p); onSelect(getIndexFromPct(p)); };
  const handleEnd   = (e) => {
    if (!dragging) return;
    const fallbackPct = playheadPct ?? naturalPct ?? 50;
    const endPct = e ? getPctFromEvent(e) : fallbackPct;
    const nextIndex = getIndexFromPct(endPct);
    if (measuredCenters && measuredCenters[nextIndex] !== undefined) {
      setPlayheadPct(measuredCenters[nextIndex]);
    } else {
      setPlayheadPct(endPct);
    }
    onSelect(nextIndex);
    setDragging(false);
  };

  const accent = project.accent;

  return (
    <div style={{ userSelect:'none', paddingTop:'0.25rem' }}>
      <div
        ref={trackRef}
        style={{ position:'relative', height:'72px', cursor:'ew-resize', borderRadius:'10px', overflow:'visible' }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={(e) => { handleEnd(e); setHoverIndex(null); }}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Segment blocks */}
        <div style={{ display:'flex', height:'100%', gap:'3px', borderRadius:'10px', overflow:'hidden' }}>
          {project.timeline.map((t, i) => {
            const isActive = i === activeIndex;
            const isHover  = i === hoverIndex;
            const isPast   = i < activeIndex;
            return (
              <div
                key={i}
                ref={el => segRefs.current[i] = el}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                style={{
                  flex: `${durations[i]} 1 88px`,
                  minWidth: '88px',
                  position:'relative',
                  background: isActive
                    ? `linear-gradient(135deg, ${accent}40 0%, ${accent}20 100%)`
                    : isPast ? `${accent}12` : 'var(--bg-elevated)',
                  border:`1px solid ${isActive ? accent+'60' : isHover ? 'var(--border-light)' : 'var(--border)'}`,
                  transition:'background 0.3s, border-color 0.3s',
                  display:'flex', flexDirection:'column', justifyContent:'center',
                  padding:'0 0.75rem',
                  overflow:'hidden',
                }}
              >
                <div style={{ position:'absolute', right:'0.5rem', top:'50%', transform:'translateY(-50%)', fontFamily:'var(--font-serif)', fontSize:'2.8rem', fontWeight:400, lineHeight:1, color: isActive ? accent : 'var(--border-light)', opacity: isActive ? 0.25 : 0.5, pointerEvents:'none', transition:'color 0.3s, opacity 0.3s' }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color: isActive ? accent : 'var(--text-muted)', marginBottom:'0.2rem', transition:'color 0.3s' }}>{t.phase}</div>
                <div style={{ fontSize:'0.72rem', color: isActive ? `${accent}cc` : 'var(--text-muted)', fontWeight:500, opacity:0.8 }}>{t.duration}</div>
                {isActive && <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, ${accent}, ${accent}80)`, borderRadius:'0 0 3px 3px' }}/>}
                {isActive && <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, transparent 0%, ${accent}08 50%, transparent 100%)`, animation:'shimmer 2s ease-in-out infinite' }}/>}
              </div>
            );
          })}
        </div>

        {/* Playhead — only render once centres are measured */}
        {displayPct !== null && (
          <div style={{ position:'absolute', top:'-8px', bottom:'-8px', left:`${displayPct}%`, transform:'translateX(-50%)', width:'2px', background:accent, boxShadow:`0 0 12px ${accent}, 0 0 30px ${accent}60`, transition: dragging ? 'none' : 'left 0.35s cubic-bezier(0.34,1.56,0.64,1)', pointerEvents:'none', zIndex:10 }}>
            <div style={{ position:'absolute', top:'-2px', left:'50%', transform:'translateX(-50%)', width:'14px', height:'14px', borderRadius:'50%', background:accent, boxShadow:`0 0 16px ${accent}`, border:'2px solid var(--bg-surface)' }}/>
            <div style={{ position:'absolute', bottom:'-2px', left:'50%', transform:'translateX(-50%)', width:0, height:0, borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:`6px solid ${accent}` }}/>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        @media(max-width:640px){.modal-body-grid{grid-template-columns:1fr !important}}
      `}</style>
    </div>
  );
}

// ── Case Study Modal ────────────────────────────────────────────────────────
function CaseStudyModal({ project, onClose }) {
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [timelineIndex, setTimelineIndex] = React.useState(0);
  const [textVisible, setTextVisible] = React.useState(true);
  const textRevealTimeoutRef = React.useRef(null);

  const totalScreens = project.images && project.images.length > 0 ? project.images.length : 4;

  const changeTimeline = (i) => {
    if (textRevealTimeoutRef.current) {
      clearTimeout(textRevealTimeoutRef.current);
    }
    setTextVisible(false);
    setTimelineIndex(i);
    textRevealTimeoutRef.current = setTimeout(() => { setTextVisible(true); }, 220);
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCarouselIndex(c => Math.max(0, c - 1));
      if (e.key === 'ArrowRight') setCarouselIndex(c => Math.min(totalScreens - 1, c + 1));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (textRevealTimeoutRef.current) clearTimeout(textRevealTimeoutRef.current);
    };
  }, [onClose]);

  const phase = project.timeline[timelineIndex];

  return (
    <div
      style={{
        position:'fixed', inset:0, zIndex:2000,
        background:'rgba(4,6,12,0.92)',
        backdropFilter:'blur(16px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'1rem',
        animation:'fadeIn 0.3s ease',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        @media(max-width:640px){.modal-body-grid{grid-template-columns:1fr !important}}
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background:'var(--bg-surface)',
          border:'1px solid var(--border-light)',
          borderRadius:'20px',
          width:'100%',
          maxWidth:'960px',
          maxHeight:'90vh',
          overflowY:'auto',
          animation:'slideUp 0.35s ease',
          scrollbarWidth:'thin',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding:'1.5rem 2rem',
          borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0, background:'var(--bg-surface)', zIndex:10,
          borderRadius:'20px 20px 0 0',
        }}>
          <div>
            <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:project.accent, marginBottom:'0.3rem' }}>
              Case Study
            </div>
            <h3 style={{ fontFamily:'var(--font-serif)', color:'var(--text-primary)', fontSize:'1.6rem', fontWeight:400 }}>
              {project.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width:'36px', height:'36px', borderRadius:'50%',
              background:'var(--bg-elevated)', border:'1px solid var(--border)',
              color:'var(--text-secondary)', fontSize:'1.1rem',
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', transition:'all 0.2s',
              flexShrink:0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >✕</button>
        </div>

        <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>

          {/* ── Top row: Image + Text ── */}
          <div className="modal-body-grid" style={{ display:'grid', gridTemplateColumns:'65fr 35fr', gap:'1.25rem', alignItems:'stretch' }}>

            {/* Image Carousel */}
            <div style={{ position:'relative', borderRadius:'12px', overflow:'hidden', background:project.bg, minHeight:'300px' }}>
              <ProjectMockup project={project} screenIndex={carouselIndex} />
              <div style={{ position:'absolute', inset:0, background:`radial-gradient(ellipse at 40% 60%, ${project.accent}18, transparent 70%)`, pointerEvents:'none' }}/>
              {carouselIndex > 0 && (
                <button onClick={() => setCarouselIndex(c => c - 1)} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', width:'36px', height:'36px', borderRadius:'50%', background:'rgba(8,12,20,0.8)', border:'1px solid var(--border-light)', color:'var(--text-primary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(8px)', zIndex:2 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              {carouselIndex < totalScreens - 1 && (
                <button onClick={() => setCarouselIndex(c => c + 1)} style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', width:'36px', height:'36px', borderRadius:'50%', background:'rgba(8,12,20,0.8)', border:'1px solid var(--border-light)', color:'var(--text-primary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(8px)', zIndex:2 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l5 4-5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              {/* Dots */}
              <div style={{ position:'absolute', bottom:'0.75rem', left:0, right:0, display:'flex', justifyContent:'center', gap:'0.35rem', zIndex:2 }}>
                {Array.from({length:totalScreens}).map((_,i) => (
                  <button key={i} onClick={() => setCarouselIndex(i)} style={{ width: i===carouselIndex?'20px':'7px', height:'7px', borderRadius:'4px', background: i===carouselIndex ? project.accent : 'rgba(255,255,255,0.3)', border:'none', cursor:'pointer', padding:0, transition:'all 0.3s ease' }}/>
                ))}
              </div>
            </div>

            {/* Description */}
            <div
              style={{
                background:'var(--bg-elevated)',
                border:`1px solid ${project.accent}30`,
                borderRadius:'12px',
                padding:'1.25rem',
                display:'flex', flexDirection:'column',
                opacity: textVisible ? 1 : 0,
                transform: textVisible ? 'none' : 'translateY(6px)',
                transition:'opacity 0.22s ease, transform 0.22s ease',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:project.accent, boxShadow:`0 0 10px ${project.accent}`, flexShrink:0 }}/>
                <h4 style={{ color:'var(--text-primary)', fontFamily:'var(--font-sans)', fontWeight:600, fontSize:'0.9rem' }}>
                  {phase.phase}
                  <span style={{ color:'var(--text-muted)', fontWeight:400, marginLeft:'0.35rem', fontSize:'0.78rem' }}>· {phase.duration}</span>
                </h4>
              </div>
              <p style={{ color:'var(--text-secondary)', lineHeight:1.75, fontSize:'0.84rem', flex:1 }}>
                {phase.description}
              </p>
            </div>
          </div>

          {/* ── Full-width Timeline ── */}
          <CaseTimeline project={project} activeIndex={timelineIndex} onSelect={changeTimeline} />
        </div>
      </div>
    </div>
  );
}

// ── Portfolio Grid ──────────────────────────────────────────────────────────
function PortfolioGrid({ limit }) {
  const [activeProject, setActiveProject] = React.useState(null);
  const [projects, setProjects] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    setLoadError(null);
    fetchProjectsFromApi()
      .then((nextProjects) => {
        if (mounted) setProjects(nextProjects);
      })
      .catch(() => {
        if (mounted) {
          setProjects([]);
          setLoadError("We could not load case studies right now. Please try again later.");
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const displayProjects = limit ? projects.slice(0, limit) : projects;

  if (loading && displayProjects.length === 0) {
    return <p style={{ color: "var(--text-secondary)" }}>Loading portfolio...</p>;
  }

  if (loadError) {
    return <p style={{ color: "var(--text-secondary)" }}>{loadError}</p>;
  }

  if (!displayProjects.length) {
    return <p style={{ color: "var(--text-secondary)" }}>Case studies will appear here once they are published.</p>;
  }

  return (
    <>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
        gap:'1.5rem',
      }}>
        {/* Featured first item — full width */}
        <div style={{ gridColumn:'1 / -1' }}>
          <PortfolioCard
            project={displayProjects[0]}
            featured={true}
            onOpen={() => setActiveProject(displayProjects[0])}
          />
        </div>
        {/* Remaining items */}
        {displayProjects.slice(1).map(p => (
          <PortfolioCard
            key={p.id}
            project={p}
            featured={false}
            onOpen={() => setActiveProject(p)}
          />
        ))}
      </div>

      {activeProject && (
        <CaseStudyModal project={activeProject} onClose={() => setActiveProject(null)} />
      )}
    </>
  );
}

// Export to window for cross-file use
Object.assign(window, { PortfolioGrid });
