import React from 'react';
import { useVerificationHistory } from '@/src/hooks/useVerification';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

export default function AnalyticsPage() {
  const { data } = useVerificationHistory({ limit: 100 });
  const verifications = data?.pages?.flatMap(page => page.data) || [];

  const providerCounts = verifications.reduce((acc: Record<string, number>, item: any) => {
    const prov = (item.provider || 'CBE').toUpperCase();
    acc[prov] = (acc[prov] || 0) + 1;
    return acc;
  }, {});

  const lineData = {
    labels: ['May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Verified volume (ETB)',
        data: [15000, 48000, 85000],
        borderColor: '#004bca',
        tension: 0.3,
        fill: false,
      },
    ],
  };

  const pieData = {
    labels: Object.keys(providerCounts),
    datasets: [
      {
        label: 'Verifications by Provider',
        data: Object.values(providerCounts),
        backgroundColor: ['#8E24AA', '#00E5FF', '#4CAF50', '#FFD600', '#FF5722'],
      },
    ],
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#131b2e] dark:text-white">Business Analytics</h1>
        <p className="text-xs text-[#54647a]">Reconciled values, provider distributions, and system growth metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[#131b2e] dark:text-white mb-4">Monthly checkout volumes</h3>
          <div className="h-64 relative">
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#131b2e] border border-[#c2c6d9]/30 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <h3 className="text-sm font-bold text-[#131b2e] dark:text-white mb-4">Verification share by gateway</h3>
          <div className="h-64 relative flex justify-center">
            {Object.keys(providerCounts).length > 0 ? (
              <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div className="text-center py-12 text-xs text-[#54647a]">No gateway logs data found yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
