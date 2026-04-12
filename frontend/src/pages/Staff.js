import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Plus, Edit, Phone, Mail, DollarSign, TrendingUp, Banknote } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    commission_rate: 0
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await authAxios.get('/staff');
      setStaff(response.data);
    } catch (error) {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await authAxios.put(`/staff/${editingStaff.id}`, formData);
        toast.success('Staff updated successfully');
      } else {
        await authAxios.post('/staff', formData);
        toast.success('Staff added successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchStaff();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', specialization: '', commission_rate: 0 });
    setEditingStaff(null);
  };

  const openEditDialog = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      phone: staffMember.phone,
      email: staffMember.email || '',
      specialization: staffMember.specialization || '',
      commission_rate: staffMember.commission_rate
    });
    setDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="staff-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Staff Management</h2>
            <p className="text-sm text-[#6B726C] mt-1">Manage your salon team</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2" data-testid="add-staff-button">
                <Plus size={18} />
                Add Staff
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
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
                    data-testid="staff-name-input"
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
                    data-testid="staff-phone-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    data-testid="staff-email-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Hair Stylist, Nail Artist"
                    data-testid="staff-specialization-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                    className="input-field"
                    min="0"
                    max="100"
                    step="0.1"
                    data-testid="staff-commission-input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full" data-testid="staff-submit-button">
                  {editingStaff ? 'Update Staff' : 'Add Staff'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-[#6B726C]">Loading staff...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="col-span-full text-center py-12" data-testid="no-staff-message">
              <p className="text-[#6B726C]">No staff members found. Add your first staff member!</p>
            </div>
          ) : (
            staff.map((member) => (
              <div key={member.id} className="stat-card" data-testid={`staff-card-${member.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1B3B36] flex items-center justify-center text-white font-medium text-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-[#1B3B36]">{member.name}</h3>
                      {member.specialization && (
                        <p className="text-xs text-[#6B726C]">{member.specialization}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openEditDialog(member)}
                    className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors"
                    data-testid={`edit-staff-${member.id}`}
                  >
                    <Edit size={16} className="text-[#1B3B36]" />
                  </button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#6B726C]">
                    <Phone size={14} />
                    {member.phone}
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-2 text-[#6B726C]">
                      <Mail size={14} />
                      {member.email}
                    </div>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="mt-4 pt-4 border-t border-[#E8EAE6] grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-serif font-bold text-[#1B3B36]">{member.total_services || 0}</p>
                    <p className="text-[9px] text-[#6B726C] uppercase tracking-wider">Services</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-serif font-bold text-[#1B3B36]">Rs.{((member.total_revenue || 0) / 1000).toFixed(1)}k</p>
                    <p className="text-[9px] text-[#6B726C] uppercase tracking-wider">Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-serif font-bold text-[#D4AF37]">Rs.{(member.incentive_balance || 0).toFixed(0)}</p>
                    <p className="text-[9px] text-[#6B726C] uppercase tracking-wider">Incentive</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-[#6B726C]">Commission: {member.commission_rate}%</span>
                  {(member.incentive_balance || 0) > 0 && (
                    <button
                      onClick={() => { setSelectedStaff(member); setPayoutAmount(member.incentive_balance || 0); setPayoutNotes(''); setPayoutDialogOpen(true); }}
                      className="text-xs text-[#D4AF37] hover:text-[#B8960B] flex items-center gap-1 font-medium"
                      data-testid={`payout-staff-${member.id}`}
                    >
                      <Banknote size={13} />
                      Pay Out
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payout Dialog */}
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pay Incentive</DialogTitle>
            </DialogHeader>
            {selectedStaff && (
              <div className="space-y-4">
                <div className="p-4 bg-[#FBFBF9] rounded-xl text-center">
                  <p className="text-sm text-[#6B726C]">Paying incentive to</p>
                  <p className="text-lg font-medium text-[#1B3B36]">{selectedStaff.name}</p>
                  <p className="text-2xl font-serif font-bold text-[#D4AF37] mt-2">Rs.{(selectedStaff.incentive_balance || 0).toFixed(2)}</p>
                  <p className="text-xs text-[#6B726C]">Available Balance</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Payout Amount (Rs.)</label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                    className="input-field"
                    min={0}
                    max={selectedStaff.incentive_balance || 0}
                    step={0.01}
                    data-testid="payout-amount-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Notes</label>
                  <input
                    type="text"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    className="input-field"
                    placeholder="e.g., Monthly payout"
                    data-testid="payout-notes-input"
                  />
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await authAxios.post('/staff/payout-incentive', {
                        staff_id: selectedStaff.id,
                        amount: payoutAmount,
                        notes: payoutNotes
                      });
                      toast.success(res.data.message);
                      setPayoutDialogOpen(false);
                      fetchStaff();
                    } catch (error) {
                      toast.error(error.response?.data?.detail || 'Payout failed');
                    }
                  }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  data-testid="confirm-payout-button"
                >
                  <Banknote size={16} />
                  Confirm Payout
                </button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Staff;
