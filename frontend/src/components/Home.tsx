import React, { useState, useEffect, useRef } from "react";
import { Scale, Award, HelpCircle, Shield, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
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

// Inline Typewriter component using framer-motion matching Kokonut UI Typewriter behavior
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
          
          {/* Section A: How It Works */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {isHindi ? "यह कैसे काम करता है" : "How LegalAid Works"}
              </h2>
              <p className="text-slate-500 text-sm max-w-lg mx-auto">
                {isHindi 
                  ? "सरल 4-चरणों की प्रक्रिया जिसके माध्यम से आप कानूनी विश्लेषण और दस्तावेज प्राप्त कर सकते हैं।" 
                  : "A simple 4-step process designed to analyze your grievance, verify laws, and generate formal notices."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: isHindi ? "समस्या बताएं" : "Describe Problem",
                  desc: isHindi ? "अपनी समस्या हिंदी, अंग्रेजी या हिंग्लिश में टाइप करें।" : "Type your consumer, labor, or tenant issue in plain language."
                },
                {
                  step: "02",
                  title: isHindi ? "तथ्य सत्यापन" : "Verify Facts",
                  desc: isHindi ? "एआई तारीख, स्थान और विवाद राशि का मिलान और सत्यापन करता है।" : "AI extracts parameters and prompts for any missing info or contradictions."
                },
                {
                  step: "03",
                  title: isHindi ? "अधिकार और नियम" : "Statute Mapping",
                  desc: isHindi ? "Retrieved sections are verified against official Indian bare acts." : "Retrieves and validates sections from Indian laws, filtering out false references."
                },
                {
                  step: "04",
                  title: isHindi ? "नोटिस डाउनलोड" : "Export Notice",
                  desc: isHindi ? "दस्तावेज संपादित करें और प्रिंट-तैयार PDF डाउनलोड करें।" : "Edit the structured demand draft and export a print-ready Hindi/English PDF."
                }
              ].map((s, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 relative hover:border-indigo-300 transition-colors">
                  <span className="text-2xl font-black text-indigo-200 block">{s.step}</span>
                  <h4 className="text-sm font-bold text-slate-800">{s.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
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
                <p className="text-xs text-slate-500 leading-relaxed">
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
