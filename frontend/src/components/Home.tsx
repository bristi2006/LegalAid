import React, { useState, useEffect, useRef } from "react";
import { Scale, Award, HelpCircle, Shield, Briefcase, ChevronDown, ChevronUp, Play, Pause, RefreshCw, Database, GitMerge, FileCheck } from "lucide-react";
import { BackgroundPaths } from "./BackgroundPaths";
import { motion } from "framer-motion";

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

          {/* Section B: Supported Disputes Grid */}
          <div className="space-y-8 pt-4">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isHindi ? "समर्थित कानूनी श्रेणियां" : "Supported Legal Categories"}
              </h2>
              <p className="text-slate-500 text-sm max-w-lg mx-auto">
                Our platform specializes in three core civil domains under Indian statutes:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Category 1: Consumer */}
              <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow space-y-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl w-max">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Consumer Protection</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Navigates disputes under the **Consumer Protection Act, 2019**:
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                  <li>Defective products or manufacturing faults</li>
                  <li>Refusal or delay of eligible product refunds</li>
                  <li>Overcharging above MRP or hidden service charges</li>
                  <li>Misleading advertising or services deficiencies</li>
                </ul>
              </div>

              {/* Category 2: Labour */}
              <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow space-y-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl w-max">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Employee Rights</h3>
                <p className="text-xs text-slate-555 leading-relaxed">
                  Navigates labor disputes under the new **Code on Wages, 2019**:
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                  <li>Unpaid salary, final settlements, or holding wages</li>
                  <li>Unpaid overtime hours or unlawful salary cuts</li>
                  <li>Resignation and notice period disputes</li>
                  <li>Recovery of bonus payments</li>
                </ul>
              </div>

              {/* Category 3: Tenant */}
              <div className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow space-y-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl w-max">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Tenant & Rental</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Resolves rental disputes mapped to the **Model Tenancy Act**:
                </p>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                  <li>Landlord refusing to return security deposits</li>
                  <li>Notice period and eviction timeline disagreements</li>
                  <li>Refusal to perform necessary structural repairs</li>
                  <li>Rent hike or lease agreement terms</li>
                </ul>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Section C: FAQ Accordion Section */}
      <div className="bg-slate-50 py-16 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-2">
              <HelpCircle className="w-8 h-8 text-indigo-600" />
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 text-sm">
              Common questions about LegalAid's scope and legal validity.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              {
                q: "Is the generated notice legally binding?",
                a: "The notice generated is a formal Demand Letter / Legal Notice draft. While it formats the facts and applicable laws professionally, it should be reviewed by an advocate before signing and official dispatch to ensure maximum legal validity."
              },
              {
                q: "What states and jurisdictions are supported?",
                a: "LegalAid supports all states in India. For issues where state-specific laws differ (like Shops & Establishments rules or local rent controls), the intake wizard prompts you for your location and incorporates local rules."
              },
              {
                q: "How does bilingual/Hinglish translation work?",
                a: "You can explain your problem in Hindi, Hinglish, or English. The backend AI analyzes the text, identifies the legal criteria, and renders the notice. If you select Hindi, the draft notice is translated to professional Hindi, keeping core act titles and sections in English to maintain legal validity."
              }
            ].map((f, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors text-sm cursor-pointer"
                >
                  <span>{f.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
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

      {/* Safety Notice Footer Card */}
      <div className="bg-white py-10 text-center">
        <div className="max-w-xl mx-auto px-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[10px] text-amber-800 leading-relaxed text-left">
            <span className="font-bold">GENERAL LEGAL DISCLAIMER:</span> LegalAid is an automated information assistant. It does not provide legal advice, represent you, or constitute a certified advocate service. Always consult a lawyer before taking formal legal actions in court.
          </div>
          <p className="text-[10px] text-slate-400">© 2026 LegalAId Project. All rights reserved.</p>
        </div>
      </div>

    </div>
  );
};
export default Home;
