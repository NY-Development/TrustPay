import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="bg-[#faf8ff] text-[#131b2e] antialiased min-h-screen flex flex-col font-['Inter']">
      {/* Dynamic Background Grid Mesh */}
      <style>{`
        .hero-pattern {
          background-color: #faf8ff;
          background-image: radial-gradient(#c2c6d9 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .bento-glow:hover {
          box-shadow: 0 0 24px rgba(0, 75, 202, 0.1);
        }
      `}</style>

      {/* Main Container Wrapper */}
      <div className="flex-grow">
        
        {/* Hero Banner Grid Section */}
        <section className="hero-pattern py-24 md:py-32 border-b border-[#c2c6d9]/30">
          <div className="max-w-[1280px] mx-auto px-6 text-center">
            <h1 className="font-['Geist'] text-5xl md:text-[48px] font-bold tracking-tight text-[#131b2e] mb-6 max-w-4xl mx-auto leading-[1.1]">
              The Verification Infrastructure for Modern Finance.
            </h1>
            <p className="text-[18px] text-[#424656] max-w-2xl mx-auto mb-10 leading-[1.6]">
              Trust Pay provides a unified engine for manual reviews, automated OCR parsing, and real-time API integrations. Built for scale, designed for accuracy.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/register" 
                className="bg-[#004bca] text-white font-medium text-[13px] px-10 py-4 rounded hover:bg-[#003ea8] transition-colors shadow-sm font-['Geist'] text-center"
              >
                Explore Documentation
              </Link>
              <Link 
                to="/pricing" 
                className="bg-[#faf8ff] text-[#004bca] border border-[#004bca] font-medium text-[13px] px-10 py-4 rounded hover:bg-[#ffffff] transition-colors shadow-sm font-['Geist'] text-center"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

        {/* Core Architectural Feature Bento Grid */}
        <section className="py-24 bg-[#ffffff]">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="mb-10">
              <h2 className="font-['Geist'] text-[32px] font-semibold text-[#131b2e] tracking-[-0.02em] mb-2">
                Comprehensive Validation Stack
              </h2>
              <p className="text-[18px] text-[#424656] max-w-3xl leading-[1.6]">
                Everything you need to ensure data integrity, from human-in-the-loop manual verification to high-speed automated parsing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(300px,_auto)]">
              
              {/* Box 1: OCR Layout */}
              <div className="md:col-span-8 bg-[#faf8ff] border border-[#c2c6d9] rounded-xl p-6 flex flex-col justify-between overflow-hidden relative bento-glow transition-all duration-300">
                <div className="z-10 max-w-md">
                  <div className="w-12 h-12 bg-[#0061ff] text-[#f1f2ff] rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[24px]">document_scanner</span>
                  </div>
                  <h3 className="font-['Geist'] text-[24px] font-medium text-[#131b2e] mb-2">Screenshot Parsing Engine (OCR)</h3>
                  <p className="text-[14px] text-[#424656] leading-[1.5]">
                    Extract structured data from unstructured screenshots and documents with 99.9% accuracy. Our proprietary OCR models are trained specifically on financial formats.
                  </p>
                </div>
                <div className="mt-6 relative h-48 md:h-64 rounded-lg overflow-hidden border border-[#c2c6d9] shadow-sm bg-[#ffffff] flex items-center justify-center">
                  <img 
                    className="w-full h-full object-cover" 
                    alt="Sophisticated OCR scanning interface" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1tl-tDIpuKpEWbyUL72gCVq_opeLvRbbNyujysZM0QxBOKHVyEh_AxYUf7gbPepOcbjudo-2JPBb2Hk6qrfdeQ7itr21jytwOJ_OvodoaDf93rPLa7_oGWy1-_JGzoOWOTz6230Hzg30eqbQAo73-m7ayjRWOXEPdfEdYv1nphHtJH37YtvEdE6H20YueXL4hlDN9pK0aeZdtjA3miI2mMXO7ujZb-zhb9tF4NrCGl8CBTKXpBq9x"
                  />
                </div>
              </div>

              {/* Box 2: QR System Layer */}
              <div className="md:col-span-4 bg-[#faf8ff] border border-[#c2c6d9] rounded-xl p-6 flex flex-col justify-between bento-glow transition-all duration-300">
                <div>
                  <div className="w-12 h-12 bg-[#c73f00] text-[#ffefeb] rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[24px]">qr_code_scanner</span>
                  </div>
                  <h3 className="font-['Geist'] text-[24px] font-medium text-[#131b2e] mb-2">QR Validation</h3>
                  <p className="text-[14px] text-[#424656] leading-[1.5]">
                    Instantly decode and validate EMV-compliant QR payloads. Detect tampered codes before transactions process.
                  </p>
                </div>
                <div className="mt-6 h-32 rounded-lg border border-[#c2c6d9] shadow-sm bg-[#ffffff] flex items-center justify-center relative overflow-hidden">
                  <span className="material-symbols-outlined text-[48px] text-[#9d3000] opacity-50">qr_code_2</span>
                </div>
              </div>

              {/* Box 3: API Micro-interface */}
              <div className="md:col-span-4 bg-[#faf8ff] border border-[#c2c6d9] rounded-xl p-6 flex flex-col justify-between bento-glow transition-all duration-300">
                <div>
                  <div className="w-12 h-12 bg-[#d0e1fb] text-[#54647a] rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[24px]">api</span>
                  </div>
                  <h3 className="font-['Geist'] text-[24px] font-medium text-[#131b2e] mb-2">Real-time API Integrations</h3>
                  <p className="text-[14px] text-[#424656] leading-[1.5]">
                    Connect directly to primary core banking systems. Sub-50ms latency for synchronous verification calls.
                  </p>
                </div>
                <div className="mt-6 bg-[#283044] rounded-lg p-4 overflow-hidden shadow-inner text-left">
                  <pre className="font-['JetBrains_Mono'] text-[13px] text-[#faf8ff]/80 overflow-x-auto">
                    <code>
                      POST /v1/verify{"\n"}
                      {"{"}{"\n"}
                      {"  "}"payload": "sys_x89",{"\n"}
                      {"  "}"fast_path": true{"\n"}
                      {"}"}{"\n"}
                      <span className="text-[#b7c8e1]">HTTP/1.1 200 OK</span>
                    </code>
                  </pre>
                </div>
              </div>

              {/* Box 4: Workspace Panel Overview */}
              <div className="md:col-span-8 bg-[#faf8ff] border border-[#c2c6d9] rounded-xl p-6 flex flex-col justify-between bento-glow transition-all duration-300">
                <div className="z-10 max-w-md">
                  <div className="w-12 h-12 bg-[#0052dc]/10 text-[#0052dc] rounded-lg flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-[24px]">fact_check</span>
                  </div>
                  <h3 className="font-['Geist'] text-[24px] font-medium text-[#131b2e] mb-2">Manual Verification Workbench</h3>
                  <p className="text-[14px] text-[#424656] leading-[1.5]">
                    For edge cases that require human oversight. A streamlined queue management system designed for maximum reviewer throughput.
                  </p>
                </div>
                <div className="mt-6 relative h-48 md:h-64 rounded-lg overflow-hidden border border-[#c2c6d9] shadow-sm bg-[#ffffff] flex items-center justify-center">
                  <img 
                    className="w-full h-full object-cover object-top" 
                    alt="Verification dashboard queue interface" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaeF6MefMLcncI5wT3gxVkCTDfE2kLxkYaB-EXyLDm4VvguhOV5MnprDKYiLBljmcNENkV3evPDBSdreKyYix3elkJ0jQLDfbN2n0JiRIG6eEzhw7n59DvEcutv0F_YlccoCGUA38BTIXPQceI1yuLmrEXW5DCgcz3MJ4YI5rzN4CxkgiRBynK4ZkkE0_lCMVjFKpNr7CMGEuEI7MwooRjaBaCHwxaDLGn0omGzPnOw9kyXg8fVkvR"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Infrastructure Log Audits Grid View */}
        <section className="py-24 bg-[#faf8ff] border-t border-[#c2c6d9]/30">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <div className="flex items-center gap-2 mb-4 text-[#004bca]">
                  <span className="material-symbols-outlined">account_tree</span>
                  <span className="font-['Geist'] text-[13px] font-medium uppercase tracking-wider">Hierarchy</span>
                </div>
                <h3 className="font-['Geist'] text-[32px] font-semibold text-[#131b2e] mb-4 leading-[1.2]">Granular Branch Management</h3>
                <p className="text-[18px] text-[#424656] mb-6 leading-[1.6]">
                  Model your complex organizational structure perfectly. Assign distinct rule engines, verification thresholds, and reviewer pools to specific branches or regions without deploying new code.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#004bca] text-[20px] mt-0.5">check_circle</span>
                    <span className="text-[14px] text-[#424656]">Inheritable configuration templates</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#004bca] text-[20px] mt-0.5">check_circle</span>
                    <span className="text-[14px] text-[#424656]">Branch-level analytics and reporting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[#004bca] text-[20px] mt-0.5">check_circle</span>
                    <span className="text-[14px] text-[#424656]">Isolated user access controls (RBAC)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#ffffff] border border-[#c2c6d9] rounded-xl p-6 shadow-sm text-left">
                <div className="flex items-center justify-between border-b border-[#c2c6d9]/50 pb-2 mb-4">
                  <h4 className="font-['Geist'] font-medium text-[#131b2e] text-sm">Immutable Audit Logs</h4>
                  <span className="material-symbols-outlined text-[#424656]">history</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#e2e7ff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-[#424656]">person</span>
                    </div>
                    <div>
                      <p className="text-[14px] text-[#131b2e]"><span className="font-medium">Sarah J.</span> manually approved verification <span className="font-['JetBrains_Mono'] text-[13px] text-[#004bca]">#VR-8921</span></p>
                      <p className="text-[13px] text-[#424656] mt-1">2 mins ago • IP: 192.168.1.1</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#e2e7ff] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px] text-[#424656]">smart_toy</span>
                    </div>
                    <div>
                      <p className="text-[14px] text-[#131b2e]">System flagged payload <span className="font-['JetBrains_Mono'] text-[13px] text-[#ba1a1a]">#PL-4432</span> (Rule: Velocity)</p>
                      <p className="text-[13px] text-[#424656] mt-1">15 mins ago • Engine: v2.4.1</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}