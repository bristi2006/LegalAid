import React, { useState, useEffect, useRef } from "react";
import { Scale, Award, Shield, Briefcase, Play, Pause, RefreshCw, Database, GitMerge, FileCheck } from "lucide-react";
import { BackgroundPaths } from "./BackgroundPaths";
import { motion, type TargetAndTransition } from "framer-motion";
import { WisprFlow } from "./WisprFlow";

interface HomeProps {
  onStart: () => void;
  language: string;
}

type TypewriterSequence = {
  text: string;
  deleteAfter?: boolean;
  pauseAfter?: number;
};

// Inline Typewriter component matching Kokonut UI Typewriter behavior
export const Typewriter: React.FC<{
  sequences: TypewriterSequence[];
  className?: string;
}> = ({ sequences, className }) => {
  const [displayText, setDisplayText] = useState("");
  const sequenceIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const timeoutRef = useRef<any>(null);

  const sequencesRef = useRef(sequences);
  useEffect(() => {
    sequencesRef.current = sequences;
  }, [sequences]);

  useEffect(() => {
    const runTypewriter = () => {
      const currentSequence = sequencesRef.current[sequenceIndexRef.current];
      if (!currentSequence) return;

      if (isDeletingRef.current) {
        if (charIndexRef.current > 0) {
          charIndexRef.current -= 1;
          setDisplayText(currentSequence.text.slice(0, charIndexRef.current));
          timeoutRef.current = setTimeout(runTypewriter, 30);
        } else {
          isDeletingRef.current = false;
          const isLastSequence =
            sequenceIndexRef.current === sequencesRef.current.length - 1;

          if (isLastSequence) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current = 0;
              runTypewriter();
            }, 1000);
          } else {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current += 1;
              runTypewriter();
            }, 100);
          }
        }
      } else if (charIndexRef.current < currentSequence.text.length) {
        charIndexRef.current += 1;
        setDisplayText(currentSequence.text.slice(0, charIndexRef.current));
        timeoutRef.current = setTimeout(runTypewriter, 60);
      } else {
        const pauseDuration = currentSequence.pauseAfter ?? 1500;
        if (currentSequence.deleteAfter !== false) {
          timeoutRef.current = setTimeout(() => {
            isDeletingRef.current = true;
            runTypewriter();
          }, pauseDuration);
        } else {
          const isLastSequence =
            sequenceIndexRef.current === sequencesRef.current.length - 1;

          if (isLastSequence) {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current = 0;
              charIndexRef.current = 0;
              setDisplayText("");
              runTypewriter();
            }, 1500);
          } else {
            timeoutRef.current = setTimeout(() => {
              sequenceIndexRef.current += 1;
              charIndexRef.current = 0;
              setDisplayText("");
              runTypewriter();
            }, pauseDuration);
          }
        }
      }
    };

    timeoutRef.current = setTimeout(runTypewriter, 200);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="inline-block min-h-[1.2em]">
        {displayText}
      </span>
      <motion.span
        animate={{ opacity: [1, 1, 0, 0] }}
        className="inline-block h-[0.85em] w-[3px] bg-indigo-600 ml-1"
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatType: "loop",
          ease: "linear",
        }}
      />
    </span>
  );
};


// ── Category Carousel ────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    icon: Shield,
    title: "Consumer Protection",
    titleHi: "उपभोक्ता संरक्षण",
    subtitle: "Consumer Protection Act, 2019",
    items: [
      "Defective products or manufacturing faults",
      "Refusal or delay of eligible product refunds",
      "Overcharging above MRP or hidden service charges",
      "Misleading advertising or services deficiencies",
    ],
    color: "indigo",
  },
  {
    icon: Briefcase,
    title: "Employee Rights",
    titleHi: "कर्मचारी अधिकार",
    subtitle: "Code on Wages, 2019",
    items: [
      "Unpaid salary, final settlements, or holding wages",
      "Unpaid overtime hours or unlawful salary cuts",
      "Resignation and notice period disputes",
      "Recovery of bonus payments",
    ],
    color: "violet",
  },
  {
    icon: Scale,
    title: "Tenant & Rental",
    titleHi: "किरायेदार अधिकार",
    subtitle: "Model Tenancy Act",
    items: [
      "Landlord refusing to return security deposits",
      "Notice period and eviction timeline disagreements",
      "Refusal to perform necessary structural repairs",
      "Rent hike or lease agreement terms",
    ],
    color: "blue",
  },
];

