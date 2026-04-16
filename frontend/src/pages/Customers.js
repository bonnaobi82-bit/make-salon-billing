import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Phone, Mail, Search, Star, Gift, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loyaltyDialogOpen, setLoyaltyDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(100);
  const [salonProfile, setSalonProfile] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery) ||
          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const fetchCustomers = async () => {
    try {
      const [custRes, profileRes] = await Promise.all([
        authAxios.get('/customers'),
        authAxios.get('/salon-profile')
      ]);
      setCustomers(custRes.data);
      setFilteredCustomers(custRes.data);
      setSalonProfile(profileRes.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await authAxios.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await authAxios.post('/customers', formData);
        toast.success('Customer added successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await authAxios.delete(`/customers/${id}`);
      toast.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setEditingCustomer(null);
  };

  const openEditDialog = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      notes: customer.notes || ''
    });
    setDialogOpen(true);
  };

  const getTierBadge = (tier) => {
    const styles = {
      bronze: 'bg-[#F0E6D3] text-[#8B6914]',
      silver: 'bg-[#E8E8E8] text-[#555]',
      gold: 'bg-[#FFF4D4] text-[#B8860B]',
      platinum: 'bg-[#E8EAF6] text-[#3F51B5]'
    };
    return styles[tier] || styles.bronze;
  };

  const openLoyaltyDialog = (customer) => {
    setSelectedCustomer(customer);
    setRedeemPoints(100);
    setLoyaltyDialogOpen(true);
  };

  const handleRedeem = async () => {
    if (!selectedCustomer) return;
    try {
      const response = await authAxios.post('/loyalty/redeem', {
        customer_id: selectedCustomer.id,
        points_to_redeem: redeemPoints
      });
      toast.success(response.data.message);
      setLoyaltyDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to redeem points');
    }
  };

  const sendWelcomeWhatsApp = (customer) => {
    if (!customer?.phone) {
      toast.error('Customer has no phone number');
      return;
    }
    let digits = customer.phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) digits = '91' + digits.slice(1);
    if (!digits.startsWith('91') && digits.length === 10) digits = '91' + digits;

    const salonName = salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin';
    const salonAddr = salonProfile?.address || 'Thangmeiband Sanakeithel Road, Manipur, Imphal -795001';
    const salonPhone = salonProfile?.phone || '6909902650';

    const message = [
      `Hello *${customer.name}*! Welcome to *${salonName}*`,
      ``,
      `We're thrilled to have you as our valued customer!`,
      ``,
      `As a member, you'll enjoy:`,
      `- Loyalty points on every visit (1 pt per Rs.10)`,
      `- Exclusive tier upgrades (Bronze > Silver > Gold > Platinum)`,
      `- Redeem points for discounts`,
      ``,
      `Visit us at:`,
      `${salonAddr}`,
      ``,
      `Book appointments: ${salonPhone}`,
      ``,
      `Thank you for choosing us!`
    ].join('\n');

    window.open(`https://web.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`, '_blank');
    toast.success('WhatsApp opened with welcome message');
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="customers-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Customer Management</h2>
            <p className="text-sm text-[#6B726C] mt-1">Manage your salon customers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2" data-testid="add-customer-button">
                <Plus size={18} />
                Add Customer
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                    data-testid="customer-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    required
                    data-testid="customer-phone-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    data-testid="customer-email-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows={3}
                    data-testid="customer-notes-input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full" data-testid="customer-submit-button">
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B726C]" size={18} />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                data-testid="customer-search-input"
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table" data-testid="customers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Tier</th>
                  <th>Points</th>
                  <th>Visits</th>
                  <th>Total Spent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8">Loading...</td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8" data-testid="no-customers-message">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} data-testid={`customer-row-${customer.id}`}>
                      <td>
                        <div>
                          <p className="font-medium text-[#1B3B36]">{customer.name}</p>
                          {customer.email && <p className="text-xs text-[#6B726C]">{customer.email}</p>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-[#6B726C]" />
                          {customer.phone}
                        </div>
                      </td>
                      <td>
                        <span className={`badge capitalize ${getTierBadge(customer.membership_tier || 'bronze')}`}>
                          {customer.membership_tier || 'bronze'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Star size={13} className="text-[#D4AF37]" fill="#D4AF37" />
                          <span className="font-medium text-[#1B3B36]">{customer.loyalty_points || 0}</span>
                        </div>
                      </td>
                      <td>{customer.total_visits}</td>
                      <td className="font-medium">Rs.{(customer.total_spent || 0).toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => sendWelcomeWhatsApp(customer)}
                            className="p-2 hover:bg-[#dcf8c6] rounded-lg transition-colors"
                            title="Send Welcome via WhatsApp"
                            data-testid={`whatsapp-customer-${customer.id}`}
                          >
                            <MessageCircle size={16} className="text-[#25D366]" />
                          </button>
                          <button
                            onClick={() => openLoyaltyDialog(customer)}
                            className="p-2 hover:bg-[#FFF4D4] rounded-lg transition-colors"
                            title="Loyalty & Redeem"
                            data-testid={`loyalty-customer-${customer.id}`}
                          >
                            <Gift size={16} className="text-[#D4AF37]" />
                          </button>
                          <button
                            onClick={() => openEditDialog(customer)}
                            className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors"
                            data-testid={`edit-customer-${customer.id}`}
                          >
                            <Edit size={16} className="text-[#1B3B36]" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 hover:bg-[#FFEBEE] rounded-lg transition-colors"
                            data-testid={`delete-customer-${customer.id}`}
                          >
                            <Trash2 size={16} className="text-[#8C2A2A]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loyalty Dialog */}
        <Dialog open={loyaltyDialogOpen} onOpenChange={setLoyaltyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Customer Loyalty</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-5">
                <div className="text-center p-5 bg-[#FBFBF9] rounded-xl">
                  <div className="w-14 h-14 rounded-full bg-[#1B3B36] flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-medium text-[#1B3B36] text-lg">{selectedCustomer.name}</h3>
                  <span className={`badge capitalize mt-2 inline-block ${getTierBadge(selectedCustomer.membership_tier || 'bronze')}`}>
                    {selectedCustomer.membership_tier || 'bronze'} Member
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-[#FFF4D4] rounded-xl">
                    <Star size={20} className="text-[#D4AF37] mx-auto mb-1" fill="#D4AF37" />
                    <p className="text-xl font-serif font-bold text-[#1B3B36]">{selectedCustomer.loyalty_points || 0}</p>
                    <p className="text-[10px] text-[#6B726C] uppercase tracking-wider">Points</p>
                  </div>
                  <div className="text-center p-3 bg-[#F0F2EE] rounded-xl">
                    <p className="text-xl font-serif font-bold text-[#1B3B36]">{selectedCustomer.total_visits}</p>
                    <p className="text-[10px] text-[#6B726C] uppercase tracking-wider">Visits</p>
                  </div>
                  <div className="text-center p-3 bg-[#F0F2EE] rounded-xl">
                    <p className="text-xl font-serif font-bold text-[#1B3B36]">Rs.{(selectedCustomer.total_spent || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-[#6B726C] uppercase tracking-wider">Spent</p>
                  </div>
                </div>

                <div className="p-4 border border-[#E8EAE6] rounded-xl">
                  <h4 className="text-sm font-medium text-[#1B3B36] mb-1">Tier Progress</h4>
                  <p className="text-xs text-[#6B726C] mb-3">Bronze &lt; Rs.5K | Silver &lt; Rs.20K | Gold &lt; Rs.50K | Platinum Rs.50K+</p>
                  <div className="w-full bg-[#E8EAE6] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(((selectedCustomer.total_spent || 0) / 50000) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #D4AF37, #1B3B36)'
                      }}
                    />
                  </div>
                </div>

                {(selectedCustomer.loyalty_points || 0) >= 100 && (
                  <div className="p-4 border border-[#D4AF37]/30 bg-[#FBFBF9] rounded-xl">
                    <h4 className="text-sm font-medium text-[#1B3B36] mb-2">Redeem Points</h4>
                    <p className="text-xs text-[#6B726C] mb-3">100 points = Rs.50 discount. Min 100 points to redeem.</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={redeemPoints}
                        onChange={(e) => setRedeemPoints(Math.max(100, parseInt(e.target.value) || 100))}
                        min={100}
                        max={selectedCustomer.loyalty_points || 0}
                        step={100}
                        className="input-field w-32"
                        data-testid="redeem-points-input"
                      />
                      <span className="text-sm text-[#6B726C]">= Rs.{((redeemPoints / 100) * 50).toFixed(0)} off</span>
                      <button
                        onClick={handleRedeem}
                        className="btn-primary text-sm"
                        data-testid="redeem-points-button"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-[#E3F2FD] border border-[#BBDEFB] rounded-xl">
                  <p className="text-xs text-[#1565C0]">Earn 1 point for every Rs.10 spent. Points auto-accumulate on each invoice.</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Customers;
