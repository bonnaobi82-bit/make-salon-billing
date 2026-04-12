import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    price: 0,
    category: 'haircut'
  });

  const categories = ['haircut', 'coloring', 'spa', 'nails', 'facial', 'makeup', 'other'];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await authAxios.get('/services');
      setServices(response.data);
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await authAxios.put(`/services/${editingService.id}`, formData);
        toast.success('Service updated successfully');
      } else {
        await authAxios.post('/services', formData);
        toast.success('Service added successfully');
      }
      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await authAxios.delete(`/services/${id}`);
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', duration_minutes: 30, price: 0, category: 'haircut' });
    setEditingService(null);
  };

  const openEditDialog = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      category: service.category
    });
    setDialogOpen(true);
  };

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6" data-testid="services-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Service Catalog</h2>
            <p className="text-sm text-[#6B726C] mt-1">Manage your salon services</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2" data-testid="add-service-button">
                <Plus size={18} />
                Add Service
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Service Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                    data-testid="service-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                    data-testid="service-category-select"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1B3B36] mb-2">Duration (min) *</label>
                    <input
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                      className="input-field"
                      required
                      min="5"
                      data-testid="service-duration-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B3B36] mb-2">Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="input-field"
                      required
                      min="0"
                      step="0.01"
                      data-testid="service-price-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows={3}
                    data-testid="service-description-input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full" data-testid="service-submit-button">
                  {editingService ? 'Update Service' : 'Add Service'}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <p className="text-[#6B726C]">Loading services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="col-span-full text-center py-12" data-testid="no-services-message">
              <p className="text-[#6B726C]">No services found. Add your first service!</p>
            </div>
          ) : (
            Object.keys(groupedServices).map((category) => (
              <div key={category} className="stat-card" data-testid={`service-category-${category}`}>
                <h3 className="text-xs uppercase tracking-wider text-[#6B726C] mb-4">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className="space-y-3">
                  {groupedServices[category].map((service) => (
                    <div
                      key={service.id}
                      className="p-4 bg-[#FBFBF9] rounded-xl border border-[#E8EAE6]"
                      data-testid={`service-card-${service.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-[#1B3B36]">{service.name}</h4>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditDialog(service)}
                            className="p-1 hover:bg-white rounded transition-colors"
                            data-testid={`edit-service-${service.id}`}
                          >
                            <Edit size={14} className="text-[#1B3B36]" />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-1 hover:bg-white rounded transition-colors"
                            data-testid={`delete-service-${service.id}`}
                          >
                            <Trash2 size={14} className="text-[#8C2A2A]" />
                          </button>
                        </div>
                      </div>
                      {service.description && (
                        <p className="text-xs text-[#6B726C] mb-3">{service.description}</p>
                      )}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1 text-xs text-[#6B726C]">
                          <Clock size={12} />
                          {service.duration_minutes} min
                        </div>
                        <p className="text-lg font-serif font-bold text-[#1B3B36]">
                          ₹{service.price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Services;
