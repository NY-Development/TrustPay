import React from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { usePublicStats } from '@/src/hooks/usePublicStats';

const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 70, damping: 15 } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

function AnimatedCounter({ value, suffix = '', duration = 1.4 }: { value: number; suffix?: string; duration?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

const values = [
  {
    icon: 'shield_lock',
    title: 'Security First',
    description: 'Every verification path is designed around the assumption that fraud will be attempted — not the hope that it won\'t.',
  },
  {
    icon: 'bolt',
    title: 'Built for Speed',
    description: 'Counter staff need an answer in seconds, not minutes. Our infrastructure is tuned end-to-end for low-latency confirmation.',
  },
  {
    icon: 'visibility',
    title: 'Radical Transparency',
    description: 'Every verification leaves an immutable audit trail — owners and staff can always see exactly what happened and when.',
  },
  {
    icon: 'hub',
    title: 'Built to Scale',
    description: 'From a single storefront to a multi-branch operation, the same infrastructure scales with you without re-platforming.',
  },
];

export default function AboutPage() {
  const { data } = usePublicStats();
  const stats = data?.data;

  const statItems = [
    { label: 'Registered Businesses', value: stats?.companies ?? 0, suffix: '+' },
    { label: 'Active Branches', value: stats?.branches ?? 0, suffix: '+' },
    { label: 'Payments Verified', value: stats?.verifications ?? 0, suffix: '+' },
    { label: 'Countries Served', value: stats?.countriesServed ?? 0, suffix: '+' },
  ];

  return (
    <div className="font-['Inter'] antialiased">
      {/* Section 1: Hero Context */}
      <section className="py-20 px-8 max-w-[1440px] mx-auto relative w-full">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-[#b4c5ff]/10 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="text-[13px] font-bold text-[#004bca] dark:text-[#549aff] uppercase tracking-widest mb-4 block">
            About Trust Pay
          </span>
          <h1 className="font-['Geist'] text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[#131b2e] dark:text-white mb-6">
            Building the foundation of trust for digital finance.
          </h1>
          <p className="text-lg text-[#54647a] dark:text-[#c2c6d9] leading-relaxed max-w-2xl">
            We are engineers, risk analysts, and fraud fighters designing secure infrastructure to eliminate reference fraud, check manipulation, and double payments at transaction interfaces across East Africa.
          </p>
        </motion.div>
      </section>

      {/* Section 2: Core Architecture Bento Grid */}
      <section className="py-12 px-8 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Mission Statement Bento Card */}
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 dark:border-white/10 rounded-[24px] col-span-1 md:col-span-8 p-8 md:p-10 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <span className="material-symbols-outlined text-[140px] text-[#004bca]">security</span>
            </div>
            <div className="relative z-10">
              <h2 className="font-['Geist'] text-2xl font-bold text-[#131b2e] dark:text-white mb-4">Our Mission</h2>
              <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] max-w-xl leading-relaxed">
                To definitively end payment verification fraud by providing deterministic, real-time balance and reference confirmations. We engineer bridges directly into verification gateways to replace error-prone manual logs with absolute algorithmic certainty.
              </p>
            </div>
          </div>

          {/* Live Metric Box */}
          <div className="col-span-1 md:col-span-4 p-8 flex flex-col justify-center bg-[#0061ff] text-white rounded-[24px] shadow-md">
            <div className="mb-4">
              <span className="material-symbols-outlined text-3xl">monitoring</span>
            </div>
            <div className="font-['Geist'] text-4xl font-extrabold tracking-tight mb-2">
              <AnimatedCounter value={stats?.verifiedAmount ?? 0} suffix=" ETB" />
            </div>
            <div className="text-xs text-[#f1f2ff]/90 leading-relaxed">
              In verified transaction volume processed securely, with a full audit trail on every reference.
            </div>
          </div>

          {/* Structural Vision Box */}
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 dark:border-white/10 rounded-[24px] col-span-1 md:col-span-5 p-8 shadow-sm">
            <div className="mb-4 h-10 w-10 rounded-xl bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9]/20 dark:border-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#004bca] text-[20px]">visibility</span>
            </div>
            <h3 className="font-['Geist'] text-lg font-bold text-[#131b2e] dark:text-white mb-2">The Vision</h3>
            <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
              A digital payment space where checking counters experience zero friction, allowing instant validation via automated single endpoint APIs. Trust shouldn't be a premium patch; it should be native to every digital currency system.
            </p>
          </div>

          {/* Strategic Background Box */}
          <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/35 dark:border-white/10 rounded-[24px] col-span-1 md:col-span-7 p-8 shadow-sm">
            <h3 className="font-['Geist'] text-lg font-bold text-[#131b2e] dark:text-white mb-3">Our Context</h3>
            <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed mb-3">
              Founded by security engineers to support a rapidly migrating cash-to-digital landscape, Trust Pay targets structural vulnerabilities in accounting pipelines.
            </p>
            <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
              By maintaining persistent sync matrix architectures over transactional networks, we offer accurate settlement pipelines running underneath top-tier business applications.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: By the Numbers (live) */}
      <section className="py-20 bg-[#131b2e] dark:bg-[#080a10] text-white relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom,var(--tw-gradient-stops))] from-[#004bca]/20 via-transparent to-transparent" />
        <div className="max-w-[1440px] mx-auto px-8 relative z-10">
          <div className="text-center mb-14">
            <h2 className="font-['Geist'] text-3xl font-bold mb-3">Trust Pay, by the numbers</h2>
            <p className="text-sm text-[#c2c6d9] max-w-2xl mx-auto">
              Live figures pulled directly from the platform — updated continuously as new businesses onboard.
            </p>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {statItems.map((item) => (
              <motion.div key={item.label} variants={fadeUpItem}>
                <div className="font-['Geist'] text-4xl md:text-5xl font-bold tracking-tight mb-2">
                  <AnimatedCounter value={item.value} suffix={item.suffix} />
                </div>
                <div className="text-[12px] font-semibold uppercase tracking-widest text-white/60">
                  {item.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section 4: Engineering Controls Trace */}
      <section className="py-20 bg-white dark:bg-[#131b2e] border-y border-[#c2c6d9]/25 transition-colors">
        <div className="max-w-[1440px] mx-auto px-8 w-full">
          <div className="text-center mb-16">
            <h2 className="font-['Geist'] text-3xl font-bold text-[#131b2e] dark:text-white mb-3">Compliance & Infrastructure</h2>
            <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] max-w-2xl mx-auto">
              Operating with enterprise-grade bank compliance protocols and rigorous data routing integrity setups.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-[#c2c6d9]/40 dark:border-white/5 rounded-xl bg-[#faf8ff] dark:bg-[#0b0e14] hover:border-[#004bca] transition-colors shadow-sm">
              <span className="material-symbols-outlined text-2xl text-[#004bca] mb-4">verified</span>
              <h4 className="font-['Geist'] text-sm font-bold text-[#131b2e] dark:text-white mb-2">Regulated Compliance</h4>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
                Rigorous oversight models ensuring transaction validations adhere natively to banking system rules.
              </p>
            </div>

            <div className="p-6 border border-[#c2c6d9]/40 dark:border-white/5 rounded-xl bg-[#faf8ff] dark:bg-[#0b0e14] hover:border-[#004bca] transition-colors shadow-sm">
              <span className="material-symbols-outlined text-2xl text-[#004bca] mb-4">lock</span>
              <h4 className="font-['Geist'] text-sm font-bold text-[#131b2e] dark:text-white mb-2">SSL Cryptography</h4>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
                Military grade end-to-end processing layers ensuring all network transaction packages are heavily guarded.
              </p>
            </div>

            <div className="p-6 border border-[#c2c6d9]/40 dark:border-white/5 rounded-xl bg-[#faf8ff] dark:bg-[#0b0e14] hover:border-[#004bca] transition-colors shadow-sm">
              <span className="material-symbols-outlined text-2xl text-[#004bca] mb-4">dns</span>
              <h4 className="font-['Geist'] text-sm font-bold text-[#131b2e] dark:text-white mb-2">Active Multi-Region Sync</h4>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
                Distributed fault-tolerant pipeline structures keeping verifying tasks alive around the clock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: What We Stand For */}
      <section className="py-20 px-8 max-w-[1440px] mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="font-['Geist'] text-3xl font-bold text-[#131b2e] dark:text-white mb-3">What we stand for</h2>
          <p className="text-sm text-[#54647a] dark:text-[#c2c6d9] max-w-2xl mx-auto">
            The principles that shape every decision, from database schema to support response time.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {values.map((value) => (
            <motion.div
              key={value.title}
              variants={fadeUpItem}
              className="p-6 rounded-2xl border border-[#c2c6d9]/35 dark:border-white/10 bg-white dark:bg-[#131b2e] shadow-sm hover:shadow-lg hover:border-[#004bca]/30 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-[#004bca]/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#004bca] text-[22px]">{value.icon}</span>
              </div>
              <h4 className="font-['Geist'] text-base font-bold text-[#131b2e] dark:text-white mb-2">{value.title}</h4>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
