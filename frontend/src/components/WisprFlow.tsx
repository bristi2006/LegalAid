import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const LEGAL_FLOW_TEXT =
  "LegalAid helps you understand and protect your statutory rights under Indian Laws. • Draft professional legal notice PDFs in seconds. • Map consumer complaints under CPA 2019, recover unpaid salaries under Wage Code 2019, and retrieve tenant security deposits under Model Tenancy guidelines. • Bilingual English, Hindi, and Hinglish processing pipeline active. • Click 'Get Started Now' to analyze your grievance and claim your remedies today. • ";

const VIEW_W = 1048;
const VIEW_H = 594;

type Point = { x: number; y: number };
type Cubic = { p0: Point; p1: Point; p2: Point; p3: Point };
type Segment = { c1: Point; c2: Point; end: Point };
type PathState = { start: Point; segments: Segment[] };

const round = (n: number) => Math.round(n * 1000) / 1000;
const rp = (p: Point): Point => ({ x: round(p.x), y: round(p.y) });
const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

const ORIGINAL_SEGMENTS: Cubic[] = [
  {
    p0: { x: 0.597656, y: 50.924805 },
    p1: { x: 17.4612, y: 143.2965 },
    p2: { x: 97.8522, y: 293.141 },
    p3: { x: 284.508, y: 353.548 },
  },
  {
    p0: { x: 284.508, y: 353.548 },
    p1: { x: 440.828, y: 399.056 },
    p2: { x: 583.839, y: 294.067 },
    p3: { x: 500.618, y: 184.7492 },
  },
  {
    p0: { x: 500.618, y: 184.7492 },
    p1: { x: 417.397, y: 75.4309 },
    p2: { x: 238.217, y: 282.098 },
    p3: { x: 499.258, y: 441.668 },
  },
  {
    p0: { x: 499.258, y: 441.668 },
    p1: { x: 551.913, y: 477.802 },
    p2: { x: 817.468, y: 561.26 },
    p3: { x: 1046.43, y: 565.235 },
  },
];

const SPLITS_PER_SEGMENT = 2;

function splitCubic(b: Cubic, t: number): { left: Cubic; right: Cubic } {
  const a1 = lerp(b.p0, b.p1, t);
  const a2 = lerp(b.p1, b.p2, t);
  const a3 = lerp(b.p2, b.p3, t);
  const b1 = lerp(a1, a2, t);
  const b2 = lerp(a2, a3, t);
  const mid = lerp(b1, b2, t);
  return {
    left: { p0: b.p0, p1: a1, p2: b1, p3: mid },
    right: { p0: mid, p1: b2, p2: a3, p3: b.p3 },
  };
}

function subCubic(b: Cubic, t0: number, t1: number): Cubic {
  const right = splitCubic(b, t0).right;
  const t = (t1 - t0) / (1 - t0);
  return splitCubic(right, t).left;
}

const DEFAULT_PATH: PathState = {
  start: rp(ORIGINAL_SEGMENTS[0].p0),
  segments: ORIGINAL_SEGMENTS.flatMap((cubic) => {
    const segs: Segment[] = [];
    for (let i = 0; i < SPLITS_PER_SEGMENT; i++) {
      const sub = subCubic(
        cubic,
        i / SPLITS_PER_SEGMENT,
        (i + 1) / SPLITS_PER_SEGMENT,
      );
      segs.push({ c1: rp(sub.p1), c2: rp(sub.p2), end: rp(sub.p3) });
    }
    return segs;
  }),
};

function toPathD({ start, segments }: PathState): string {
  let d = `M${round(start.x)} ${round(start.y)}`;
  for (const s of segments) {
    d += `C${round(s.c1.x)} ${round(s.c1.y)} ${round(s.c2.x)} ${round(s.c2.y)} ${round(s.end.x)} ${round(s.end.y)}`;
  }
  return d;
}

export interface WisprFlowProps {
  speed?: number;
  fontSize?: number;
  textOpacity?: number;
  textColor?: string;
  strokeColor?: string;
}

export const WisprFlow = ({
  speed = 12, // Tuned for optimal readable velocity
  fontSize = 13,
  textOpacity = 0.5,
  textColor = "#6366f1", // Premium Indigo text
  strokeColor = "rgba(99, 102, 241, 0.15)", // Subtle glowing curve guide
}: WisprFlowProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [path] = useState<PathState>(DEFAULT_PATH);

  const d = useMemo(() => toPathD(path), [path]);

  // Duplicate text 4 times to loop seamlessly without spacing cuts
  const duplicatedText = useMemo(() => LEGAL_FLOW_TEXT.repeat(4), []);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
      <svg
        ref={svgRef}
        id="hero-svg"
        className="w-full h-full min-w-[1048px]"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          id="first-curve"
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={1.5}
          d={d}
        />

        <text style={{ fontSize }} className="font-semibold tracking-tight">
          <motion.textPath
            href="#first-curve"
            className="[baseline-shift:-20%]"
            style={{ fill: textColor, opacity: textOpacity }}
            animate={{ startOffset: ["0%", "-100%"] }}
            transition={{
              duration: 80 - speed,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {duplicatedText}
          </motion.textPath>
        </text>
      </svg>
    </div>
  );
};

export default WisprFlow;
