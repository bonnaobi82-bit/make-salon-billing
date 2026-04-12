import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon, Clock, User, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    service_ids: [],
    staff_id: '',
    appointment_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apptRes, custRes, servRes, staffRes] = await Promise.all([
        authAxios.get('/appointments'),
        authAxios.get('/customers'),
        authAxios.get('/services'),
        authAxios.get('/staff')
      ]);
      setAppointments(apptRes.data);
      setCustomers(custRes.data);
      setServices(servRes.data);
      setStaff(staffRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authAxios.post('/appointments', formData);
      toast.success('Appointment scheduled successfully');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to schedule appointment');
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await authAxios.put(`/appointments/${id}?status=${status}`);
      toast.success('Appointment status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      service_ids: [],
      staff_id: '',
      appointment_date: '',
      notes: ''
    });
  };

  const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'Unknown';
  const getStaffName = (id) => staff.find(s => s.id === id)?.name || 'Unknown';
  const getServiceNames = (ids) => ids.map(id => services.find(s => s.id === id)?.name || 'Unknown').join(', ');

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: 'badge badge-info',
      completed: 'badge badge-success',
      cancelled: 'badge badge-danger',
      'no-show': 'badge badge-warning'
    };
    return badges[status] || 'badge';
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="appointments-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Appointments</h2>
            <p className="text-sm text-[#6B726C] mt-1">Manage salon appointments</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2" data-testid="add-appointment-button">
                <Plus size={18} />
                New Appointment
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Customer *</label>
                  <select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="input-field"
                    required
                    data-testid="appointment-customer-select"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Services *</label>
                  <select
                    multiple
                    value={formData.service_ids}
                    onChange={(e) => setFormData({ ...formData, service_ids: Array.from(e.target.selectedOptions, option => option.value) })}
                    className="input-field"
                    required
                    size={4}
                    data-testid="appointment-services-select"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ₹{service.price} ({service.duration_minutes}min)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#6B726C] mt-1">Hold Ctrl/Cmd to select multiple services</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Staff Member *</label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="input-field"
                    required
                    data-testid="appointment-staff-select"
                  >
                    <option value="">Select Staff</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.specialization && `- ${s.specialization}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="input-field"
                    required
                    data-testid="appointment-datetime-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows={2}
                    data-testid="appointment-notes-input"
                  />
                </div>
                <button type="submit" className="btn-primary w-full" data-testid="appointment-submit-button">
                  Schedule Appointment
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="stat-card">
          <div className="table-container">
            <table className="data-table" data-testid="appointments-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Services</th>
                  <th>Staff</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">Loading...</td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8" data-testid="no-appointments-message">
                      No appointments found
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => (
                    <tr key={appt.id} data-testid={`appointment-row-${appt.id}`}>
                      <td>
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={14} className="text-[#6B726C]" />
                          {format(new Date(appt.appointment_date), 'MMM dd, yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="font-medium text-[#1B3B36]">{getCustomerName(appt.customer_id)}</td>
                      <td className="text-sm">{getServiceNames(appt.service_ids)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-[#6B726C]" />
                          {getStaffName(appt.staff_id)}
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadge(appt.status)}>
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {appt.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => updateStatus(appt.id, 'completed')}
                                className="p-2 hover:bg-[#D4F4DD] rounded-lg transition-colors"
                                title="Mark as completed"
                                data-testid={`complete-appointment-${appt.id}`}
                              >
                                <Check size={16} className="text-[#1B5E20]" />
                              </button>
                              <button
                                onClick={() => updateStatus(appt.id, 'cancelled')}
                                className="p-2 hover:bg-[#FFEBEE] rounded-lg transition-colors"
                                title="Cancel appointment"
                                data-testid={`cancel-appointment-${appt.id}`}
                              >
                                <X size={16} className="text-[#8C2A2A]" />
                              </button>
                            </>
                          )}
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

export default Appointments;
