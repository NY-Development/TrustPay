import React, { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <div className="bg-white dark:bg-[#131b2e] p-8 rounded-xl border border-[#c2c6d9]/35 shadow-xs">
        <h1 className="text-3xl font-bold mb-2 text-[#131b2e] dark:text-white">Contact & Support</h1>
        <p className="text-sm text-[#424656] dark:text-[#c2c6d9] mb-6">
          Reach out if you need assistance with custom ERP integrations or onboarding.
        </p>

        {sent ? (
          <div className="p-4 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium">
            Message received! Our enterprise support staff will respond within 2 hours.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">FullName</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-[#outline-variant]/30 rounded-lg p-2.5 text-sm outline-none focus:border-[#004bca]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">Work Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-[#outline-variant]/30 rounded-lg p-2.5 text-sm outline-none focus:border-[#004bca]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#131b2e] dark:text-[#eef0ff] uppercase tracking-wider mb-2">How can we help?</label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-[#faf8ff] dark:bg-[#0b0e14] border border-[#c2c6d9] dark:border-[#outline-variant]/30 rounded-lg p-2.5 text-sm outline-none focus:border-[#004bca] resize-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#004bca] hover:bg-[#0061ff] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs"
            >
              Submit ticket
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
