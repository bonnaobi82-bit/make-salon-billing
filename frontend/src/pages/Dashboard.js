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
      <div className="space-y-8" data-testid="dashboard-page">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="stat-card" data-testid={stat.testId}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#6B726C] mb-2">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-serif font-bold text-[#1B3B36]">{stat.value}</p>
                  </div>
                  <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <Icon size={24} style={{ color: stat.color }} strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Chart */}
        <div className="stat-card" data-testid="revenue-chart">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-serif text-[#1B3B36] mb-1">Revenue Trend</h3>
              <p className="text-sm text-[#6B726C]">Last 7 days performance</p>
            </div>
            <TrendingUp className="text-[#D4AF37]" size={24} strokeWidth={1.5} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.revenue_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EAE6" />
              <XAxis
                dataKey="date"
                stroke="#6B726C"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#6B726C" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E8EAE6',
                  borderRadius: '0.75rem',
                  fontSize: '12px'
                }}
                formatter={(value) => [`₹${value}`, 'Revenue']}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1B3B36"
                strokeWidth={2}
                dot={{ fill: '#D4AF37', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card cursor-pointer" onClick={() => window.location.href = '/appointments'} data-testid="quick-action-new-appointment">
            <Calendar className="text-[#1B3B36] mb-3" size={28} strokeWidth={1.5} />
            <h4 className="font-medium text-[#1B3B36] mb-1">New Appointment</h4>
            <p className="text-sm text-[#6B726C]">Schedule a customer visit</p>
          </div>
          <div className="stat-card cursor-pointer" onClick={() => window.location.href = '/invoices'} data-testid="quick-action-create-invoice">
            <DollarSign className="text-[#D4AF37] mb-3" size={28} strokeWidth={1.5} />
            <h4 className="font-medium text-[#1B3B36] mb-1">Create Invoice</h4>
            <p className="text-sm text-[#6B726C]">Generate a new bill</p>
          </div>
          <div className="stat-card cursor-pointer" onClick={() => window.location.href = '/customers'} data-testid="quick-action-add-customer">
            <Users className="text-[#1B3B36] mb-3" size={28} strokeWidth={1.5} />
            <h4 className="font-medium text-[#1B3B36] mb-1">Add Customer</h4>
            <p className="text-sm text-[#6B726C]">Register new customer</p>
          </div>
        </div>

        {/* Alerts */}
        {analytics?.low_stock_items > 0 && (
          <div className="stat-card border-l-4 border-[#8C2A2A]" data-testid="low-stock-alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-[#8C2A2A] mt-1" size={20} strokeWidth={1.5} />
              <div>
                <h4 className="font-medium text-[#1B3B36] mb-1">Low Stock Alert</h4>
                <p className="text-sm text-[#6B726C]">
                  {analytics.low_stock_items} item(s) are running low. Please restock soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
