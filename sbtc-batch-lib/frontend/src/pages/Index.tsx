import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import { WalletModal } from "@/components/WalletModal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Users, ShieldCheck, TrendingUp, Layers, CreditCard, Building2, Rocket, ChevronRight, FileText, Upload, CheckCircle2, Wallet } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";


const features = [
  {
    icon: Zap,
    title: "95% Gas Savings",
    description: "Batch hundreds of transfers into a single transaction, dramatically cutting network fees.",
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold/20",
    metric: "95% avg reduction",
    metricColor: "text-gold",
    metricBg: "bg-gold/10",
  },
  {
    icon: Users,
    title: "200 Max Recipients",
    description: "Send sBTC to up to 200 addresses simultaneously in a single atomic transaction.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    metric: "Up to 200 in 1 tx",
    metricColor: "text-primary",
    metricBg: "bg-primary/10",
  },
  {
    icon: ShieldCheck,
    title: "Real-Time Validation",
    description: "Every address is validated instantly. Catch errors before broadcasting to the network.",
    color: "text-emerald-400",
    bg: "bg-emerald/10",
    border: "border-emerald/20",
    metric: "<50ms check time",
    metricColor: "text-emerald-400",
    metricBg: "bg-emerald/10",
  },
];

const useCases = [
  {
    icon: CreditCard,
    title: "Payroll",
    description: "Pay your entire team in sBTC with one click. No manual transfers, no wasted fees.",
    iconColor: "text-gold",
    iconBg: "bg-gold/10",
    iconBorder: "border-gold/20",
  },
  {
    icon: Rocket,
    title: "Token Airdrops",
    description: "Distribute sBTC to thousands of community members efficiently and precisely.",
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    iconBorder: "border-primary/20",
  },
  {
    icon: Building2,
    title: "Treasury Management",
    description: "Manage multi-party treasury distributions with full audit trails.",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald/10",
    iconBorder: "border-emerald/20",
  },
];

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Add Recipients",
    description: "Paste addresses manually or upload a CSV file with amounts. Mix and match however you like.",
  },
  {
    number: "02",
    icon: CheckCircle2,
    title: "Validate & Preview",
    description: "Every address is checked in real-time. Review fee estimates and the full batch summary before committing.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Execute",
    description: "One atomic transaction broadcasts all payments simultaneously. Confirmations appear as they arrive.",
  },
];

const proofStats = [
  { value: "12,847", label: "Batches Sent",     color: "bg-primary",     target: 12847, suffix: "",  decimals: 0, locale: true  },
  { value: "2.4B",   label: "Sats Transferred", color: "bg-gold",        target: 2.4,   suffix: "B", decimals: 1, locale: false },
  { value: "98.4%",  label: "Success Rate",     color: "bg-emerald-400", target: 98.4,  suffix: "%", decimals: 1, locale: false },
  { value: "0",      label: "Failed Txs",       color: "bg-emerald-400", target: 0,     suffix: "",  decimals: 0, locale: false },
  { value: "41",     label: "Avg Recipients",   color: "bg-primary",     target: 41,    suffix: "",  decimals: 0, locale: false },
];

type ProofStat = typeof proofStats[number];

function AnimatedStat({ stat, shouldStart, delay }: { stat: ProofStat; shouldStart: boolean; delay: number }) {
  const count = useCountUp(stat.target, 1200, shouldStart, delay);
  const formatted = stat.locale
    ? Math.round(count).toLocaleString()
    : stat.decimals > 0
    ? count.toFixed(stat.decimals)
    : String(Math.round(count));
  return (
    <span className="font-mono text-2xl font-bold text-foreground">
      {formatted}{stat.suffix}
    </span>
  );
}

