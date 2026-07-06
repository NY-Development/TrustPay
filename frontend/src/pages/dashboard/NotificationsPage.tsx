import React from 'react';

export default function NotificationsPage() {
  const alerts = [
    {
      id: 1,
      title: 'Subscription Active',
      body: 'Your business premium workspace subscription has been verified successfully.',
      time: '2 hours ago',
      type: 'info',
    },
    {
      id: 2,
      title: 'New Settlement Account added',
      body: 'CBE account number 1000403196928 was registered for manual checks.',
      time: '1 day ago',
      type: 'success',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Workspace Alerts</h1>
        <p className="text-xs text-[#54647a]">Receipt flagging notifications, security logins, and billing alerts</p>
      </div>

      <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex gap-4 p-4 rounded-xl border border-[#c2c6d9]/15 hover:bg-[#faf8ff] dark:hover:bg-white/5 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              alert.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'bg-blue-500/10 text-blue-500'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {alert.type === 'success' ? 'done_all' : 'info'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#131b2e] dark:text-white">{alert.title}</h4>
              <p className="text-xs text-[#424656] dark:text-[#c2c6d9] mt-1">{alert.body}</p>
              <span className="text-[10px] text-gray-400 mt-2 block">{alert.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
