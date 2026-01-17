'use client';

import { useRef, memo } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from 'framer-motion';
import { OrbitingCircles } from '@/components/ui/orbiting-circles';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* -------------------------------------------------------------------------- */
/* Utils                                                                       */
/* -------------------------------------------------------------------------- */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */
export default function HeroCircle() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth base motion (performance)
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  // Cinematic punch (visual drama)
  const cinematic = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 22,
    mass: 0.25,
  });

  return (
    <main className="bg-black text-white">
      <div ref={containerRef} className="relative h-[500vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center [perspective:1400px]">
          <RingBackground progress={smooth} cinematic={cinematic} />
          <TextSequence progress={cinematic} />
        </div>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Ring Background                                                             */
/* -------------------------------------------------------------------------- */
const RingBackground = memo(function RingBackground({
  progress,
  cinematic,
}: {
  progress: MotionValue<number>;
  cinematic: MotionValue<number>;
}) {
  // Split scaling = depth without lag
  const outerScale = useTransform(cinematic, [0, 0.6], [1.3, 6]);
  const innerScale = useTransform(cinematic, [0, 0.6], [1.3, 10]);
  const rotateX = useTransform(cinematic, [0, 0.5], [0, -12]);
  const opacity = useTransform(progress, [0.75, 0.9], [1, 0]);

  return (
    <motion.div
      style={{ scale: outerScale, opacity }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none will-change-transform"
    >
      <motion.div
        style={{ scale: innerScale, rotateX }}
        className="relative flex h-[800px] w-[800px] items-center justify-center origin-center"
      >
        {/* Core */}
        <div className="absolute w-[240px] h-[240px] rounded-full bg-[#0a0a0a] z-10" />

        {/* Vibrant rings (original vibe) */}
        <Ring size={340} border={26} className="border-purple-600/90 shadow-[0_0_30px_rgba(147,51,234,0.35)]" />
        <OrbitingCircles radius={170} duration={30}>
          <Avatar img="1.jpg" />
        </OrbitingCircles>

        <Ring size={460} border={34} className="border-blue-500/90 shadow-[0_0_30px_rgba(59,130,246,0.35)]" />
        <OrbitingCircles radius={230} duration={40} reverse>
          <Avatar img="2.jpg" />
        </OrbitingCircles>

        <Ring size={600} border={38} className="border-green-400/90 shadow-[0_0_30px_rgba(74,222,128,0.35)]" />
        <OrbitingCircles radius={300} duration={50}>
          <Avatar img="3.jpg" />
        </OrbitingCircles>

        <Ring size={760} border={35} className="border-yellow-400/90 shadow-[0_0_30px_rgba(250,204,21,0.35)]" />
        <OrbitingCircles radius={380} duration={60} reverse>
          <Avatar img="4.jpg" />
        </OrbitingCircles>

        <Ring size={950} border={40} className="border-rose-500/90 shadow-[0_0_30px_rgba(244,63,94,0.35)]" />
      </motion.div>
    </motion.div>
  );
});

/* -------------------------------------------------------------------------- */
/* Ring                                                                        */
/* -------------------------------------------------------------------------- */
function Ring({
  size,
  border,
  className,
}: {
  size: number;
  border: number;
  className: string;
}) {
  return (
    <div
      className={cn('absolute rounded-full', className)}
      style={{
        width: size,
        height: size,
        borderWidth: border,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                      */
/* -------------------------------------------------------------------------- */
function Avatar({ img }: { img: string }) {
  return (
    <div className="absolute w-12 h-12 rounded-full overflow-hidden border-2 border-black shadow-lg bg-gray-200">
      <img src={img} alt="user" className="w-full h-full object-cover" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Text Sequence                                                               */
/* -------------------------------------------------------------------------- */
const TextSequence = memo(function TextSequence({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const opacity1 = useTransform(progress, [0, 0.15], [1, 0]);
  const scale1 = useTransform(progress, [0, 0.15], [1, 1.6]);

  const opacity2 = useTransform(progress, [0.15, 0.25, 0.35], [0, 1, 0]);
  const y2 = useTransform(progress, [0.15, 0.25, 0.35], [60, 0, -60]);

  const opacity3 = useTransform(progress, [0.4, 0.5, 0.6], [0, 1, 0]);
  const y3 = useTransform(progress, [0.4, 0.5, 0.6], [60, 0, -60]);

  const opacity4 = useTransform(progress, [0.65, 0.8], [0, 1]);
  const scale4 = useTransform(progress, [0.65, 0.8], [0.9, 1]);

  return (
    <div className="relative z-20 flex items-center justify-center text-center w-full max-w-5xl px-4 pointer-events-none">
      <motion.div
        style={{ opacity: opacity1, scale: scale1 }}
        className="absolute text-shadow-[0_0_40px_rgba(255,255,255,0.25)]"
      >
        <h1 className="text-8xl font-bold mb-2">JanMitra</h1>
        <p className="text-xl text-gray-400">Sabka Sath Sabka Vikaas</p>
      </motion.div>

      <motion.div style={{ opacity: opacity2, y: y2 }} className="absolute">
        <h2 className="text-6xl font-bold">
          Schemes exist. <br />
          Support exists.
          <br />
          <span className="text-gray-500">Awareness doesn’t.</span>
        </h2>
      </motion.div>

      <motion.div style={{ opacity: opacity3, y: y3 }} className="absolute">
        <h2 className="text-6xl font-bold">
          Millions struggle not because help is unavailable
          <br />
          <span className="text-gray-500">
            but because information isn’t accessible.
          </span>
        </h2>
      </motion.div>

      <motion.div
        style={{ opacity: opacity4, scale: scale4 }}
        className="absolute top-[-10vh]"
      >
        <h2 className="text-5xl md:text-7xl font-bold leading-tight">
          JanMitra exists<br />
          to change that.
        </h2>
      </motion.div>
    </div>
  );
});