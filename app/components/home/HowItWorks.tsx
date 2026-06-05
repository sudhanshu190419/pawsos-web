"use client";

import { useEffect, useRef, useState } from "react";
import { PawPrint, AlertCircle, Bell, Stethoscope, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: PawPrint,
    step: "01",
    title: "Animal in Need",
    description: "A citizen spots an injured, abandoned, or distressed animal on the street.",
    tag: "Trigger",
    iconBg: "#1e293b",
  },
  {
    icon: AlertCircle,
    step: "02",
    title: "SOS Report",
    description: "Open the app, snap a photo, and submit an SOS with auto GPS in under 30 seconds.",
    tag: "Action",
    iconBg: "#f97316",
    highlight: true,
  },
  {
    icon: Bell,
    step: "03",
    title: "Volunteers Notified",
    description: "Nearby verified volunteers and NGOs receive instant push notifications with coordinates.",
    tag: "Alert",
    iconBg: "#0ea5e9",
  },
  {
    icon: Stethoscope,
    step: "04",
    title: "NGO / Vet Support",
    description: "Partner NGOs dispatch rescue teams. Vets provide emergency teleconsultation.",
    tag: "Response",
    iconBg: "#10b981",
  },
  {
    icon: CheckCircle2,
    step: "05",
    title: "Rescue Completed",
    description: "The animal is treated, rehabilitated, or rehomed. Track every step on the app.",
    tag: "Outcome",
    iconBg: "#8b5cf6",
  },
];

function StepCard({ step, index, activeIndex, onClick }: {
  step: typeof STEPS[0];
  index: number;
  activeIndex: number;
  onClick: (i: number) => void;
}) {
  const isActive = activeIndex === index;

  return (
    <button
      onClick={() => onClick(index)}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "block",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "relative",
          borderRadius: "20px",
          border: `1.5px solid ${isActive ? "rgba(251,146,60,0.4)" : "rgba(226,232,240,0.9)"}`,
          background: isActive
            ? "linear-gradient(145deg,#fff7ed 0%,#ffffff 100%)"
            : "rgba(255,255,255,0.8)",
          backdropFilter: "blur(12px)",
          padding: "clamp(18px, 4vw, 28px) clamp(14px, 3.5vw, 22px)",
          transition: "all 0.38s cubic-bezier(0.4,0,0.2,1)",
          transform: isActive ? "translateY(-7px) scale(1.01)" : "translateY(0) scale(1)",
          boxShadow: isActive
            ? "0 24px 60px -12px rgba(251,146,60,0.25), 0 6px 24px -4px rgba(0,0,0,0.07)"
            : "0 1px 4px rgba(0,0,0,0.04)",
          height: "100%",
          boxSizing: "border-box",
          textAlign: "left",
        }}
      >
        {/* Top row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <span
            style={{
              fontFamily: "'DM Mono', 'Courier New', monospace",
              fontSize: "10.5px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: isActive ? "#f97316" : "#94a3b8",
              background: isActive ? "#fff7ed" : "#f8fafc",
              padding: "4px 10px",
              borderRadius: "100px",
              border: `1px solid ${isActive ? "#fed7aa" : "#e2e8f0"}`,
              transition: "all 0.3s ease",
            }}
          >
            {step.step}
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontSize: "9.5px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: isActive ? "#f97316" : "#cbd5e1",
              transition: "color 0.3s ease",
            }}
          >
            {step.tag}
          </span>
        </div>

        {/* Icon */}
        <div
          style={{
            width: "50px",
            height: "50px",
            borderRadius: "15px",
            background: isActive ? "#f97316" : "#1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "18px",
            transition: "all 0.38s cubic-bezier(0.4,0,0.2,1)",
            transform: isActive ? "scale(1.1) rotate(-3deg)" : "scale(1) rotate(0deg)",
            boxShadow: isActive ? "0 10px 28px rgba(249,115,22,0.38)" : "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          <step.icon style={{ width: "21px", height: "21px", color: "#fff" }} />
        </div>

        <h3
          style={{
            fontFamily: "'Bricolage Grotesque', 'Georgia', serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "8px",
            lineHeight: 1.25,
            letterSpacing: "-0.01em",
          }}
        >
          {step.title}
        </h3>

        <p
          style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: "13px",
            color: "#64748b",
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {step.description}
        </p>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: isActive ? "60%" : "0%",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #f97316, transparent)",
            borderRadius: "2px",
            transition: "width 0.45s ease",
          }}
        />
      </div>
    </button>
  );
}

