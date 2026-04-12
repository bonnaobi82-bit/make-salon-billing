import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Mail, Bell, Key, Store, Save, Check } from 'lucide-react';

const Settings = () => {
  const [salonProfile, setSalonProfile] = useState({
    salon_name: '',
    address: '',
    phone: '',
    email: '',
    gst_number: ''
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSalonProfile();
  }, []);

  const fetchSalonProfile = async () => {
    try {
      const response = await authAxios.get('/salon-profile');
      setSalonProfile({
        salon_name: response.data.salon_name || '',
        address: response.data.address || '',
        phone: response.data.phone || '',
        email: response.data.email || '',
        gst_number: response.data.gst_number || ''
      });
    } catch (error) {
      toast.error('Failed to load salon profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAxios.put('/salon-profile', salonProfile);
      toast.success('Salon profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      await authAxios.post('/notifications/send-email', {
        recipient_email: 'test@example.com',
        subject: 'Test Email from Salon Suite',
        html_content: '<h1>Test Email</h1><p>Your email configuration is working!</p>'
      });
      toast.success('Test email sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Email service not configured. Please add RESEND_API_KEY to backend/.env');
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="settings-page">
        <div>
          <h2 className="text-2xl font-serif text-[#1B3B36]">Settings</h2>
          <p className="text-sm text-[#6B726C] mt-1">Configure your salon application</p>
        </div>

        {/* Salon Profile */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#D4AF37]/15">
              <Store size={24} className="text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-serif text-[#1B3B36]">Salon Profile</h3>
              <p className="text-sm text-[#6B726C]">Your salon details shown on invoices and printouts</p>
            </div>
          </div>

          {profileLoading ? (
            <p className="text-sm text-[#6B726C]">Loading profile...</p>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Salon Name *</label>
                  <input
                    type="text"
                    value={salonProfile.salon_name}
                    onChange={(e) => setSalonProfile({ ...salonProfile, salon_name: e.target.value })}
                    className="input-field"
                    required
                    data-testid="salon-name-input"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Address *</label>
                  <textarea
                    value={salonProfile.address}
                    onChange={(e) => setSalonProfile({ ...salonProfile, address: e.target.value })}
                    className="input-field"
                    rows={2}
                    required
                    data-testid="salon-address-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={salonProfile.phone}
                    onChange={(e) => setSalonProfile({ ...salonProfile, phone: e.target.value })}
                    className="input-field"
                    required
                    data-testid="salon-phone-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Email</label>
                  <input
                    type="email"
                    value={salonProfile.email}
                    onChange={(e) => setSalonProfile({ ...salonProfile, email: e.target.value })}
                    className="input-field"
                    data-testid="salon-email-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">GST Number</label>
                  <input
                    type="text"
                    value={salonProfile.gst_number}
                    onChange={(e) => setSalonProfile({ ...salonProfile, gst_number: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    data-testid="salon-gst-input"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary flex items-center gap-2"
                disabled={saving}
                data-testid="save-salon-profile-button"
              >
                {saving ? <Save size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          )}
        </div>

        {/* Email Settings */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#1B3B36]/10">
              <Mail size={24} className="text-[#1B3B36]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-serif text-[#1B3B36]">Email Notifications</h3>
              <p className="text-sm text-[#6B726C]">Configure email settings for appointment reminders</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[#FFF4E6] border border-[#FFE0B2] rounded-xl">
              <h4 className="font-medium text-[#E65100] mb-2 text-sm">Configuration Required</h4>
              <p className="text-sm text-[#6B726C] mb-3">
                To enable email notifications, add your Resend API key to the backend environment.
              </p>
              <p className="text-xs text-[#6B726C]">
                Get your free API key from <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-[#1B3B36] underline">resend.com</a>
              </p>
            </div>
            <button onClick={handleTestEmail} className="btn-secondary" data-testid="test-email-button">
              Send Test Email
            </button>
          </div>
        </div>

        {/* SMS Settings */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#1B3B36]/10">
              <Bell size={24} className="text-[#1B3B36]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-lg font-serif text-[#1B3B36]">SMS Notifications</h3>
              <p className="text-sm text-[#6B726C]">Configure SMS settings for appointment reminders</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[#FFF4E6] border border-[#FFE0B2] rounded-xl">
              <h4 className="font-medium text-[#E65100] mb-2 text-sm">Configuration Required</h4>
              <p className="text-sm text-[#6B726C] mb-3">
                To enable SMS notifications, add your Twilio credentials to the backend environment.
              </p>
              <p className="text-xs text-[#6B726C]">
                Get your credentials from <a href="https://twilio.com" target="_blank" rel="noopener noreferrer" className="text-[#1B3B36] underline">twilio.com</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