const DEMO_RECIPIENTS = [
  { full: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ", sats: 500_000 },
  { full: "SP3GWX3NE4QH1Q1K1K2J2N8KNJV8K4Q2XQNKNJV",  sats: 250_000 },
  { full: "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28JS8K",   sats: 750_000 },
  { full: "SP2Z1KBKF8TVTMVF6NJRCE9NYBCEF3RGJKM6X4N",  sats: 180_000 },
  { full: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5XWH", sats: 320_000 },
  { full: "SP1WKX7HM6NHYJB3AM7RZ9E2HMBPHKXFBXEYX6GW", sats: 420_000 },
  { full: "SP2QVF4JNXJR5QFPXNH2Z6M0JXGQT4RXKQ5KW9V",  sats: 610_000 },
  { full: "SP3N4J8BRVQEH5YPXXKZQ9H2M4GX3G4F8JCDB6XV", sats: 290_000 },
] as const;

// The truncated display form for each address (14 chars visible)
const truncAddr = (full: string) => `${full.slice(0, 8)}...${full.slice(-4)}`;
// Total chars to type per address
const TYPED_LEN = (full: string) => truncAddr(full).length; // e.g. 15

// Max rows visible at once before "+N more" appears
const MAX_VISIBLE = 3;
// Total "batch" = all 8 addresses
const TOTAL_RECIPIENTS = DEMO_RECIPIENTS.length + 33; // 41 total (matches batch copy)

function FloatingDemoCard() {
  // visibleCount: how many rows are currently showing (0 → MAX_VISIBLE)
  const [visibleCount, setVisibleCount] = useState(0);
  // typedLengths[i]: how many chars of address i have been typed so far
  const [typedLengths, setTypedLengths] = useState<number[]>([0, 0, 0]);
  // displaySats: animated running total
  const [displaySats, setDisplaySats] = useState(0);
  // phase: controls the state machine
  const [phase, setPhase] = useState<"adding" | "pausing" | "modal" | "resetting">("adding");
  // showMore: shows the "+ N more recipients" row
  const [showMore, setShowMore] = useState(false);
  // modal phase state
  const [modalStep, setModalStep] = useState(-1);
  const [modalDone, setModalDone] = useState(false);

  const targetSatsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate displaySats toward a new target with easeOutCubic
  const animateSats = (from: number, to: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();
    const duration = 350;
    const step = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplaySats(Math.round(from + (to - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  // Typewriter for a single row: fires every 35ms
  const startTypewriter = (rowIndex: number) => {
    const recipient = DEMO_RECIPIENTS[rowIndex];
    const maxLen = TYPED_LEN(recipient.full);
    let charCount = 0;
    const iv = setInterval(() => {
      charCount++;
      setTypedLengths(prev => {
        const next = [...prev];
        next[rowIndex] = charCount;
        return next;
      });
      if (charCount >= maxLen) clearInterval(iv);
    }, 35);
  };

  // Main state machine
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    if (phase === "adding") {
      if (visibleCount < MAX_VISIBLE) {
        // Schedule the next recipient reveal
        timers.push(setTimeout(() => {
          const nextIndex = visibleCount;
          const prevSats = targetSatsRef.current;
          const newSats = prevSats + DEMO_RECIPIENTS[nextIndex].sats;
          targetSatsRef.current = newSats;

          setVisibleCount(v => v + 1);
          startTypewriter(nextIndex);
          animateSats(prevSats, newSats);
        }, visibleCount === 0 ? 600 : 800));
      } else {
        // All MAX_VISIBLE rows shown — pause then show "+N more"
        timers.push(setTimeout(() => {
          setShowMore(true);
          setPhase("pausing");
        }, 600));
      }
    }

    if (phase === "pausing") {
      // Wait 2s then enter modal phase
      timers.push(setTimeout(() => {
        setPhase("modal");
        setModalStep(0);
      }, 2000));
    }

    if (phase === "modal") {
      // Step through 0→1→2→3→done, then resetting
      const steps = [800, 700, 700, 600];
      let accumulated = 0;
      steps.forEach((delay, i) => {
        accumulated += delay;
        timers.push(setTimeout(() => setModalStep(i + 1), accumulated));
      });
      accumulated += 600;
      timers.push(setTimeout(() => setModalDone(true), accumulated));
      accumulated += 1500;
      timers.push(setTimeout(() => setPhase("resetting"), accumulated));
    }

    if (phase === "resetting") {
      // Quick fade-out pause then reset all state
      timers.push(setTimeout(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        targetSatsRef.current = 0;
        setVisibleCount(0);
        setTypedLengths([0, 0, 0]);
        setDisplaySats(0);
        setShowMore(false);
        setModalStep(-1);
        setModalDone(false);
        setPhase("adding");
      }, 700));
    }

    return () => {
      timers.forEach(t => clearTimeout(t));
    };
  }, [phase, visibleCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const totalSatsDisplay = displaySats.toLocaleString();
  const estFee = Math.round(displaySats * 0.001).toLocaleString();
  const recipientCount = TOTAL_RECIPIENTS; // always 41

  // Progress bar: synced to the animation state machine
  const progressPct =
    phase === "pausing" || phase === "modal" ? 100 :
    phase === "resetting" ? 0 :
    Math.round((visibleCount / MAX_VISIBLE) * 90); // 0 → 30 → 60 → 90 while adding

  const MODAL_STEPS = ["Validate", "Sign", "Broadcast", "Done"];
  const isModalPhase = phase === "modal";

  return (
    <div className="relative animate-float rounded-2xl border border-primary/20 bg-surface-2/90 backdrop-blur-md shadow-[0_0_50px_hsl(var(--violet)/0.25)] p-4 w-full max-w-sm overflow-hidden">
      {/* Animated progress bar — synced to recipient reveal cycle */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden rounded-t-2xl">
        <div
          className="h-full bg-primary"
          style={{
            width: `${progressPct}%`,
            transition: phase === "resetting" ? "none" : "width 600ms ease-out",
          }}
        />
      </div>

      <div className="flex items-center justify-between mb-4 mt-1">
        <div>
          <p className="text-xs text-muted-foreground">Batch #1,247</p>
          <p className="font-mono font-bold text-lg text-foreground tabular-nums">
            {totalSatsDisplay || "0"}{" "}
            <span className="text-muted-foreground font-normal text-sm">sats</span>
          </p>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all duration-500 flex-shrink-0",
          isModalPhase
            ? "bg-primary/10 border-primary/30 text-primary"
            : "bg-emerald/10 border-emerald/30 text-emerald-400"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            isModalPhase ? "bg-primary" : "bg-emerald-400"
          )} />
          {isModalPhase ? (modalDone ? "Sent!" : "Signing...") : "Broadcasting"}
        </span>
      </div>

      <div className="space-y-2 mb-3 min-h-[112px]">
        {isModalPhase ? (
          modalDone ? (
            <div className="flex flex-col items-center justify-center min-h-[112px] gap-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">Batch Sent!</span>
              <span className="text-xs text-muted-foreground">{recipientCount} recipients · confirmed</span>
            </div>
          ) : (
            <div className="space-y-2.5 min-h-[112px] pt-1">
              {MODAL_STEPS.map((label, i) => {
                const isDone = modalStep > i;
                const isActive = modalStep === i;
                return (
                  <div key={label} className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-300",
                      isDone ? "bg-primary/20 border-primary/60" : isActive ? "border-primary" : "border-border/40 bg-surface-3"
                    )}>
                      {isDone
                        ? <CheckCircle2 className="h-3 w-3 text-primary" />
                        : isActive
                        ? <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        : null}
                    </div>
                    <span className={cn("text-xs transition-colors", isDone || isActive ? "text-foreground" : "text-muted-foreground/40")}>
                      {label}
                    </span>
                    {isActive && <span className="text-[10px] text-muted-foreground animate-pulse ml-auto">processing...</span>}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <>
            {DEMO_RECIPIENTS.slice(0, MAX_VISIBLE).map((r, i) => {
              const isVisible = i < visibleCount;
              const typed = typedLengths[i] ?? 0;
              const fullTrunc = truncAddr(r.full);
              const displayAddr = fullTrunc.slice(0, typed);
              const showCursor = isVisible && typed < fullTrunc.length;

              return (
                <div
                  key={r.full}
                  className={cn(
                    "flex items-center justify-between rounded-lg bg-surface-3 px-3 py-2 transition-all duration-300",
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {displayAddr}
                      {showCursor && (
                        <span className="inline-block w-px h-3 bg-primary ml-0.5 animate-pulse align-middle" />
                      )}
                    </span>
                  </div>
                  <span className={cn(
                    "font-mono text-xs font-medium transition-opacity duration-200",
                    typed >= fullTrunc.length ? "opacity-100" : "opacity-0"
                  )}>
                    {r.sats.toLocaleString()} sats
                  </span>
                </div>
              );
            })}

            {/* +N more recipients */}
            <div className={cn(
              "flex items-center justify-center py-1 text-xs text-muted-foreground transition-all duration-500",
              showMore ? "opacity-100" : "opacity-0"
            )}>
              + {TOTAL_RECIPIENTS - MAX_VISIBLE} more recipients
            </div>
          </>
        )}
      </div>

      {/* Summary line */}
      <div className="text-xs text-muted-foreground text-center mb-3">
        {recipientCount} recipients · 1 atomic tx
      </div>

      <div className="border-t border-border/40 pt-3 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Est. Fee</span>
          <span className="font-mono text-foreground font-medium tabular-nums">
            ~{estFee || "0"} sats{" "}
            <span className="text-emerald-400 ml-1">95% saved</span>
          </span>
        </div>
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          vs. ~{recipientCount} individual txs
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const [proofRef, proofInView] = useInView();
  const [featuresRef, featuresInView] = useInView();
  const [howRef, howInView] = useInView();
  const [useCasesRef, useCasesInView] = useInView();
  const [ctaRef, ctaInView] = useInView();
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      {/* Background orbs — page level so they don't affect section layout width */}
      <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <NavBar />

      {/* Hero Section */}
      <section className="relative overflow-x-hidden">
        <div className="absolute inset-0 grid-overlay opacity-[0.6]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16 py-24 lg:py-32">

            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/15 px-4 py-1.5 text-xs font-medium text-primary mb-8 animate-pulse-slow">
                <Layers className="h-3.5 w-3.5" />
                Powered by Stacks + sBTC
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6">
                Batch Pay sBTC
                <br />
                <span className="shimmer-violet">at Scale</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
                Send sBTC to hundreds of recipients in a single atomic transaction. Save 95% on fees, validate in real-time, and broadcast with confidence.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/app">
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 shadow-[0_0_30px_hsl(var(--violet)/0.3)] hover:shadow-[0_0_40px_hsl(var(--violet)/0.4)] transition-all hover:scale-[1.02]">
                    Launch App
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/stats">
                  <Button size="lg" variant="outline" className="gap-2 border-border/60 hover:bg-surface-2 hover:border-gold/40 h-12 px-8 transition-all">
                    <TrendingUp className="h-4 w-4" />
                    View Stats
                  </Button>
                </Link>
              </div>

              {/* Quick stats */}
              <div className="mt-12 flex items-center gap-6 sm:gap-10 justify-center lg:justify-start">
                {[
                  { label: "Batches Sent", value: "12,847" },
                  { label: "Sats Transferred", value: "2.4B" },
                  { label: "Gas Saved", value: "95%" },
                ].map(({ label, value }, i) => (
                  <div
                    key={label}
                    className="relative text-center lg:text-left animate-slide-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {i > 0 && <div className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 h-8 w-px bg-border/60" />}
                    <div className="font-mono text-xl sm:text-2xl font-bold text-foreground">{value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Floating demo */}
            <div className="flex-shrink-0 lg:w-auto w-full flex flex-col items-center relative gap-4 py-3 px-4 lg:px-0">
              <FloatingDemoCard />
              <Link to="/app">
                <Button size="sm" variant="outline" className="gap-2 border-primary/40 hover:bg-primary/10 text-primary">
                  Try BatchPay Free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div
        ref={proofRef as React.RefObject<HTMLDivElement>}
        className="border-y border-border/60 bg-surface-2 py-5"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4">
            {proofStats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "flex items-center gap-2.5 transition-all duration-500 ease-out",
                  proofInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: proofInView ? `${i * 80}ms` : "0ms" }}
              >
                <span className={`w-2 h-2 rounded-full ${stat.color} flex-shrink-0`} />
                <AnimatedStat stat={stat} shouldStart={proofInView} delay={i * 120} />
                <span className="text-muted-foreground text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section
        ref={featuresRef as React.RefObject<HTMLElement>}
        className="py-24 border-b border-border/40"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "text-center mb-16 transition-all duration-600 ease-out",
              featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: featuresInView ? "0ms" : "0ms" }}
          >
            <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">Why BatchPay</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Built for efficiency at scale</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={cn(
                    "gradient-border p-6 bg-surface-3 hover:bg-surface-4 transition-all duration-[600ms] ease-out group flex flex-col",
                    featuresInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  )}
                  style={{ transitionDelay: featuresInView ? `${i * 120}ms` : "0ms" }}
                >
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.bg} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{feature.description}</p>
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${feature.metricBg} ${feature.metricColor}`}>
                      {feature.metric}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        ref={howRef as React.RefObject<HTMLElement>}
        className="py-24 border-b border-border/40"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "text-center mb-16 transition-all duration-[600ms] ease-out",
              howInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <p className="text-primary text-sm font-medium uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Three steps to batch pay</h2>
          </div>

          <div className="relative grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={cn(
                    "relative flex flex-col items-center md:items-start text-center md:text-left group transition-all duration-[600ms] ease-out",
                    howInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  )}
                  style={{ transitionDelay: howInView ? `${i * 120}ms` : "0ms" }}
                >
                  {/* Connector arrow */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-8 left-[calc(100%-1rem)] w-8 items-center justify-center z-10">
                      <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                  )}

                  <div className="gradient-border p-6 bg-surface-2 w-full h-full flex flex-col">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-mono text-3xl font-black text-primary/30 leading-none mt-1">{step.number}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section
        ref={useCasesRef as React.RefObject<HTMLElement>}
        className="py-24 bg-surface-2 border-b border-border/40"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "text-center mb-16 transition-all duration-500 ease-out",
              useCasesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
          >
            <p className="text-gold text-sm font-medium uppercase tracking-widest mb-3">Use Cases</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">One tool, many applications</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((uc, i) => {
              const Icon = uc.icon;
              return (
                <div
                  key={uc.title}
                  className={cn(
                    "relative rounded-2xl border border-border/40 bg-surface-2 p-6 overflow-hidden group hover:border-primary/40 transition-all duration-500 ease-out",
                    useCasesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                  )}
                  style={{ transitionDelay: useCasesInView ? `${i * 100}ms` : "0ms" }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/8 rounded-full -translate-y-16 translate-x-16 group-hover:bg-primary/10 transition-colors duration-500" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-10 w-10 rounded-xl ${uc.iconBg} border ${uc.iconBorder} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${uc.iconColor}`} />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{uc.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{uc.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef as React.RefObject<HTMLElement>}
        className="py-24 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-gold/5" />
        <div className="absolute inset-0 grid-overlay opacity-50" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-gold/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="gradient-border bg-surface-2 p-12 sm:p-16 text-center rounded-3xl">
            <h2
              className={cn(
                "font-display text-3xl sm:text-5xl font-black mb-6 text-foreground transition-all duration-700 ease-out",
                ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: ctaInView ? "0ms" : "0ms" }}
            >
              Ready to batch pay with{" "}
              <span className="shimmer-gold">sBTC?</span>
            </h2>
            <p
              className={cn(
                "text-lg text-muted-foreground mb-10 max-w-xl mx-auto transition-all duration-700 ease-out",
                ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: ctaInView ? "150ms" : "0ms" }}
            >
              Join thousands of teams using BatchPay to streamline their Bitcoin-native payroll and distributions.
            </p>
            <div
              className={cn(
                "flex flex-col items-center gap-4 transition-all duration-700 ease-out",
                ctaInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: ctaInView ? "300ms" : "0ms" }}
            >
              <Link to="/app">
                <Button
                  size="lg"
                  className="gap-3 bg-gold hover:bg-gold/90 text-black font-bold px-12 h-14 text-base shadow-[0_0_30px_hsl(var(--gold)/0.3)] hover:shadow-[0_0_40px_hsl(var(--gold)/0.4)] hover:scale-[1.03] transition-all"
                >
                  Launch App
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                View analytics →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — three-column */}
      <footer className="border-t border-border/40 bg-surface-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">

            {/* Column 1 — Brand */}
            <div className="flex flex-col gap-4">
              <Link to="/" className="flex items-center gap-2.5 w-fit group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 ring-1 ring-primary/40 group-hover:ring-primary/70 transition-all duration-300">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold text-base">Batch<span className="text-primary">Pay</span></span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Bitcoin-native batch payments on Stacks. Send sBTC to hundreds of recipients in a single atomic transaction.
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-[hsl(27,98%,54%)] animate-pulse" />
                <span className="text-xs text-muted-foreground font-medium">Built on Stacks · Bitcoin-secured</span>
              </div>
            </div>

            {/* Column 2 — Navigation Links */}
            <div className="flex gap-8 sm:gap-16">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Product</p>
                <ul className="space-y-2.5">
                  {[
                    { label: "App", to: "/app" },
                    { label: "History", to: "/history" },
                    { label: "Stats", to: "/stats" },
                  ].map(({ label, to }) => (
                    <li key={to}>
                      <Link to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Resources</p>
                <ul className="space-y-2.5">
                  {[
                    { label: "Docs", href: "#" },
                    { label: "GitHub", href: "#" },
                    { label: "Status", href: "#" },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => { e.preventDefault(); toast.info("Coming soon!"); }}
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Column 3 — Live Stats + Connect */}
            <div className="flex flex-col gap-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Network Stats</p>
              <div className="rounded-xl border border-border/40 bg-surface-2 p-4 space-y-3">
                <p className="font-mono text-sm text-foreground font-medium">
                  12,847 batches · <span className="text-muted-foreground">2.4B sats moved</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="text-sm text-emerald-400 font-medium">98.4% success rate</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2 w-fit bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/60 transition-all"
                onClick={() => setWalletModalOpen(true)}
              >
                <Wallet className="h-3.5 w-3.5" />
                Connect Wallet
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2026 BatchPay — All rights reserved</p>
            <p className="text-xs text-muted-foreground">Powered by Stacks · Bitcoin-secured</p>
          </div>
        </div>
      </footer>

      <WalletModal open={walletModalOpen} onOpenChange={setWalletModalOpen} />
    </div>
  );
}