export default function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STEPS.length);
    }, 1500);
    intervalRef.current = id;
    return () => clearInterval(id);
  }, []);

  const handleClick = (i: number) => {
    setActiveIndex(i);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STEPS.length);
    }, 1500);
    intervalRef.current = id;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500;600&display=swap');
        .hiw-root *,.hiw-root *::before,.hiw-root *::after{box-sizing:border-box;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes drift{0%,100%{transform:translateY(0)rotate(0deg)}40%{transform:translateY(-22px)rotate(1.5deg)}70%{transform:translateY(-10px)rotate(-1deg)}}
        @keyframes shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
        @keyframes pulse-dot{0%,100%{box-shadow:0 0 0 0 rgba(249,115,22,0.5)}50%{box-shadow:0 0 0 6px rgba(249,115,22,0)}}
        .hiw-animate{animation:fadeUp 0.65s ease both;}
        .hiw-animate-1{animation:fadeUp 0.65s 0.1s ease both;}
        .hiw-animate-2{animation:fadeUp 0.65s 0.22s ease both;}
        .hiw-animate-3{animation:fadeUp 0.65s 0.38s ease both;}
        .hiw-card-grid{
          display:grid;
          grid-template-columns:repeat(5,1fr);
          gap:14px;
          align-items:stretch;
        }
        @media(max-width:1080px){.hiw-card-grid{grid-template-columns:repeat(3,1fr);}}
        @media(max-width:680px){.hiw-card-grid{grid-template-columns:1fr 1fr;}}
        @media(max-width:420px){.hiw-card-grid{grid-template-columns:1fr;}}
        .hiw-shimmer-text{
          background:linear-gradient(90deg,#0f172a 0%,#0f172a 30%,#f97316 50%,#0f172a 70%,#0f172a 100%);
          background-size:300% auto;
          -webkit-background-clip:text;
          background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimmer 5s linear infinite;
        }
        .hiw-pulse{animation:pulse-dot 2s ease infinite;}
      `}</style>

      <section
        className="hiw-root"
        style={{
          position: "relative",
          padding: "clamp(48px, 12vw, 96px) 0 clamp(56px, 14vw, 112px)",
          overflow: "hidden",
          background: "#f8fafc",
          borderTop: "1px solid #f1f5f9",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        {/* Ambient gradients */}
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(ellipse at 15% 20%, rgba(251,146,60,0.09) 0%,transparent 50%),radial-gradient(ellipse at 85% 80%,rgba(139,92,246,0.07) 0%,transparent 50%)",pointerEvents:"none"}} />

        {/* Drifting orbs */}
        <div style={{position:"absolute",top:"8%",left:"4%",width:"360px",height:"360px",borderRadius:"50%",background:"radial-gradient(circle,rgba(251,146,60,0.08) 0%,transparent 70%)",animation:"drift 10s ease-in-out infinite",pointerEvents:"none"}} />
        <div style={{position:"absolute",bottom:"8%",right:"4%",width:"300px",height:"300px",borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.07) 0%,transparent 70%)",animation:"drift 13s 3s ease-in-out infinite",pointerEvents:"none"}} />

        {/* Dot grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle,#e2e8f0 1px,transparent 1px)",backgroundSize:"30px 30px",opacity:0.5,pointerEvents:"none"}} />

        <div style={{position:"relative",zIndex:10,maxWidth:"1220px",margin:"0 auto",padding:"0 24px"}}>

          {/* ── HEADER ── */}
          <div className="hiw-animate" style={{textAlign:"center",marginBottom:"64px"}}>
            {/* eyebrow pill */}
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"#fff",border:"1px solid #fed7aa",borderRadius:"100px",padding:"6px 16px 6px 8px",marginBottom:"24px",boxShadow:"0 2px 8px rgba(249,115,22,0.1)"}}>
              <span style={{width:"22px",height:"22px",borderRadius:"50%",background:"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#f97316",display:"block"}} className="hiw-pulse" />
              </span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:"10.5px",fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",color:"#ea580c"}}>Simple Process</span>
            </div>

            <h2 style={{fontFamily:"'Bricolage Grotesque','Georgia',serif",fontSize:"clamp(2.4rem,5.5vw,4.2rem)",fontWeight:800,lineHeight:1.08,letterSpacing:"-0.035em",margin:"0 0 6px"}}>
              <span className="hiw-shimmer-text">AnimalSathi</span>
              <span style={{display:"block",color:"#0f172a",WebkitTextFillColor:"#0f172a",background:"none",animation:"none"}}>in five steps.</span>
            </h2>

            <div className="hiw-animate-1" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"18px",marginTop:"22px"}}>
              <div style={{width:"52px",height:"1px",background:"linear-gradient(90deg,transparent,#f97316)"}} />
              <p style={{fontFamily:"'DM Sans',system-ui,sans-serif",fontSize:"clamp(14px,1.8vw,16px)",color:"#64748b",maxWidth:"500px",lineHeight:1.72,margin:0,fontWeight:400}}>
                From spotting a distressed animal to full recovery — a seamless,
                coordinated response clicks into place automatically.
              </p>
              <div style={{width:"52px",height:"1px",background:"linear-gradient(90deg,#f97316,transparent)"}} />
            </div>
          </div>

          {/* ── PROGRESS STRIP ── */}
          <div className="hiw-animate-2" style={{display:"flex",gap:0,marginBottom:"16px",height:"3px",borderRadius:"3px",overflow:"hidden",background:"#e2e8f0"}}>
            {STEPS.map((s, i) => (
              <div
                key={i}
                onClick={() => handleClick(i)}
                style={{
                  flex:1,
                  height:"100%",
                  background: i <= activeIndex ? "linear-gradient(90deg,#f97316,#fb923c)" : "transparent",
                  transition:"background 0.35s ease",
                  cursor:"pointer",
                }}
              />
            ))}
          </div>

          {/* Step label hint */}
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"16px"}}>
            {STEPS.map((s, i) => (
              <span
                key={i}
                onClick={() => handleClick(i)}
                style={{
                  fontFamily:"'DM Mono',monospace",
                  fontSize:"9px",
                  fontWeight:700,
                  letterSpacing:"0.1em",
                  textTransform:"uppercase",
                  color: i === activeIndex ? "#f97316" : "#cbd5e1",
                  cursor:"pointer",
                  transition:"color 0.3s ease",
                  flex:1,
                  textAlign: i === 0 ? "left" : i === STEPS.length-1 ? "right" : "center",
                }}
              >
                {s.step}
              </span>
            ))}
          </div>

          {/* ── CARDS ── */}
          <div className="hiw-animate-2 hiw-card-grid">
            {STEPS.map((step, i) => (
              <StepCard key={i} step={step} index={i} activeIndex={activeIndex} onClick={handleClick} />
            ))}
          </div>

          {/* ── METRICS ── */}
          <div className="hiw-animate-3" style={{marginTop:"72px",display:"flex",justifyContent:"center",padding:"0 8px"}}>
            <div
              style={{
                display:"grid",
                gridTemplateColumns:"1fr 1px 1fr",
                alignItems:"center",
                background:"#fff",
                borderRadius:"24px",
                border:"1px solid #f1f5f9",
                boxShadow:"0 12px 60px -12px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.04)",
                overflow:"hidden",
                maxWidth:"500px",
                width:"100%",
              }}
            >
              <div style={{padding:"clamp(20px, 5vw, 40px)",textAlign:"center"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"clamp(8px, 2.5vw, 10px)",fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:"#94a3b8",marginBottom:"8px"}}>Avg. Response</div>
                <div style={{fontFamily:"'Bricolage Grotesque','Georgia',serif",fontSize:"clamp(1.6rem, 7vw, 3.2rem)",fontWeight:800,lineHeight:1,color:"#f97316",letterSpacing:"-0.04em"}}>
                  &lt;15<span style={{fontSize:"clamp(0.7rem, 3vw, 1rem)",fontWeight:600,color:"#fb923c",marginLeft:"2px"}}>min</span>
                </div>
                <div style={{marginTop:"8px",height:"2px",width:"clamp(24px, 8vw, 36px)",margin:"8px auto 0",borderRadius:"2px",background:"linear-gradient(90deg,#f97316,#fb923c)"}} />
              </div>

              <div style={{height:"clamp(40px, 10vw, 72px)",background:"linear-gradient(180deg,transparent,#e2e8f0,transparent)"}} />

              <div style={{padding:"clamp(20px, 5vw, 40px)",textAlign:"center"}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:"clamp(8px, 2.5vw, 10px)",fontWeight:600,letterSpacing:"0.14em",textTransform:"uppercase",color:"#94a3b8",marginBottom:"8px"}}>Success Rate</div>
                <div style={{fontFamily:"'Bricolage Grotesque','Georgia',serif",fontSize:"clamp(1.6rem, 7vw, 3.2rem)",fontWeight:800,lineHeight:1,color:"#10b981",letterSpacing:"-0.04em"}}>
                  94<span style={{fontSize:"clamp(0.7rem, 3vw, 1rem)",fontWeight:600,color:"#34d399",marginLeft:"2px"}}>%</span>
                </div>
                <div style={{marginTop:"8px",height:"2px",width:"clamp(24px, 8vw, 36px)",margin:"8px auto 0",borderRadius:"2px",background:"linear-gradient(90deg,#10b981,#34d399)"}} />
              </div>
            </div>
          </div>



        </div>
      </section>
    </>
  );
}