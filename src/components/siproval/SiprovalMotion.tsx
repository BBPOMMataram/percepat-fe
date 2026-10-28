"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

export const SIPROVAL_EASE: [number, number, number, number] = [
  0.215, 0.61, 0.355, 1,
];
export const SIPROVAL_SNAPPY_EASE: [number, number, number, number] = [
  0.625, 0.05, 0, 1,
];

/**
 * Character-by-character vertical wave text on hover
 */
export function SiprovalWaveText({
  text,
  hovered,
  staggerStep = 0.006,
  className = "",
}: {
  text: string;
  hovered: boolean;
  staggerStep?: number;
  className?: string;
}) {
  return (
    <span
      aria-label={text}
      className={`relative inline-block overflow-hidden leading-[1.22] align-middle ${className}`}
    >
      {Array.from(text).map((char, idx) => (
        <span
          key={idx}
          aria-hidden="true"
          style={{
            display: "inline-block",
            position: "relative",
            whiteSpace: char === " " ? "pre" : "normal",
            textShadow: "0px 1.3em currentColor",
            transform: hovered
              ? "translateY(-1.3em) rotate(0.001deg)"
              : "translateY(0em) rotate(0.001deg)",
            transition: "transform 0.55s cubic-bezier(0.625, 0.05, 0, 1)",
            transitionDelay: `${idx * staggerStep}s`,
            willChange: "transform",
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

/**
 * Double-arrow icon that slides smoothly on hover
 */
export function SiprovalSlidingArrow({
  hovered,
  direction = "right",
  className = "",
}: {
  hovered: boolean;
  direction?: "right" | "up" | "external";
  className?: string;
}) {
  if (direction === "up") {
    return (
      <span
        className={`relative inline-flex size-[1.15em] items-center justify-center overflow-hidden ${className}`}
      >
        <span
          className="flex flex-col h-max w-full"
          style={{
            transform: hovered ? "translateY(-50%)" : "translateY(0%)",
            transition: "transform 0.5s cubic-bezier(0.625, 0.05, 0, 1)",
            willChange: "transform",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[1.15em] shrink-0"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[1.15em] shrink-0"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </span>
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex size-[1.18em] items-center justify-start overflow-hidden ${className}`}
    >
      <span
        className="flex h-full w-max items-center"
        style={{
          transform: hovered ? "translateX(0%)" : "translateX(-50%)",
          transition: "transform 0.5s cubic-bezier(0.625, 0.05, 0, 1)",
          willChange: "transform",
        }}
      >
        {[0, 1].map((i) => (
          <svg
            key={i}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[1.18em] flex-none"
            aria-hidden="true"
          >
            {direction === "external" ? (
              <>
                <path d="M7 17L17 7" />
                <path d="M7 7h10v10" />
              </>
            ) : (
              <>
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </>
            )}
          </svg>
        ))}
      </span>
    </span>
  );
}

/**
 * Navigation Link with character wave + origin-switching underline
 */
export function SiprovalNavLink({
  href,
  label,
  className = "",
  onClick,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative inline-flex items-center gap-1.5 py-1 no-underline transition-colors duration-500 ease-[cubic-bezier(0.625,0.05,0,1)] ${className}`}
    >
      <span className="relative inline-block w-fit">
        <SiprovalWaveText text={label} hovered={hovered} staggerStep={0.005} />
        <span
          aria-hidden="true"
          className="absolute left-0 -bottom-0.5 w-full bg-current"
          style={{
            height: "1.5px",
            transform: `scaleX(${hovered ? 1 : 0})`,
            transformOrigin: hovered ? "left center" : "right center",
            transition: "transform 0.5s cubic-bezier(0.625, 0.05, 0, 1)",
          }}
        />
      </span>
    </a>
  );
}

/**
 * Pill Button (supports Next Link or anchor) with character wave + sliding double arrow
 */
export function SiprovalPillButton({
  href,
  label,
  external = false,
  download,
  useNextLink = false,
  showArrow = true,
  arrowDirection = "right",
  className = "",
  onClick,
}: {
  href: string;
  label: string;
  external?: boolean;
  download?: string | boolean;
  useNextLink?: boolean;
  showArrow?: boolean;
  arrowDirection?: "right" | "up" | "external";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const content = (
    <>
      <SiprovalWaveText text={label} hovered={hovered} staggerStep={0.006} />
      {showArrow && (
        <SiprovalSlidingArrow hovered={hovered} direction={arrowDirection} />
      )}
    </>
  );

  const sharedClassName = `group relative inline-flex items-center justify-center gap-2.5 rounded-full no-underline transition-all duration-500 ease-[cubic-bezier(0.625,0.05,0,1)] cursor-pointer select-none ${className}`;

  if (useNextLink) {
    return (
      <Link
        href={href}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={sharedClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      download={download}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={sharedClassName}
    >
      {content}
    </a>
  );
}

/**
 * Scroll-triggered FadeUp reveal
 */
export function SiprovalFadeUp({
  children,
  delay = 0,
  y = 36,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.85,
        delay,
        ease: SIPROVAL_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll-triggered horizontal line draw (left -> right)
 */
export function SiprovalLineDraw({
  className = "bg-slate-200",
  delay = 0.1,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 1.05,
        delay,
        ease: SIPROVAL_EASE,
      }}
      style={{ transformOrigin: "left center" }}
      className={`h-px w-full ${className}`}
    />
  );
}

function ScrubWord({
  word,
  progress,
  range,
  highlight,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  highlight?: boolean;
}) {
  const opacity = useTransform(progress, range, [0.22, 1]);
  const y = useTransform(progress, range, [6, 0]);

  return (
    <motion.span
      style={{ opacity, y }}
      className={`inline-block mr-[0.28em] transition-colors ${
        highlight ? "text-[#005baa]" : "text-[#001d3d]"
      }`}
    >
      {word}
    </motion.span>
  );
}

/**
 * Scroll-Scrubbed Word-by-Word Statement Bridge
 */
export function SiprovalWordScrub({
  text,
  highlightWords = [],
  badge = "Ekosistem Kinerja Terpadu",
}: {
  text: string;
  highlightWords?: string[];
  badge?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 85%", "end 45%"],
  });

  const words = text.split(" ");
  const highlightSet = new Set(highlightWords.map((w) => w.toLowerCase()));

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-white py-14 sm:py-20 px-6 sm:px-10 lg:px-16 overflow-hidden"
    >
      <div className="max-w-5xl mx-auto text-center">
        <SiprovalFadeUp y={20}>
          <span className="inline-block text-[11px] font-bold uppercase tracking-[0.22em] text-[#005baa] bg-[#005baa]/8 px-4 py-1.5 rounded-full mb-6">
            {badge}
          </span>
        </SiprovalFadeUp>

        <p className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-bold leading-[1.32] tracking-[-0.025em]">
          {words.map((word, i) => {
            const start = i / words.length;
            const end = Math.min(1, start + 1.6 / words.length);
            const cleanWord = word.replace(/[.,]/g, "").toLowerCase();
            return (
              <ScrubWord
                key={`${word}-${i}`}
                word={word}
                progress={scrollYProgress}
                range={[start, end]}
                highlight={highlightSet.has(cleanWord)}
              />
            );
          })}
        </p>
      </div>
    </div>
  );
}

export function SiprovalSpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(92, 160, 219, 0.28)",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 44, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{
        duration: 0.85,
        delay,
        ease: SIPROVAL_EASE,
      }}
      whileHover={{ y: -6 }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        handleMouseMove(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden ${className}`}
    >
      {/* Cursor-Following Radial Spotlight Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(320px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 75%)`,
        }}
      />
      <div className="relative z-10 flex h-full flex-col justify-between">
        {children}
      </div>
    </motion.div>
  );
}
