import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Phone, Mail, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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
      const response = await authAxios.get('/customers');
      setCustomers(response.data);
      setFilteredCustomers(response.data);
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
                  <th>Email</th>
                  <th>Total Visits</th>
                  <th>Total Spent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">Loading...</td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8" data-testid="no-customers-message">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id} data-testid={`customer-row-${customer.id}`}>
                      <td className="font-medium text-[#1B3B36]">{customer.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-[#6B726C]" />
                          {customer.phone}
                        </div>
                      </td>
                      <td>
                        {customer.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-[#6B726C]" />
                            {customer.email}
                          </div>
                        )}
                      </td>
                      <td>{customer.total_visits}</td>
                      <td className="font-medium">₹{customer.total_spent.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
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
      </div>
    </Layout>
  );
};

export default Customers;
