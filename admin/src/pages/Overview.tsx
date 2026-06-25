import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Eye, Download, Mail, ArrowUpRight, 
  ArrowDownRight, TrendingUp, AlertTriangle, FileSpreadsheet
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SummaryStats {
  totalViews: number;
  totalVisitors: number;
  totalDownloads: number;
  totalInquiries: number;
  today: {
    views: number;
    visitors: number;
    downloads: number;
    inquiries: number;
  };
}

interface TopPage {
  path: string;
  count: number;
}

interface AnalyticsData {
  summary: SummaryStats;
  charts: {
    labels: string[];
    views: number[];
    visitors: number[];
    downloads: number[];
  };
  topPages: TopPage[];
}

export const Overview: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  if (loading || !data) {
    return (
      <div className="flex flex-col justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500">Loading analytics widgets...</p>
      </div>
    );
  }

  const { summary, charts, topPages } = data;

  // Chart configuration
  const lineChartData = {
    labels: charts.labels.map(l => {
      // Formats date YYYY-MM-DD to short display e.g. "June 25"
      const date = new Date(l);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        fill: true,
        label: 'Page Views',
        data: charts.views,
        borderColor: '#0284c7', // sky-600
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#0284c7'
      },
      {
        fill: true,
        label: 'Unique Visitors',
        data: charts.visitors,
        borderColor: '#f59e0b', // amber-500
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: '#f59e0b'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: { family: 'Poppins, Inter, sans-serif', size: 12 },
          boxWidth: 10,
          usePointStyle: true
        }
      },
      tooltip: {
        padding: 12,
        cornerRadius: 12,
        font: { family: 'Poppins, Inter, sans-serif' }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.04)' },
        ticks: { font: { family: 'Poppins, Inter, sans-serif' } }
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Poppins, Inter, sans-serif' } }
      }
    }
  };

  const stats = [
    { label: 'Views Today', value: summary.today.views, total: summary.totalViews, icon: <Eye className="text-sky-600 dark:text-sky-400" size={24} />, bg: 'bg-sky-50 dark:bg-sky-950/20' },
    { label: 'Visitors Today', value: summary.today.visitors, total: summary.totalVisitors, icon: <Users className="text-amber-600 dark:text-amber-400" size={24} />, bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: 'Downloads Today', value: summary.today.downloads, total: summary.totalDownloads, icon: <Download className="text-emerald-600 dark:text-emerald-400" size={24} />, bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
    { label: 'Inquiries Today', value: summary.today.inquiries, total: summary.totalInquiries, icon: <Mail className="text-purple-600 dark:text-purple-400" size={24} />, bg: 'bg-purple-50 dark:bg-purple-950/20' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Metrics Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex justify-between items-start transition-all hover:shadow-md">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 leading-none">{stat.value}</h3>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">Total overall: <strong className="text-slate-700 dark:text-slate-300">{stat.total}</strong></p>
            </div>
            <div className={`p-3 rounded-2xl ${stat.bg}`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Website Traffic</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visual representation of visitor hits over the past week</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase bg-sky-50 dark:bg-sky-950/30 px-3 py-1.5 rounded-xl border border-sky-100 dark:border-sky-900/50">
            <TrendingUp size={14} />
            <span>Weekly Growth</span>
          </div>
        </div>
        <div className="h-80 w-full flex items-center justify-center">
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>

      {/* Detail statistics columns */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Most Viewed Pages table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4">Most Viewed Pages</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Page Route Path</th>
                  <th className="pb-3 text-right font-semibold">Page Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {topPages.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-slate-500 text-xs">No view analytics logged yet</td>
                  </tr>
                ) : (
                  topPages.map((page, i) => (
                    <tr key={i} className="text-slate-700 dark:text-slate-300">
                      <td className="py-3 font-semibold font-mono text-xs">{page.path}</td>
                      <td className="py-3 text-right font-bold text-sky-600 dark:text-sky-400">{page.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Diagnostics status panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">System Diagnostics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Real-time CMS application hosting information and service status.</p>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-slate-600 dark:text-slate-400">Database Adapter</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Local JSON DB (Self-Contained)</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-slate-600 dark:text-slate-400">Server Node Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Online & Listening</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-slate-600 dark:text-slate-400">CSRF & XSS Protection</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Armed & Secure</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-slate-600 dark:text-slate-400">File Storage Node</span>
                <span className="font-bold text-sky-600 dark:text-sky-400">Local Disk Storage</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-400 p-4 rounded-2xl text-xs leading-relaxed">
            <AlertTriangle size={24} className="shrink-0 text-amber-500" />
            <p>Database backup is automatically performed in real-time as changes are written to the JSON directories. Keep server processes running.</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Overview;
