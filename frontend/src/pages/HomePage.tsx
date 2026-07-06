import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';

// --- PHYSICS & PARTICLE SYSTEMS ENGINE BACKGROUND COMPONENT ---
function HeroInteractivePhysics() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let logos = [];
    let backgroundParticles = [];
    let explosionParticles = [];

    // Configuration
    const LOGO_LABELS = ['CBE', 'BOA', 'Telebirr', 'Awash'];
    const BACKGROUND_PARTICLE_COUNT = 45;
    const primaryColor = '#004bca';
    const accentColor = '#9d3000';
    const TARGET_RADIUS = 45;

    // Theme Support
    let isDark = document.documentElement.classList.contains('dark');
    const themeObserver = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    themeObserver.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize Subtle Ambient Background Grid/Particles
    backgroundParticles = Array.from({ length: BACKGROUND_PARTICLE_COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.3 + 0.1,
    }));

    // Initialize Bank Logo Rigid Floating Circles with radius 0 for GSAP animation
    logos = LOGO_LABELS.map((label, index) => {
      return {
        id: index,
        label,
        radius: 0, // Start at 0, GSAP will tween this
        x: TARGET_RADIUS + Math.random() * (canvas.width - TARGET_RADIUS * 2),
        y: TARGET_RADIUS + Math.random() * (canvas.height - TARGET_RADIUS * 2),
        vx: (Math.random() - 0.5) * 2.5 || 1.5,
        vy: (Math.random() - 0.5) * 2.5 || 1.5,
        mass: 1,
        pulse: 0,
      };
    });

    // GSAP: Animate the canvas objects in via their radius property
    const ctxGsap = gsap.context(() => {
      gsap.to(logos, {
        radius: TARGET_RADIUS,
        duration: 1.5,
        stagger: 0.15,
        ease: 'elastic.out(1, 0.4)',
        delay: 0.2
      });
    });

    const spawnExplosion = (x, y, colorHex) => {
      const count = 20;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 2;
        explosionParticles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1,
          alpha: 1,
          decay: Math.random() * 0.03 + 0.02,
          color: colorHex,
        });
      }
    };

    // Elastic Circle-to-Circle Collision Resolution System
    const resolveCollision = (c1, c2) => {
      if (c1.radius === 0 || c2.radius === 0) return; // Don't collide while spawning

      const xDist = c2.x - c1.x;
      const yDist = c2.y - c1.y;
      const dist = Math.hypot(xDist, yDist);

      if (dist === 0) return; 

      if (dist < c1.radius + c2.radius) {
        const normalX = xDist / dist;
        const normalY = yDist / dist;

        const kx = c1.vx - c2.vx;
        const ky = c1.vy - c2.vy;
        const p = 2 * (normalX * kx + normalY * ky) / (c1.mass + c2.mass);

        c1.vx -= p * c2.mass * normalX;
        c1.vy -= p * c2.mass * normalY;
        c2.vx += p * c1.mass * normalX;
        c2.vy += p * c1.mass * normalY;

        const overlap = (c1.radius + c2.radius) - dist;
        const separationBuffer = 0.5; 
        
        c1.x -= normalX * (overlap / 2 + separationBuffer);
        c1.y -= normalY * (overlap / 2 + separationBuffer);
        c2.x += normalX * (overlap / 2 + separationBuffer);
        c2.y += normalY * (overlap / 2 + separationBuffer);

        const midX = c1.x + normalX * c1.radius;
        const midY = c1.y + normalY * c1.radius;
        spawnExplosion(midX, midY, Math.random() > 0.5 ? primaryColor : accentColor);
        
        c1.pulse = 10;
        c2.pulse = 10;
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Particles
      backgroundParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(180, 197, 255, ${p.alpha})` : `rgba(0, 75, 202, ${p.alpha})`;
        ctx.fill();
      });

      // Micro-explosions
      for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const ep = explosionParticles[i];
        ep.x += ep.vx;
        ep.y += ep.vy;
        ep.alpha -= ep.decay;

        if (ep.alpha <= 0) {
          explosionParticles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2);
        ctx.fillStyle = ep.color;
        ctx.globalAlpha = ep.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0; 
      }

      // Bank Bubble Elements
      logos.forEach((logo, i) => {
        // Skip rendering if GSAP hasn't scaled it yet
        if (logo.radius < 1) return;

        logo.x += logo.vx;
        logo.y += logo.vy;

        // Boundary collisions
        if (logo.x - logo.radius < 0) {
          logo.x = logo.radius;
          logo.vx *= -1;
          spawnExplosion(0, logo.y, primaryColor);
        } else if (logo.x + logo.radius > canvas.width) {
          logo.x = canvas.width - logo.radius;
          logo.vx *= -1;
          spawnExplosion(canvas.width, logo.y, primaryColor);
        }

        if (logo.y - logo.radius < 0) {
          logo.y = logo.radius;
          logo.vy *= -1;
          spawnExplosion(logo.x, 0, accentColor);
        } else if (logo.y + logo.radius > canvas.height) {
          logo.y = canvas.height - logo.radius;
          logo.vy *= -1;
          spawnExplosion(logo.x, canvas.height, accentColor);
        }

        for (let j = i + 1; j < logos.length; j++) {
          resolveCollision(logo, logos[j]);
        }

        ctx.save();
        ctx.translate(logo.x, logo.y);

        let currentRadius = logo.radius;
        if (logo.pulse > 0) {
          currentRadius += Math.sin(logo.pulse) * 3;
          logo.pulse -= 0.5;
        }

        ctx.shadowColor = 'rgba(0, 75, 202, 0.08)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(40, 48, 68, 0.65)' : 'rgba(255, 255, 255, 0.75)';
        ctx.strokeStyle = isDark ? 'rgba(218, 226, 253, 0.15)' : 'rgba(0, 75, 202, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; 
        
        // Hide text if the bubble is still scaling up and too small
        if (currentRadius > 15) {
          ctx.fillStyle = isDark ? '#dbe1ff' : '#004bca';
          ctx.font = 'bold 13px Geist, Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Fade text in as bubble reaches full size
          ctx.globalAlpha = Math.min(1, (currentRadius - 15) / 30);
          ctx.fillText(logo.label, 0, 0);
          ctx.globalAlpha = 1.0;
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      themeObserver.disconnect();
      ctxGsap.revert(); // Cleanup GSAP animations to prevent memory leaks
    };
  }, []);

  return (
    <motion.canvas
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full -z-10 select-none"
    />
  );
}

// --- FRAMER MOTION VARIANTS ---
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 70, damping: 15 } 
  }
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
              
              {/* Box 1: OCR Layout */}
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
                <div className="mt-8 relative h-48 md:h-64 rounded-xl overflow-hidden border border-border shadow-sm bg-card flex items-center justify-center">
                  <img 
                    className="w-full h-full object-cover grayscale dark:opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" 
                    alt="Sophisticated OCR scanning interface" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1tl-tDIpuKpEWbyUL72gCVq_opeLvRbbNyujysZM0QxBOKHVyEh_AxYUf7gbPepOcbjudo-2JPBb2Hk6qrfdeQ7itr21jytwOJ_OvodoaDf93rPLa7_oGWy1-_JGzoOWOTz6230Hzg30eqbQAo73-m7ayjRWOXEPdfEdYv1nphHtJH37YtvEdE6H20YueXL4hlDN9pK0aeZdtjA3miI2mMXO7ujZb-zhb9tF4NrCGl8CBTKXpBq9x"
                  />
                </div>
              </motion.div>

              {/* Box 2: QR System Layer */}
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
                <div className="mt-8 h-32 rounded-xl border border-border shadow-sm bg-card flex items-center justify-center relative overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                  <span className="material-symbols-outlined text-[56px] text-destructive opacity-30 group-hover:opacity-60 transition-opacity">qr_code_2</span>
                </div>
              </motion.div>

              {/* Box 3: API Micro-interface */}
              <motion.div variants={fadeUpItem} className="md:col-span-4 bg-background border border-border rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                <div>
                  <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-xl flex items-center justify-center mb-5">
                    <span className="material-symbols-outlined text-[24px]">api</span>
                  </div>
                  <h3 className="font-heading text-[24px] font-medium text-foreground mb-3">Real-time API Integrations</h3>
                  <p className="text-[15px] text-muted-foreground leading-[1.6]">
                    Connect directly to primary core banking systems. Sub-50ms latency for synchronous verification calls.
                  </p>
                </div>
                <div className="mt-8 bg-muted text-muted-foreground rounded-xl p-5 overflow-hidden border border-border/40 text-left">
                  <pre className="font-mono text-[13px] overflow-x-auto opacity-90 leading-relaxed">
                    <code>
                      POST /v1/verify{"\n"}
                      {"{"}{"\n"}
                      {"  "}"payload": "sys_x89",{"\n"}
                      {"  "}"fast_path": true{"\n"}
                      {"}"}{"\n"}
                      <span className="text-primary font-semibold">HTTP/1.1 200 OK</span>
                    </code>
                  </pre>
                </div>
              </motion.div>

              {/* Box 4: Workspace Panel Overview */}
              <motion.div variants={fadeUpItem} className="md:col-span-8 bg-background border border-border rounded-2xl p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                <div className="z-10 max-w-md">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-5 border border-primary/20">
                    <span className="material-symbols-outlined text-[24px]">fact_check</span>
                  </div>
                  <h3 className="font-heading text-[24px] font-medium text-foreground mb-3">Manual Verification Workbench</h3>
                  <p className="text-[15px] text-muted-foreground leading-[1.6]">
                    For edge cases that require human oversight. A streamlined queue management system designed for maximum reviewer throughput.
                  </p>
                </div>
                <div className="mt-8 relative h-48 md:h-64 rounded-xl overflow-hidden border border-border shadow-sm bg-card flex items-center justify-center">
                  <img 
                    className="w-full h-full object-cover object-top grayscale dark:opacity-80 transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" 
                    alt="Verification dashboard queue interface" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaeF6MefMLcncI5wT3gxVkCTDfE2kLxkYaB-EXyLDm4VvguhOV5MnprDKYiLBljmcNENkV3evPDBSdreKyYix3elkJ0jQLDfbN2n0JiRIG6eEzhw7n59DvEcutv0F_YlccoCGUA38BTIXPQceI1yuLmrEXW5DCgcz3MJ4YI5rzN4CxkgiRBynK4ZkkE0_lCMVjFKpNr7CMGEuEI7MwooRjaBaCHwxaDLGn0omGzPnOw9kyXg8fVkvR"
                  />
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
                <ul className="space-y-4">
                  {[
                    "Inheritable configuration templates",
                    "Branch-level analytics and reporting",
                    "Isolated user access controls (RBAC)"
                  ].map((text, i) => (
                    <motion.li 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + (i * 0.1) }}
                      className="flex items-start gap-3"
                    >
                      <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">check_circle</span>
                      <span className="text-[15px] font-medium text-muted-foreground">{text}</span>
                    </motion.li>
                  ))}
                </ul>
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
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px] text-secondary-foreground">person</span>
                    </div>
                    <div>
                      <p className="text-[15px] text-foreground leading-[1.5]"><span className="font-semibold">Sarah J.</span> manually approved verification <span className="font-mono text-[14px] text-primary">#VR-8921</span></p>
                      <p className="text-[13px] text-muted-foreground mt-1">2 mins ago • IP: 192.168.1.1</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px] text-destructive">smart_toy</span>
                    </div>
                    <div>
                      <p className="text-[15px] text-foreground leading-[1.5]">System flagged payload <span className="font-mono text-[14px] text-destructive font-medium">#PL-4432</span> (Rule: Velocity)</p>
                      <p className="text-[13px] text-muted-foreground mt-1">15 mins ago • Engine: v2.4.1</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}