const CategoryCarousel: React.FC<{ onStart: () => void; isHindi: boolean }> = ({ isHindi }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = CATEGORIES.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 2500);
    return () => clearInterval(timer);
  }, [total]);

  // positions: left = (activeIndex - 1 + total) % total, center = activeIndex, right = (activeIndex + 1) % total
  const getPosition = (idx: number): "left" | "center" | "right" | "hidden" => {
    if (idx === activeIndex) return "center";
    if (idx === (activeIndex - 1 + total) % total) return "left";
    if (idx === (activeIndex + 1) % total) return "right";
    return "hidden";
  };

  const positionStyles: Record<string, TargetAndTransition> = {
    center: {
      x: "0%",
      scale: 1.12,
      opacity: 1,
      zIndex: 20,
      filter: "blur(0px)",
    },
    left: {
      x: "-72%",
      scale: 0.84,
      opacity: 0.45,
      zIndex: 10,
      filter: "blur(0.5px)",
    },
    right: {
      x: "72%",
      scale: 0.84,
      opacity: 0.45,
      zIndex: 10,
      filter: "blur(0.5px)",
    },
    hidden: {
      x: "0%",
      scale: 0.7,
      opacity: 0,
      zIndex: 0,
      filter: "blur(0px)",
    },
  };

  return (
    <div className="space-y-8 pt-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isHindi ? "समर्थित कानूनी श्रेणियां" : "Supported Legal Categories"}
        </h2>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          Our platform specializes in three core civil domains under Indian statutes:
        </p>
      </div>

      {/* Carousel */}
      <div className="relative w-full flex items-center justify-center" style={{ height: 340 }}>
        {CATEGORIES.map((cat, idx) => {
          const pos = getPosition(idx);
          const Icon = cat.icon;
          const isCenter = pos === "center";

          return (
            <motion.div
              key={idx}
              onClick={() => setActiveIndex(idx)}
              animate={positionStyles[pos]}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                position: "absolute",
                width: "clamp(240px, 30%, 320px)",
                cursor: pos !== "center" ? "pointer" : "default",
              }}
              className={`
                rounded-2xl p-6 space-y-4 border select-none
                ${isCenter
                  ? "bg-white border-indigo-300 shadow-2xl shadow-indigo-200 ring-2 ring-indigo-400/40"
                  : "bg-white border-slate-200 shadow-md"
                }
              `}
            >
              <div className={`p-3 rounded-xl w-max ${isCenter ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className={`text-lg font-bold ${isCenter ? "text-slate-900" : "text-slate-600"}`}>
                {isHindi ? cat.titleHi : cat.title}
              </h3>
              <p className={`text-xs leading-relaxed font-medium ${isCenter ? "text-indigo-600" : "text-slate-400"}`}>
                {cat.subtitle}
              </p>
              {isCenter && (
                <motion.ul
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-medium"
                >
                  {cat.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </motion.ul>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mt-2">
        {CATEGORIES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-6 h-2 bg-indigo-600"
                : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Light-mode, state-driven Interactive Intelligence Dashboard
const LegalIntelligenceDashboard: React.FC = () => {
  // Panel 1: Time Travel Scrubber States
  const [activeScrubIndex, setActiveScrubIndex] = useState(1); // 0, 1, 2
  const scrubData = [
    {
      time: "10:15 AM",
      tag: "Intake Processing",
      title: "Grievance Text Parsed",
      desc: "Raw user story analyzed using RegEx triggers to filter physical risk or legal threats instantly.",
      stats: { language: "Hinglish / Hindi", domain: "Labour Case", safety: "Cleared (Low Risk)" }
    },
    {
      time: "11:30 AM",
      tag: "Parameter Extraction",
      title: "Fact Chronology Assembled",
      desc: "Core facts isolated. Conflicting values (e.g. disputed wages amount) flagged for user resolution.",
      stats: { amount: "₹1,80,000", state: "Haryana (Gurgaon)", employee_id: "EMP-4091" }
    },
    {
      time: "02:10 PM",
      tag: "Notice Compiled",
      title: "Statutes Verified & Assembled",
      desc: "Retrieved laws mapped against local Shop and Establishment Acts. Ready for professional PDF compiler.",
      stats: { template: "labour_wages_notice", sections: "Code on Wages 2019", font: "Nirmala.ttf registered" }
    }
  ];

  // Panel 2: Live Audit Logs States
  const [isPlaying, setIsPlaying] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    "[10:15:02] INTAKE: Analyzing user description...",
    "[10:15:05] CLASSIFY: Mapped to Labour Domain successfully.",
    "[10:15:08] EXTRACT: Disputed amount isolated at ₹1,80,000.",
    "[10:15:10] KNOWLEDGE: Searching Section 15 of Wage Code.",
    "[10:15:12] VERIFY: Citation match confirmed via official database."
  ]);

  useEffect(() => {
    if (!isPlaying) return;
    const logInterval = setInterval(() => {
      const randomLogs = [
        `[${new Date().toLocaleTimeString()}] STATUTE: Cross-referenced Model Tenancy Act guidelines.`,
        `[${new Date().toLocaleTimeString()}] COMPILER: Registered unicode Nirmala Devanagari cache.`,
        `[${new Date().toLocaleTimeString()}] PIPELINE: Session metadata matches API Contract rules.`,
        `[${new Date().toLocaleTimeString()}] SAFETY: Zero physical violence regex matches found.`,
        `[${new Date().toLocaleTimeString()}] JURISDICTION: State mapped to Delhi Shop Act rules.`
      ];
      const newLog = randomLogs[Math.floor(Math.random() * randomLogs.length)];
      setLogs(prev => [...prev.slice(-4), newLog]);
    }, 4000);
    return () => clearInterval(logInterval);
  }, [isPlaying]);

  // Panel 3: Dependency Graph Node States
  const [activeNode, setActiveNode] = useState<string>("case");
  const nodeInfo: Record<string, { title: string; desc: string }> = {
    case: { title: "Central Grievance Case", desc: "The factual foundation containing names, locations, timeline and claim amount." },
    statute: { title: "Statute Code Database", desc: "Strict verification matching CPA 2019, Wage Code, or Model Tenancy rules." },
    remedy: { title: "Requested Remedy", desc: "Clear demand expectations (e.g. security deposit refund or salary payout)." },
    jurisdiction: { title: "Local Jurisdiction", desc: "Applies state specific regulations based on state input parameter." }
  };

  // Panel 4: Live Drift Diff Editor States
  const [diffOriginal, setDiffOriginal] = useState(true);

  return (
    <div className="bg-slate-50 text-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Architected for <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Total Intelligence</span>
        </h2>
        <p className="text-slate-600 text-sm max-w-2xl mx-auto leading-relaxed font-medium">
          LegalAid continuously maps, validates, and compiles every detail of your intake into a professional legal notice.
        </p>
      </div>

      {/* Grid containing 4 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Panel 1: Case Time-Travel (Col Span 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between min-h-[380px] space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-850">Intake Time-Travel</h3>
                <p className="text-[10px] text-slate-400">Audit the case reconstruction timeline</p>
              </div>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="relative py-4">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 rounded"></div>
            <div className="flex justify-between items-center relative z-10">
              {scrubData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveScrubIndex(idx)}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                    activeScrubIndex === idx 
                      ? "bg-indigo-600 border-indigo-500 scale-125 shadow-lg shadow-indigo-600/30" 
                      : "bg-white border-slate-350 hover:border-slate-500"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1 pt-3">
              <span>10:15 AM</span>
              <span>11:30 AM</span>
              <span>02:10 PM</span>
            </div>
          </div>

          {/* Scrub Content Info */}
          <div className="bg-slate-50/80 border border-slate-150 rounded-xl p-4 space-y-3 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {scrubData[activeScrubIndex].tag}
              </span>
              <span className="text-[10px] font-bold text-slate-500">{scrubData[activeScrubIndex].time}</span>
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">{scrubData[activeScrubIndex].title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              {scrubData[activeScrubIndex].desc}
            </p>
            <div className="border-t border-slate-200/60 pt-2 grid grid-cols-2 gap-2 text-[10px]">
              {Object.entries(scrubData[activeScrubIndex].stats).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-slate-400 capitalize">{k.replace("_", " ")}</span>
                  <span className="text-slate-700 font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panel 2: Live Compliance Audit (Col Span 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between min-h-[380px] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 animate-pulse">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-850">Live Intake Audit</h3>
                <p className="text-[10px] text-slate-400">Statutory checks mapped in real time</p>
              </div>
            </div>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Log Window */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[10px] space-y-2.5 flex-1 flex flex-col justify-end overflow-hidden leading-relaxed text-slate-600">
            {logs.map((log, i) => {
              let colorClass = "text-slate-600";
              if (log.includes("SUCCESS") || log.includes("PASSED")) colorClass = "text-emerald-600 font-semibold";
              else if (log.includes("WARNING")) colorClass = "text-amber-600 font-semibold";
              else if (log.includes("INTAKE")) colorClass = "text-indigo-600";
              return (
                <div key={i} className={`border-b border-slate-200/60 pb-1.5 last:border-0 ${colorClass}`}>
                  {log}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 3: Auto-Mapping Graph (Col Span 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between min-h-[360px] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-650">
              <GitMerge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-850">Auto-Mapping Graph</h3>
              <p className="text-[10px] text-slate-400">Dynamic dependency relations mapping</p>
            </div>
          </div>

          {/* Dependency Node Design */}
          <div className="flex-1 flex items-center justify-center relative min-h-[160px]">
            {/* Center Node */}
            <button
              onClick={() => setActiveNode("case")}
              className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border transition-all z-20 cursor-pointer ${
                activeNode === "case"
                  ? "bg-indigo-650 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-110"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              <Scale className="w-6 h-6" />
              <span className="text-[8px] font-extrabold mt-1">Grievance</span>
            </button>

            {/* Orbit Node 1: Statute */}
            <button
              onClick={() => setActiveNode("statute")}
              className={`absolute top-2 left-6 w-12 h-12 rounded-full flex flex-col items-center justify-center border text-[8px] font-bold transition-all z-10 cursor-pointer ${
                activeNode === "statute"
                  ? "bg-purple-600 border-purple-550 text-white shadow-lg shadow-purple-650/20"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
              }`}
            >
              <Database className="w-4 h-4 mb-0.5" />
              Statutes
            </button>

            {/* Orbit Node 2: Remedy */}
            <button
              onClick={() => setActiveNode("remedy")}
              className={`absolute bottom-2 right-6 w-12 h-12 rounded-full flex flex-col items-center justify-center border text-[8px] font-bold transition-all z-10 cursor-pointer ${
                activeNode === "remedy"
                  ? "bg-pink-600 border-pink-550 text-white shadow-lg shadow-pink-650/20"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
              }`}
            >
              <FileCheck className="w-4 h-4 mb-0.5" />
              Remedies
            </button>

            {/* Orbit Node 3: Jurisdiction */}
            <button
              onClick={() => setActiveNode("jurisdiction")}
              className={`absolute bottom-6 left-12 w-12 h-12 rounded-full flex flex-col items-center justify-center border text-[8px] font-bold transition-all z-10 cursor-pointer ${
                activeNode === "jurisdiction"
                  ? "bg-amber-600 border-amber-550 text-white shadow-lg shadow-amber-650/20"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
              }`}
            >
              <Shield className="w-4 h-4 mb-0.5" />
              Jurisdict
            </button>
          </div>

          {/* Node Selected Info */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-[11px] text-slate-550 text-center min-h-[64px]">
            <span className="font-bold text-slate-800 block mb-0.5">{nodeInfo[activeNode].title}</span>
            {nodeInfo[activeNode].desc}
          </div>
        </div>

        {/* Panel 4: Drift Tracking (Col Span 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between min-h-[360px] space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-850">Draft Diff Engine</h3>
                <p className="text-[10px] text-slate-400">Translate raw grievance to formal demand Notice</p>
              </div>
            </div>
            <button
              onClick={() => setDiffOriginal(!diffOriginal)}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 text-xs font-bold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-650 transition-all cursor-pointer"
            >
              Simulate Notice Compile
            </button>
          </div>

          {/* Diff Box */}
          <div className="bg-slate-55 border border-slate-200 rounded-xl p-4 font-mono text-[10px] flex-1 flex flex-col justify-center min-h-[140px] space-y-2 leading-relaxed text-slate-700">
            <div className="text-slate-400 border-b border-slate-200/60 pb-1 flex items-center justify-between text-[9px]">
              <span>draft_notice.txt</span>
              <span className="text-indigo-600 font-semibold">DIFF ANALYSIS DETECTED</span>
            </div>
            
            {diffOriginal ? (
              <div className="space-y-1.5">
                <div className="bg-red-50 text-red-700 border-l-2 border-red-500 px-2 py-1 rounded">
                  - "i worked at webscale solutions pvt ltd, my director vijay shekhar did not pay my june 2026 salary Rs 1,80,000 after i left"
                </div>
                <div className="text-slate-400 px-2 italic">
                  {"// Mapping raw input parameters to legal notice clauses..."}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="bg-red-50/60 text-red-700/60 line-through px-2 py-0.5 rounded">
                  - "i worked at webscale solutions pvt ltd, my director vijay..."
                </div>
                <div className="bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500 px-2 py-1 rounded">
                  + "Under Section 15 of the Code on Wages, 2019, the Employee hereby issues this statutory demand notice requesting payment of Rs. 1,80,000 for the period ending June 30, 2026."
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export const Home: React.FC<HomeProps> = ({ onStart, language }) => {
  const isHindi = language.toLowerCase() === "hindi";
  const isHinglish = language.toLowerCase() === "hinglish";

  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. Hero fold wrapped in BackgroundPaths (Visible immediately, no scrolling background paths) */}
      <BackgroundPaths>
        <div className="max-w-4xl mx-auto space-y-6 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5 text-xs font-bold text-indigo-700 shadow-sm">
            <Award className="w-4 h-4 text-indigo-600 animate-pulse" />
            {isHindi 
              ? "एआई-संचालित कानूनी अधिकार सहायक" 
              : "AI-Powered Legal Rights Assistant"}
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none min-h-[2.5em] sm:min-h-[1.8em]">
            {isHindi ? (
              <>
                अपने{" "}
                <Typewriter 
                  sequences={[
                    { text: "कानूनी अधिकारों", deleteAfter: true },
                    { text: "उपभोक्ता अधिकारों", deleteAfter: true },
                    { text: "श्रम अधिकारों", deleteAfter: true },
                    { text: "किरायेदार अधिकारों", deleteAfter: true }
                  ]}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                />{" "}
                को जानें और सुरक्षित करें
              </>
            ) : isHinglish ? (
              <>
                Apne{" "}
                <Typewriter 
                  sequences={[
                    { text: "Legal Rights", deleteAfter: true },
                    { text: "Consumer Rights", deleteAfter: true },
                    { text: "Salary Rights", deleteAfter: true },
                    { text: "Rent Rights", deleteAfter: true }
                  ]}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                />{" "}
                Ko Jaanein Aur Protect Karein
              </>
            ) : (
              <>
                Understand and Protect Your{" "}
                <Typewriter 
                  sequences={[
                    { text: "Legal Rights", deleteAfter: true },
                    { text: "Consumer Rights", deleteAfter: true },
                    { text: "Employee Claims", deleteAfter: true },
                    { text: "Rental Deposits", deleteAfter: true }
                  ]}
                  className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                />
              </>
            )}
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            {isHindi 
              ? "लीगलएड भारतीय कानूनों (उपभोक्ता, श्रम और किरायेदार अधिकारों) को समझने और सेकंडों में सत्यापित कानूनी नोटिस का मसौदा तैयार करने में मदद करता है।"
              : isHinglish 
              ? "LegalAid aapko Indian Laws (Consumer, Labour, Tenant Rights) samajhne aur seconds me verified legal notices draft karne me help karta hai." 
              : "LegalAid helps everyday citizens navigate Indian statutory rights for consumer disputes, wage claims, and rental deposit refunds, with verified citations and professional PDF notice drafts."}
          </p>

          <div className="flex justify-center pt-4">
            <button
              onClick={onStart}
              className="flex items-center py-4 px-10 rounded-xl text-white font-extrabold text-lg bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-200 cursor-pointer gap-2"
            >
              <Scale className="w-5 h-5" />
              {isHindi ? "नया केस शुरू करें" : isHinglish ? "Naya Case Start Karein" : "Get Started Now"}
            </button>
          </div>
        </div>
      </BackgroundPaths>

      {/* 2. Content below the fold (Static background, no SVG line clutter during scroll) */}
      <div className="bg-white py-16 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          
          {/* Section A: How It Works - Replaced the boring cards with the LegalIntelligenceDashboard */}
          <div className="space-y-4">
            <LegalIntelligenceDashboard />
          </div>

          {/* Section B: Supported Disputes Carousel */}
          <CategoryCarousel onStart={onStart} isHindi={isHindi} />

        </div>
      </div>

      {/* Section C: FAQ Accordion Section with WisprFlow rotating behind */}
      <div className="relative bg-slate-50 py-16 border-b border-slate-200 overflow-hidden">
        {/* Animated text flow background */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none flex items-center justify-center">
          <WisprFlow />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
            
            {/* Left Column */}
            <div className="md:col-span-5 space-y-6 text-left">
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Your questions,<br />answered.
              </h2>
              <p className="text-slate-500 text-sm">
                Didn't find the answer to your question?
              </p>
              <button
                onClick={onStart}
                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white font-extrabold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Ask us anything
              </button>
            </div>

            {/* Right Column */}
            <div className="md:col-span-7 space-y-4 text-left">
              {[
                {
                  q: "What is LegalAid AI, and how can it help me?",
                  a: "LegalAid is an automated legal rights assistant. It analyzes your grievance description, maps it to applicable Indian statutory codes, highlights your legal protections, and drafts a professional demand notice PDF."
                },
                {
                  q: "What laws and statutory rights are supported?",
                  a: "We support Consumer disputes (Consumer Protection Act 2019), Employee claims (Code on Wages 2019), and Landlord-Tenant issues (Model Tenancy Act). Every reference is verified against local bare-acts."
                },
                {
                  q: "Is the generated notice legally binding?",
                  a: "The document generated is a formal Demand Notice template. While it formats your facts and retrieved citations professionally, we strongly advise consulting an advocate before formal dispatch."
                },
                {
                  q: "How does bilingual and Hinglish translation work?",
                  a: "You can submit case queries in English, Hindi, or Hinglish. If Hindi is selected, our system compiles the notice into professional Hindi while preserving standard Act titles in English to retain legal validity."
                }
              ].map((f, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors text-sm cursor-pointer gap-4"
                  >
                    <span>{f.q}</span>
                    <div className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                      {openFaq === idx ? (
                        <span className="text-slate-500 text-xs font-bold leading-none">-</span>
                      ) : (
                        <span className="text-slate-500 text-xs font-bold leading-none">+</span>
                      )}
                    </div>
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-500 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {f.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Light-mode Premium Footer replacing the yellow disclaimer box */}
      <footer className="bg-slate-50 border-t border-slate-200 py-16 px-6 text-left">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Big Headline */}
          <div className="border-b border-slate-200 pb-8 text-center sm:text-left">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Know Your Rights. <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Assert Your Claims.</span>
            </h2>
          </div>

          {/* 5-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 text-xs font-semibold text-slate-505">
            
            {/* Column 1: Logo & Description */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <span className="font-extrabold text-base text-slate-800 tracking-tight">LegalAId</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
                AI-powered statutory analysis assistant for first-generation litigants in India. Simplify parameter extraction, verify provisions, and compile notice drafts instantly.
              </p>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-3">
              <h4 className="text-slate-800 text-xs font-bold uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 font-medium">
                <li><button onClick={onStart} className="hover:text-indigo-600 transition-colors text-left cursor-pointer">Grievance Intake</button></li>
                <li><span className="text-slate-400">Statute Mapping</span></li>
                <li><span className="text-slate-400">Chronology Audit</span></li>
                <li><span className="text-slate-400">Notice Editor</span></li>
                <li><span className="text-slate-400">PDF Compiler</span></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="space-y-3">
              <h4 className="text-slate-800 text-xs font-bold uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 font-medium">
                <li><a href="https://www.indiacode.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">India Code Bare-Acts</a></li>
                <li><a href="https://edaakhil.nic.in" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">e-Daakhil Portal</a></li>
                <li><span className="text-slate-400">CPA 2019 Rules</span></li>
                <li><span className="text-slate-400">Wage Code 2019</span></li>
                <li><span className="text-slate-400">Model Tenancy Act</span></li>
              </ul>
            </div>

            {/* Column 4: Legal Info */}
            <div className="space-y-3">
              <h4 className="text-slate-800 text-xs font-bold uppercase tracking-wider">Legal Info</h4>
              <ul className="space-y-2 font-medium">
                <li><span className="text-slate-400">Terms of Service</span></li>
                <li><span className="text-slate-400">Privacy Policy</span></li>
                <li><span className="text-slate-400">Cookie Policy</span></li>
                <li><span className="text-slate-400">Legal Advocate Directory</span></li>
              </ul>
            </div>

            {/* Column 5: Social Connections */}
            <div className="space-y-3">
              <h4 className="text-slate-800 text-xs font-bold uppercase tracking-wider">Social Connection</h4>
              <ul className="space-y-2.5 font-medium">
                <li>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                    <svg className="w-4 h-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                    <svg className="w-4 h-4 shrink-0 text-indigo-650" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                    LinkedIn
                  </a>
                </li>
                <li>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                    <svg className="w-4 h-4 shrink-0 text-sky-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                    Twitter
                  </a>
                </li>
                <li>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
                    <svg className="w-4 h-4 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" /><polygon points="10 15 15 12 10 9" /></svg>
                    YouTube
                  </a>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Row: Small print disclaimer and copyright */}
          <div className="border-t border-slate-200 pt-8 space-y-4">
            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
              <span className="font-bold text-slate-500">MANDATORY GENERAL LEGAL DISCLAIMER:</span> LegalAid is an automated information assistant designed for informational and educational use only. It does not constitute formal legal advice, represent you, or act as an advocate/advocate service. Always consult a certified lawyer or bar council advocate before initiating formal legal actions or serving notices in court.
            </p>
            <p className="text-[10px] text-slate-400 text-center sm:text-left">
              © 2026 LegalAId Project. All rights reserved. Strictly subject to statutory verification under the India Code.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
};
export default Home;
