import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Users, DollarSign, Calendar, Package, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await authAxios.get('/analytics/dashboard');
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#6B726C]">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  const stats = [
    {
      label: 'Total Customers',
      value: analytics?.total_customers || 0,
      icon: Users,
      color: '#1B3B36',
      testId: 'stat-customers'
    },
    {
      label: 'Monthly Revenue',
      value: `₹${(analytics?.monthly_revenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: '#D4AF37',
      testId: 'stat-revenue'
    },
    {
      label: 'Upcoming Appointments',
      value: analytics?.upcoming_appointments || 0,
      icon: Calendar,
      color: '#1B3B36',
      testId: 'stat-appointments'
    },
    {
      label: 'Low Stock Items',
      value: analytics?.low_stock_items || 0,
      icon: Package,
      color: '#8C2A2A',
      testId: 'stat-low-stock'
    }
  ];

  return (
    <Layout>
      <div
        className="space-y-8 relative min-h-screen -m-8 p-8"
        data-testid="dashboard-page"
        style={{
          backgroundImage: 'url(https://customer-assets.emergentagent.com/job_beauty-billing-4/artifacts/mmkels33_hairdressing-tools-arranged-on-a-shelf-in-soft-light-for-styling-services-photo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" style={{ zIndex: 0 }} />

        <div className="relative space-y-8" style={{ zIndex: 1 }}>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-2xl p-6 backdrop-blur-md border border-white/10" style={{ background: 'rgba(0,0,0,0.45)' }} data-testid={stat.testId}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/60 mb-2">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-serif font-bold text-white">{stat.value}</p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${stat.color}30` }}
                  >
                    <Icon size={24} style={{ color: '#D4AF37' }} strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Chart */}
        <div className="rounded-2xl p-6 backdrop-blur-md border border-white/10" style={{ background: 'rgba(0,0,0,0.45)' }} data-testid="revenue-chart">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-serif text-white mb-1">Revenue Trend</h3>
              <p className="text-sm text-white/60">Last 7 days performance</p>
            </div>
            <TrendingUp className="text-[#D4AF37]" size={24} strokeWidth={1.5} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.revenue_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: 'white'
                }}
                formatter={(value) => [`Rs.${value}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={{ fill: '#D4AF37', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl p-6 backdrop-blur-md border border-white/10 cursor-pointer hover:border-[#D4AF37]/50 transition-all" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => window.location.href = '/appointments'} data-testid="quick-action-new-appointment">
            <Calendar className="text-[#D4AF37] mb-3" size={28} strokeWidth={1.5} />
            <h4 className="font-medium text-white mb-1">New Appointment</h4>
            <p className="text-sm text-white/60">Schedule a customer visit</p>
          </div>
          <div className="rounded-2xl p-6 backdrop-blur-md border border-white/10 cursor-pointer hover:border-[#D4AF37]/50 transition-all" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => window.location.href = '/invoices'} data-testid="quick-action-create-invoice">
            <DollarSign className="text-[#D4AF37] mb-3" size={28} strokeWidth={1.5} />
            <h4 className="font-medium text-white mb-1">Create Invoice</h4>
            <p className="text-sm text-white/60">Generate a new bill</p>
          </div>
          <div className="rounded-2xl p-6 backdrop-blur-md border border-white/10 cursor-pointer hover:border-[#D4AF37]/50 transition-all" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => window.location.href = '/customers'} data-testid="quick-action-add-customer">
            <Users className="text-[#D4AF37] mb-3" size={28} strokeWidth={1.5} />
            <h4 className="font-medium text-white mb-1">Add Customer</h4>
            <p className="text-sm text-white/60">Register new customer</p>
          </div>
        </div>

        {/* Alerts */}
        {analytics?.low_stock_items > 0 && (
          <div className="rounded-2xl p-6 backdrop-blur-md border border-[#D4AF37]/30 border-l-4 border-l-[#D4AF37]" style={{ background: 'rgba(0,0,0,0.45)' }} data-testid="low-stock-alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-[#D4AF37] mt-1" size={20} strokeWidth={1.5} />
              <div>
                <h4 className="font-medium text-white mb-1">Low Stock Alert</h4>
                <p className="text-sm text-white/60">
                  {analytics.low_stock_items} item(s) are running low. Please restock soon.
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
