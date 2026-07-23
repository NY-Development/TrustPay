import React, { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { motion, useInView, type Variants } from "framer-motion"
import gsap from "gsap"
import { BadgeCheck } from "lucide-react"
import { usePublicStats } from "@/src/hooks/usePublicStats"

// --- INTERFACES ---
interface PhysicsObject {
  id: number
  label: string
  radius: number
  x: number
  y: number
  vx: number
  vy: number
  mass: number
  pulse: number
}

interface Particle {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  alpha: number
}

interface ExplosionParticle extends Particle {
  decay: number
  color: string
}

// --- PHYSICS & PARTICLE SYSTEMS ENGINE ---
function HeroInteractivePhysics() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let logos: PhysicsObject[] = []
    let backgroundParticles: Particle[] = []
    let explosionParticles: ExplosionParticle[] = []

    const LOGO_LABELS = ["CBE", "BOA", "Telebirr", "Awash"]
    const TARGET_RADIUS = 45
    const primaryColor = "#004bca"

    let isDark = document.documentElement.classList.contains("dark")
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains("dark")
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth
        canvas.height = canvas.parentElement.clientHeight
      }
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    backgroundParticles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.3 + 0.1,
    }))

    logos = LOGO_LABELS.map((label, index) => ({
      id: index,
      label,
      radius: 0,
      x: TARGET_RADIUS + Math.random() * (canvas.width - TARGET_RADIUS * 2),
      y: TARGET_RADIUS + Math.random() * (canvas.height - TARGET_RADIUS * 2),
      vx: (Math.random() - 0.5) * 2.5 || 1.5,
      vy: (Math.random() - 0.5) * 2.5 || 1.5,
      mass: 1,
      pulse: 0,
    }))

    const ctxGsap = gsap.context(() => {
      gsap.to(logos, {
        radius: TARGET_RADIUS,
        duration: 1.5,
        stagger: 0.15,
        ease: "elastic.out(1, 0.4)",
        delay: 0.2,
      })
    })

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      animationFrameId = requestAnimationFrame(loop)
    }

    loop()
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", resizeCanvas)
      themeObserver.disconnect()
      ctxGsap.revert()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  )
}

