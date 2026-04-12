import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon, Clock, User, Check, X, ChevronLeft, ChevronRight, List, Grid3X3, Mail, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // calendar or list
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
      setDetailDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const sendReminder = async (apptId, type) => {
    try {
      await authAxios.post('/notifications/appointment-reminder', {
        appointment_id: apptId,
        notification_type: type
      });
      toast.success(`${type === 'email' ? 'Email' : 'SMS'} reminder sent`);
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to send ${type} reminder`);
    }
  };

  const resetForm = () => {
    setFormData({ customer_id: '', service_ids: [], staff_id: '', appointment_date: '', notes: '' });
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

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#1565C0',
      completed: '#1B5E20',
      cancelled: '#C62828',
      'no-show': '#E65100'
    };
    return colors[status] || '#6B726C';
  };

  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAppointmentsForDay = (day) => {
    return appointments.filter(appt => {
      const apptDate = new Date(appt.appointment_date);
      return isSameDay(apptDate, day);
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Layout>
      <div className="space-y-6" data-testid="appointments-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Appointments</h2>
            <p className="text-sm text-[#6B726C] mt-1">Manage salon appointments</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center bg-[#F0F2EE] rounded-full p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-full transition-all ${viewMode === 'calendar' ? 'bg-[#1B3B36] text-white' : 'text-[#6B726C] hover:text-[#1B3B36]'}`}
                data-testid="calendar-view-toggle"
                title="Calendar View"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${viewMode === 'list' ? 'bg-[#1B3B36] text-white' : 'text-[#6B726C] hover:text-[#1B3B36]'}`}
                data-testid="list-view-toggle"
                title="List View"
              >
                <List size={16} />
              </button>
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
                          {service.name} - Rs.{service.price} ({service.duration_minutes}min)
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
        </div>

        {/* CALENDAR VIEW */}
        {viewMode === 'calendar' && (
          <div className="stat-card" data-testid="calendar-view">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors"
                data-testid="prev-month-button"
              >
                <ChevronLeft size={20} className="text-[#1B3B36]" />
              </button>
              <h3 className="text-xl font-serif text-[#1B3B36]" data-testid="current-month-label">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors"
                data-testid="next-month-button"
              >
                <ChevronRight size={20} className="text-[#1B3B36]" />
              </button>
            </div>

            {/* Week Day Headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {weekDays.map((day) => (
                <div key={day} className="text-center py-2 text-xs font-semibold uppercase tracking-wider text-[#6B726C]">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-[#E8EAE6] rounded-xl overflow-hidden">
              {calendarDays.map((day, idx) => {
                const dayAppointments = getAppointmentsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 ${isCurrentMonth ? 'bg-white' : 'bg-[#FBFBF9]'} ${isCurrentDay ? 'ring-2 ring-inset ring-[#D4AF37]' : ''}`}
                    data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                  >
                    <p className={`text-xs font-medium mb-1 ${isCurrentDay ? 'text-[#D4AF37] font-bold' : isCurrentMonth ? 'text-[#1B3B36]' : 'text-[#6B726C]/50'}`}>
                      {format(day, 'd')}
                    </p>
                    <div className="space-y-1">
                      {dayAppointments.slice(0, 3).map((appt) => (
                        <button
                          key={appt.id}
                          onClick={() => { setSelectedAppointment(appt); setDetailDialogOpen(true); }}
                          className="w-full text-left p-1 rounded text-[10px] leading-tight truncate transition-all hover:opacity-80"
                          style={{
                            backgroundColor: `${getStatusColor(appt.status)}18`,
                            color: getStatusColor(appt.status),
                            borderLeft: `2px solid ${getStatusColor(appt.status)}`
                          }}
                          data-testid={`calendar-appointment-${appt.id}`}
                        >
                          <span className="font-medium">{format(new Date(appt.appointment_date), 'HH:mm')}</span>{' '}
                          {getCustomerName(appt.customer_id)}
                        </button>
                      ))}
                      {dayAppointments.length > 3 && (
                        <p className="text-[10px] text-[#6B726C] pl-1">+{dayAppointments.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
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
                          <span className={getStatusBadge(appt.status)}>{appt.status}</span>
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
                            <button
                              onClick={() => { setSelectedAppointment(appt); setDetailDialogOpen(true); }}
                              className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors"
                              title="View details"
                              data-testid={`view-appointment-${appt.id}`}
                            >
                              <CalendarIcon size={16} className="text-[#1B3B36]" />
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
        )}

        {/* Appointment Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Appointment Details</DialogTitle>
            </DialogHeader>
            {selectedAppointment && (
              <div className="space-y-4">
                <div className="p-4 bg-[#FBFBF9] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B726C]">Status</span>
                    <span className={getStatusBadge(selectedAppointment.status)}>{selectedAppointment.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B726C]">Date & Time</span>
                    <span className="text-sm font-medium text-[#1B3B36]">
                      {format(new Date(selectedAppointment.appointment_date), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B726C]">Customer</span>
                    <span className="text-sm font-medium text-[#1B3B36]">{getCustomerName(selectedAppointment.customer_id)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B726C]">Services</span>
                    <span className="text-sm text-[#1B3B36]">{getServiceNames(selectedAppointment.service_ids)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B726C]">Staff</span>
                    <span className="text-sm text-[#1B3B36]">{getStaffName(selectedAppointment.staff_id)}</span>
                  </div>
                  {selectedAppointment.notes && (
                    <div>
                      <span className="text-sm text-[#6B726C]">Notes</span>
                      <p className="text-sm text-[#1B3B36] mt-1">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {selectedAppointment.status === 'scheduled' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(selectedAppointment.id, 'completed')}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                        data-testid="detail-complete-button"
                      >
                        <Check size={16} />
                        Mark Completed
                      </button>
                      <button
                        onClick={() => updateStatus(selectedAppointment.id, 'cancelled')}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#FFEBEE] text-[#C62828] rounded-full px-4 py-2.5 text-sm font-medium transition-all hover:bg-[#FFCDD2]"
                        data-testid="detail-cancel-button"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>

                    {/* Send Reminders */}
                    <div className="pt-3 border-t border-[#E8EAE6]">
                      <p className="text-xs text-[#6B726C] mb-2 uppercase tracking-wider font-medium">Send Reminder</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendReminder(selectedAppointment.id, 'email')}
                          className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                          data-testid="send-email-reminder-button"
                        >
                          <Mail size={14} />
                          Email
                        </button>
                        <button
                          onClick={() => sendReminder(selectedAppointment.id, 'sms')}
                          className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm"
                          data-testid="send-sms-reminder-button"
                        >
                          <Phone size={14} />
                          SMS
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Appointments;
