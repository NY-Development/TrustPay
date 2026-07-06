import React from 'react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  const leadershipTeam = [
    {
      name: 'Yamlak Negash',
      role: 'CTO & Full-Stack Web and Mobile (Expo) Developer',
      image: 'https://yamlak.vercel.app/_next/image?url=%2Fyn2.ico&w=128&q=75',
      portfolio: 'https://yamlak.vercel.app',
      alt: 'Professional portrait of Yamlak Negash, Chief Technology Officer.'
    },
    {
      name: 'Ermiyas Desu',
      role: 'CMO & CPO',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUhxwCct6NcimA17P1xDr-W5qhxETXYcSk92bdq9nUcSojx38m3Ioxnj2VWSGt7YOunA_19OyuRidGJ2ylwaxJwz0Ijkx5jFQNur8KJeF10GzDt5QHZ_UU_9SaBvDreQz0YEYSSPZoKME8-hBi_fjgdf5QLIK31I-7HjpLzMJJ3A--UcKp9Gg1SdeKvwlliGlrQah7yAuu8i7VFqQCRWHto4CCVdEgHsPazA9F05_wYFitby2rnlKV',
      portfolio: 'https://ermiyas-dessu.buildxethiopia.com',
      alt: 'Professional portrait of Ermiyas Desu, CMO & CPO.'
    }
  ];

  return (
    <div className="bg-[#faf8ff] dark:bg-[#0b0e14] text-[#131b2e] dark:text-white min-h-screen flex flex-col font-['Inter'] antialiased">
      
      {/* Universal Sticky Glass Header */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#131b2e]/80 backdrop-blur-md border-b border-[#c2c6d9]/25 transition-colors">
        <div className="flex justify-between items-center px-8 py-4 max-w-[1440px] mx-auto w-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#004bca] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">shield</span>
            </div>
            <div>
              <h1 className="text-md font-bold text-[#131b2e] dark:text-white leading-tight">Trust Pay</h1>
              <p className="text-[11px] text-[#54647a] dark:text-[#c2c6d9]/70">Verification Network</p>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-[13px] font-medium text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors" href="#">Platform</a>
            <a className="text-[13px] font-medium text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors" href="#">Developers</a>
            <a className="text-[13px] font-medium text-[#54647a] dark:text-[#c2c6d9] hover:text-[#004bca] transition-colors" href="#">Pricing</a>
            <Link to="/about" className="text-[13px] font-semibold text-[#004bca] dark:text-[#549aff] border-b-2 border-[#004bca] pb-1">About</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-[13px] font-semibold text-[#004bca] border border-[#004bca] px-4 py-2 rounded-xl hover:bg-[#f2f3ff] transition-all">Sign In</Link>
            <Link to="/register" className="text-[13px] font-semibold bg-[#004bca] text-white px-4 py-2 rounded-xl hover:bg-[#0061ff] transition-colors">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Main Structural Layout Canvas */}
      <main className="flex-grow pt-[88px]">
        
        {/* Section 1: Hero Context */}
        <section className="py-20 px-8 max-w-[1440px] mx-auto relative w-full">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#b4c5ff]/10 via-transparent to-transparent" />
          <div className="max-w-3xl">
            <h1 className="font-['Geist'] text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-[#131b2e] dark:text-white mb-6">
              Building the foundation of trust for digital finance.
            </h1>
            <p className="text-lg text-[#54647a] dark:text-[#c2c6d9] leading-relaxed mb-8 max-w-2xl">
              We are engineers, risk analysts, and fraud fighters designing secure infrastructure to eliminate reference fraud, check manipulation, and double payments at transaction interfaces across East Africa.
            </p>
            <div className="flex gap-4">
              <button className="bg-[#004bca] hover:bg-[#0061ff] text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-sm">
                Read Our Manifesto
              </button>
              <button className="text-[#131b2e] dark:text-white border border-[#c2c6d9] dark:border-white/10 px-6 py-3 rounded-xl text-xs font-bold hover:bg-[#f2f3ff] dark:hover:bg-white/5 transition">
                View Open Roles
              </button>
            </div>
          </div>
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

            {/* Core Volumetric Metric Box */}
            <div className="col-span-1 md:col-span-4 p-8 flex flex-col justify-center bg-[#0061ff] text-white rounded-[24px] shadow-md">
              <div className="mb-4">
                <span className="material-symbols-outlined text-3xl">monitoring</span>
              </div>
              <div className="font-['Geist'] text-4xl font-extrabold tracking-tight mb-2">$50B+</div>
              <div className="text-xs text-[#f1f2ff]/90 leading-relaxed">
                Transaction references analyzed securely without a single settlement trace breach.
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
                Founded in 2024 by security engineers to support a rapidly migrating cash-to-digital landscape, Nexus Verify targets structural vulnerabilities in accounting pipelines.
              </p>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9] leading-relaxed">
                By maintaining persistent sync matrix architectures over transactional networks, we offer accurate settlement pipelines running underneath top-tier business applications.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Engineering Controls Trace */}
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

        {/* Section 4: Team Profile Matrix Grid */}
        <section className="py-20 px-8 max-w-[1440px] mx-auto w-full">
          <h2 className="font-['Geist'] text-3xl font-bold text-[#131b2e] dark:text-white mb-12 text-center">Leadership Team</h2>
          <div className="flex flex-wrap gap-8 justify-center max-w-4xl mx-auto">
            {leadershipTeam.map((member, index) => (
              <a 
                key={index} 
                href={member.portfolio}
                target="_blank" 
                rel="noopener noreferrer" 
                className="group cursor-pointer block w-full sm:w-[calc(50%-16px)] max-w-[280px]"
              >
                <div className="relative overflow-hidden rounded-[20px] mb-4 aspect-square bg-[#eaedff] dark:bg-[#131b2e] border border-[#c2c6d9]/30 dark:border-white/5 shadow-sm">
                  <img 
                    className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-300" 
                    src={member.image} 
                    alt={member.alt} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUhxwCct6NcimA17P1xDr-W5qhxETXYcSk92bdq9nUcSojx38m3Ioxnj2VWSGt7YOunA_19OyuRidGJ2ylwaxJwz0Ijkx5jFQNur8KJeF10GzDt5QHZ_UU_9SaBvDreQz0YEYSSPZoKME8-hBi_fjgdf5QLIK31I-7HjpLzMJJ3A--UcKp9Gg1SdeKvwlliGlrQah7yAuu8i7VFqQCRWHto4CCVdEgHsPazA9F05_wYFitby2rnlKV';
                    }}
                  />
                </div>
                <h4 className="font-['Geist'] text-md font-bold text-[#131b2e] dark:text-white group-hover:text-[#004bca] dark:group-hover:text-[#549aff] transition-colors">
                  {member.name}
                </h4>
                <p className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 font-semibold mt-0.5 leading-normal">
                  {member.role}
                </p>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* Persistent Page Bottom Frame */}
      <footer className="w-full py-8 bg-white dark:bg-[#131b2e] border-t border-[#c2c6d9]/20 dark:border-white/5 transition-colors">
        <div className="max-w-[1440px] mx-auto px-8 grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-[#004bca] flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                </div>
                <span className="font-['Geist'] font-bold text-sm text-[#131b2e] dark:text-white">Nexus Verify System</span>
              </div>
              <p className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 max-w-sm leading-relaxed">
                Automated transactional verification endpoints mapping parameters securely across checking infrastructures.
              </p>
            </div>
            <span className="text-[11px] text-[#54647a] dark:text-[#c2c6d9]/50 mt-6 md:mt-0">
              © 2026 Nexus Verify Systems. All rights reserved.
            </span>
          </div>

          <div className="md:col-span-3 flex flex-col gap-2.5">
            <h4 className="font-['Geist'] text-xs font-bold text-[#131b2e] dark:text-white uppercase tracking-wider mb-1">Legal</h4>
            <a className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 hover:text-[#004bca] transition-colors" href="#">Privacy Policy</a>
            <a className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 hover:text-[#004bca] transition-colors" href="#">Terms of Service</a>
          </div>

          <div className="md:col-span-3 flex flex-col gap-2.5">
            <h4 className="font-['Geist'] text-xs font-bold text-[#131b2e] dark:text-white uppercase tracking-wider mb-1">System Framework</h4>
            <a className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 hover:text-[#004bca] transition-colors" href="#">Security Core</a>
            <a className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 hover:text-[#004bca] transition-colors" href="#">Terminal Status</a>
            <a className="text-xs text-[#54647a] dark:text-[#c2c6d9]/70 hover:text-[#004bca] transition-colors" href="#">Contact Gateway</a>
          </div>
        </div>
      </footer>
    </div>
  );
}