// --- ANIMATED COUNT-UP (for the stats band + trusted-by numbers) ---
function AnimatedCounter({
  value,
  suffix = "",
  duration = 1.4,
}: {
  value: number
  suffix?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const [display, setDisplay] = React.useState(0)

  useEffect(() => {
    if (!inView) return
    let raf: number
    const start = performance.now()
    const from = 0

    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      // Ease-out cubic — quick start, gentle settle.
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  )
}

// --- STATS BAND: live platform numbers ---
function StatsBand() {
  const { data } = usePublicStats()
  const stats = data?.data

  const items = [
    {
      label: "Registered Businesses",
      value: stats?.companies ?? 0,
      suffix: "+",
    },
    { label: "Active Branches", value: stats?.branches ?? 0, suffix: "+" },
    {
      label: "Payments Verified",
      value: stats?.verifications ?? 0,
      suffix: "+",
    },
    {
      label: "Verification Accuracy",
      value: stats?.successRate ?? 0,
      suffix: "%",
    },
  ]

  return (
    <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="relative z-10 mx-auto max-w-[1280px] px-6">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-2 gap-8 text-center md:grid-cols-4 md:gap-6"
        >
          {items.map((item) => (
            <motion.div key={item.label} variants={fadeUpItem}>
              <div className="mb-2 font-heading text-4xl font-bold tracking-tight md:text-5xl">
                <AnimatedCounter value={item.value} suffix={item.suffix} />
              </div>
              <div className="text-[13px] font-semibold tracking-widest text-primary-foreground/75 uppercase">
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// --- TRUSTED BY COMPONENT (live, from registered businesses) ---
function TrustedBy() {
  const { data, isLoading } = usePublicStats()
  const organizations = data?.data?.trustedCompanies ?? []

  if (!isLoading && organizations.length === 0) return null

  return (
    <section className="border-b border-border bg-background py-16">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-10 text-[13px] font-bold tracking-widest text-muted-foreground uppercase"
        >
          Trusted by leading establishments
        </motion.p>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-wrap items-stretch justify-center gap-4"
        >
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 w-44 animate-pulse rounded-2xl bg-muted"
                />
              ))
            : organizations.map((org, i) => (
                <motion.div
                  key={`${org.companyName}-${i}`}
                  variants={fadeUpItem}
                  title={
                    org.city
                      ? `${org.companyName} — ${org.city}`
                      : org.companyName
                  }
                  className="group relative flex min-w-40 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/70 bg-card px-6 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-1 text-primary/60 transition-colors group-hover:text-primary">
                    <BadgeCheck size={12} strokeWidth={2.5} />
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase">
                      Verified
                    </span>
                  </div>
                  <span className="font-['Playfair_Display'] text-[19px] font-bold tracking-tight text-foreground italic">
                    {org.companyName}
                  </span>
                  {org.city && (
                    <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                      {org.city}
                      {org.region && org.region !== org.city
                        ? `, ${org.region}`
                        : ""}
                    </span>
                  )}
                </motion.div>
              ))}
        </motion.div>
      </div>
    </section>
  )
}

// --- TYPED FRAMER VARIANTS ---
const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 70, damping: 15 },
  },
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
}

// --- SAMPLE AUDIT FEED ---
// Illustrative only — shaped after the real AuditLog model
// (action / actor / ip / userAgent / createdAt / metadata), not live data.
interface AuditLogSample {
  action: string
  actor: string
  hash: string
  timeAgo: string
  tone: string
}

const AUDIT_LOG_SAMPLE: AuditLogSample[] = [
  {
    action: "VERIFY_PAYMENT",
    actor: "M. Bekele · Bole Branch",
    hash: "#8f21ac",
    timeAgo: "Just now",
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    action: "LOGIN",
    actor: "S. Alemu · Owner",
    hash: "#3d90e4",
    timeAgo: "2m ago",
    tone: "bg-primary/10 text-primary",
  },
  {
    action: "CREATE_BRANCH",
    actor: "S. Alemu · Owner",
    hash: "#a11f6b",
    timeAgo: "14m ago",
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    action: "VERIFY_PAYMENT_FAILED",
    actor: "T. Girma · Piassa Branch",
    hash: "#0c77d2",
    timeAgo: "26m ago",
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
]

// --- MAIN INTEGRATED HOMEPAGE COMPONENT ---
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background font-sans text-foreground antialiased transition-colors duration-200">
      <div className="flex-grow">
        {/* Hero Banner Section */}
        <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden border-b border-border bg-background/50 py-24 md:py-32">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

          <HeroInteractivePhysics />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="relative z-10 mx-auto w-full max-w-[1280px] px-6 text-center"
          >
            <motion.h1
              variants={fadeUpItem}
              className="mx-auto mb-6 max-w-4xl font-heading text-5xl leading-[1.1] font-bold tracking-tight text-foreground md:text-[56px]"
            >
              The Verification Infrastructure for Modern Finance.
            </motion.h1>

            <motion.p
              variants={fadeUpItem}
              className="mx-auto mb-10 max-w-2xl text-[18px] leading-[1.6] text-muted-foreground md:text-[20px]"
            >
              Trust Pay provides a unified engine for manual reviews, automated
              OCR parsing, and real-time API integrations. Built for scale,
              designed for accuracy.
            </motion.p>

            <motion.div
              variants={fadeUpItem}
              className="flex flex-col justify-center gap-4 sm:flex-row"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/register"
                  className="flex w-full items-center justify-center rounded-xl bg-primary px-10 py-4 text-center font-heading text-[14px] font-medium text-primary-foreground shadow-sm transition-all hover:opacity-90 sm:w-auto"
                >
                  Explore Documentation
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/pricing"
                  className="flex w-full items-center justify-center rounded-xl border border-primary bg-background px-10 py-4 text-center font-heading text-[14px] font-medium text-primary shadow-sm transition-all hover:bg-secondary sm:w-auto"
                >
                  Contact Sales
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Live Platform Stats */}
        <StatsBand />

        {/* Trusted By Section */}
        <TrustedBy />

        {/* Core Architectural Feature Bento Grid */}
        <section className="bg-card py-24">
          <div className="mx-auto max-w-[1280px] px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h2 className="mb-3 font-heading text-[32px] font-semibold tracking-[-0.02em] text-foreground md:text-[40px]">
                Comprehensive Validation Stack
              </h2>
              <p className="max-w-3xl text-[18px] leading-[1.6] text-muted-foreground">
                Everything you need to ensure data integrity, from
                human-in-the-loop manual verification to high-speed automated
                parsing.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="grid auto-rows-[minmax(320px,_auto)] grid-cols-1 gap-6 md:grid-cols-12"
            >
              <motion.div
                variants={fadeUpItem}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 md:col-span-8"
              >
                <div className="z-10 max-w-md">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <span className="material-symbols-outlined text-[24px]">
                      document_scanner
                    </span>
                  </div>
                  <h3 className="mb-3 font-heading text-[24px] font-medium text-foreground">
                    Screenshot Parsing Engine (OCR)
                  </h3>
                  <p className="text-[15px] leading-[1.6] text-muted-foreground">
                    Extract structured data from unstructured screenshots and
                    documents with 99.9% accuracy. Our proprietary OCR models
                    are trained specifically on financial formats.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUpItem}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-background p-8 transition-all duration-300 hover:border-destructive/40 hover:shadow-xl hover:shadow-destructive/5 md:col-span-4"
              >
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-destructive text-primary-foreground">
                    <span className="material-symbols-outlined text-[24px]">
                      qr_code_scanner
                    </span>
                  </div>
                  <h3 className="mb-3 font-heading text-[24px] font-medium text-foreground">
                    QR Validation
                  </h3>
                  <p className="text-[15px] leading-[1.6] text-muted-foreground">
                    Instantly decode and validate EMV-compliant QR payloads.
                    Detect tampered codes before transactions process.
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUpItem}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-background p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 md:col-span-full"
              >
                <div className="z-10 max-w-md">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-[24px]">
                      fact_check
                    </span>
                  </div>
                  <h3 className="mb-3 font-heading text-[24px] font-medium text-foreground">
                    Manual Verification Workbench
                  </h3>
                  <p className="text-[15px] leading-[1.6] text-muted-foreground">
                    For edge cases that require human oversight. A streamlined
                    queue management system designed for maximum reviewer
                    throughput.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Infrastructure Log Audits Grid View */}
        <section className="overflow-hidden border-t border-border bg-background py-24">
          <div className="mx-auto max-w-[1280px] px-6">
            <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="mb-5 flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">
                    account_tree
                  </span>
                  <span className="font-heading text-[13px] font-bold tracking-widest uppercase">
                    Hierarchy
                  </span>
                </div>
                <h3 className="mb-5 font-heading text-[32px] leading-[1.1] font-semibold text-foreground md:text-[40px]">
                  Granular Branch Management
                </h3>
                <p className="mb-8 text-[18px] leading-[1.6] text-muted-foreground">
                  Model your complex organizational structure perfectly. Assign
                  distinct rule engines, verification thresholds, and reviewer
                  pools to specific branches or regions without deploying new
                  code.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative rounded-2xl border border-border bg-card p-8 text-left shadow-xl shadow-black/5"
              >
                <div className="absolute top-0 right-0 -z-10 h-32 w-32 rounded-bl-full bg-primary/5" />
                <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                  <h4 className="font-heading text-[15px] font-semibold text-foreground">
                    Immutable Audit Logs
                  </h4>
                  <span className="material-symbols-outlined text-muted-foreground">
                    history
                  </span>
                </div>

                <div className="space-y-2.5">
                  {AUDIT_LOG_SAMPLE.map((log) => (
                    <div
                      key={log.hash}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background px-3.5 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold tracking-wide uppercase ${log.tone}`}
                        >
                          {log.action}
                        </span>
                        <span className="truncate text-xs font-medium text-foreground/80">
                          {log.actor}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-mono">{log.hash}</span>
                        <span>·</span>
                        <span>{log.timeAgo}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="material-symbols-outlined text-[13px]">
                    lock
                  </span>
                  Dummy Sample feed — every action in your organization is
                  hash-chained and tamper-evident.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
