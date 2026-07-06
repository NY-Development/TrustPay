import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import gsap from 'gsap';

// --- INTERFACES ---
interface PhysicsObject {
  id: number;
  label: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  pulse: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
}

interface ExplosionParticle extends Particle {
  decay: number;
  color: string;
}

// --- PHYSICS & PARTICLE SYSTEMS ENGINE ---
function HeroInteractivePhysics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let logos: PhysicsObject[] = [];
    let backgroundParticles: Particle[] = [];
    let explosionParticles: ExplosionParticle[] = [];

    const LOGO_LABELS = ['CBE', 'BOA', 'Telebirr', 'Awash'];
    const TARGET_RADIUS = 45;
    const primaryColor = '#004bca';

    let isDark = document.documentElement.classList.contains('dark');
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    backgroundParticles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.3 + 0.1,
    }));

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
    }));

    const ctxGsap = gsap.context(() => {
      gsap.to(logos, {
        radius: TARGET_RADIUS,
        duration: 1.5,
        stagger: 0.15,
        ease: 'elastic.out(1, 0.4)',
        delay: 0.2
      });
    });

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      themeObserver.disconnect();
      ctxGsap.revert();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full -z-10" />;
}

// --- TRUSTED BY COMPONENT ---
function TrustedBy() {
  const organizations = [
    { id: 1, name: "AYU HOTEL" },
    { id: 2, name: "FILAGOT HOTEL" },
    { id: 3, name: "DINA RESTAURANT" },
    { id: 4, name: "DEMBEL HOTEL" },
    { id: 5, name: "ROOBE HOTEL" }
  ];

  return (
    <section className="py-12 border-b border-border bg-background">
      <div className="max-w-[1280px] mx-auto px-6 text-center">
        <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-8">
          Trusted by leading establishments
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60">
          {organizations.map((org) => (
            <span key={org.id} className="font-heading text-lg font-bold text-foreground">
              {org.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// --- TYPED FRAMER VARIANTS ---
const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 15 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

// --- MAIN INTEGRATED HOMEPAGE COMPONENT ---
export default function HomePage() {
  return (
    <div className="bg-background text-foreground antialiased min-h-screen flex flex-col font-sans transition-colors duration-200 overflow-hidden">
      <div className="flex-grow">
        
        {/* Hero Banner Section */}
        <section className="relative py-24 md:py-32 border-b border-border bg-background/50 overflow-hidden flex items-center justify-center min-h-[70vh]">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          
          <HeroInteractivePhysics />
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="max-w-[1280px] w-full mx-auto px-6 text-center relative z-10"
          >
            <motion.h1 
              variants={fadeUpItem}
              className="font-heading text-5xl md:text-[56px] font-bold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.1]"
            >
              The Verification Infrastructure for Modern Finance.
            </motion.h1>
            
            <motion.p 
              variants={fadeUpItem}
              className="text-[18px] md:text-[20px] text-muted-foreground max-w-2xl mx-auto mb-10 leading-[1.6]"
            >
              Trust Pay provides a unified engine for manual reviews, automated OCR parsing, and real-time API integrations. Built for scale, designed for accuracy.
            </motion.p>
            
            <motion.div variants={fadeUpItem} className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  to="/register" 
                  className="bg-primary text-primary-foreground font-medium text-[14px] px-10 py-4 rounded-xl hover:opacity-90 transition-all shadow-sm font-heading text-center flex items-center justify-center w-full sm:w-auto"
                >
                  Explore Documentation
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  to="/pricing" 
                  className="bg-background text-primary border border-primary font-medium text-[14px] px-10 py-4 rounded-xl hover:bg-secondary transition-all shadow-sm font-heading text-center flex items-center justify-center w-full sm:w-auto"
                >
                  Contact Sales
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* Trusted By Section */}
        <TrustedBy />

        {/* Core Architectural Feature Bento Grid */}
        <section className="py-24 bg-card">
          <div className="max-w-[1280px] mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h2 className="font-heading text-[32px] md:text-[40px] font-semibold text-foreground tracking-[-0.02em] mb-3">
                Comprehensive Validation Stack
              </h2>
              <p className="text-[18px] text-muted-foreground max-w-3xl leading-[1.6]">
                Everything you need to ensure data integrity, from human-in-the-loop manual verification to high-speed automated parsing.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(320px,_auto)]"
            >
              <motion.div variants={fadeUpItem} className="md:col-span-8 bg-background border border-border rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                <div className="z-10 max-w-md">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">document_scanner</span>
                  </div>
                  <h3 className="font-heading text-[24px] font-medium text-foreground mb-3">Screenshot Parsing Engine (OCR)</h3>
                  <p className="text-[15px] text-muted-foreground leading-[1.6]">
                    Extract structured data from unstructured screenshots and documents with 99.9% accuracy. Our proprietary OCR models are trained specifically on financial formats.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={fadeUpItem} className="md:col-span-4 bg-background border border-border rounded-2xl p-8 flex flex-col justify-between group transition-all duration-300 hover:border-destructive/40 hover:shadow-xl hover:shadow-destructive/5">
                <div>
                  <div className="w-12 h-12 bg-destructive text-primary-foreground rounded-xl flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                  </div>
                  <h3 className="font-heading text-[24px] font-medium text-foreground mb-3">QR Validation</h3>
                  <p className="text-[15px] text-muted-foreground leading-[1.6]">
                    Instantly decode and validate EMV-compliant QR payloads. Detect tampered codes before transactions process.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={fadeUpItem} className="md:col-span-full bg-background border border-border rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                <div className="z-10 max-w-md">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-5 border border-primary/20">
                    <span className="material-symbols-outlined text-[24px]">fact_check</span>
                  </div>
                  <h3 className="font-heading text-[24px] font-medium text-foreground mb-3">Manual Verification Workbench</h3>
                  <p className="text-[15px] text-muted-foreground leading-[1.6]">
                    For edge cases that require human oversight. A streamlined queue management system designed for maximum reviewer throughput.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Infrastructure Log Audits Grid View */}
        <section className="py-24 bg-background border-t border-border overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 mb-5 text-primary">
                  <span className="material-symbols-outlined">account_tree</span>
                  <span className="font-heading text-[13px] font-bold uppercase tracking-widest">Hierarchy</span>
                </div>
                <h3 className="font-heading text-[32px] md:text-[40px] font-semibold text-foreground mb-5 leading-[1.1]">Granular Branch Management</h3>
                <p className="text-[18px] text-muted-foreground mb-8 leading-[1.6]">
                  Model your complex organizational structure perfectly. Assign distinct rule engines, verification thresholds, and reviewer pools to specific branches or regions without deploying new code.
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-8 shadow-xl shadow-black/5 text-left relative"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
                <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                  <h4 className="font-heading font-semibold text-foreground text-[15px]">Immutable Audit Logs</h4>
                  <span className="material-symbols-outlined text-muted-foreground">history</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}