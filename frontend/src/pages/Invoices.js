import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { authAxios, API } from '@/App';
import { toast } from 'sonner';
import { Plus, Eye, FileText, Download, Printer, Send, Mail, Phone, UserPlus, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [salonProfile, setSalonProfile] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    staff_id: '',
    items: [],
    discount: 0,
    payment_method: 'cash',
    notes: ''
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', notes: '' });
  const [addingCustomer, setAddingCustomer] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, custRes, servRes, staffRes, profileRes] = await Promise.all([
        authAxios.get('/invoices'),
        authAxios.get('/customers'),
        authAxios.get('/services'),
        authAxios.get('/staff'),
        authAxios.get('/salon-profile')
      ]);
      setInvoices(invRes.data);
      setCustomers(custRes.data);
      setServices(servRes.data);
      setStaff(staffRes.data);
      setSalonProfile(profileRes.data);
      // Load logo
      if (profileRes.data.logo_path) {
        try {
          const token = localStorage.getItem('token');
          const logoRes = await fetch(`${API}/files/${profileRes.data.logo_path}?auth=${token}`);
          if (logoRes.ok) {
            const blob = await logoRes.blob();
            setLogoUrl(URL.createObjectURL(blob));
          }
        } catch (err) {
          console.error('Failed to load logo', err);
        }
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addServiceToInvoice = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
    }
  };

  const removeServiceFromInvoice = (index) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const updateServiceQuantity = (index, quantity) => {
    const updated = [...selectedServices];
    updated[index].quantity = parseInt(quantity);
    setSelectedServices(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast.error('Please add at least one service');
      return;
    }

    const items = selectedServices.map(s => ({
      service_id: s.id,
      quantity: s.quantity,
      price: s.price
    }));

    try {
      const response = await authAxios.post('/invoices', { ...formData, items });
      const createdInvoice = response.data;
      toast.success('Invoice created successfully');
      setDialogOpen(false);

      // Auto-send via WhatsApp
      const customer = customers.find(c => c.id === formData.customer_id);
      if (customer?.phone) {
        let digits = customer.phone.replace(/[^0-9]/g, '');
        if (digits.startsWith('0')) digits = '91' + digits.slice(1);
        if (!digits.startsWith('91') && digits.length === 10) digits = '91' + digits;

        const salonName = salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin';
        const salonPhone = salonProfile?.phone || '6909902650';
        const staffName = formData.staff_id ? (staff.find(s => s.id === formData.staff_id)?.name || '') : '';

        const itemLines = selectedServices.map((s, i) =>
          `  ${i + 1}. ${s.name} x${s.quantity} - Rs.${(s.price * s.quantity).toFixed(2)}`
        ).join('\n');

        const subtotal = selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0);
        const discount = formData.discount || 0;
        const tax = (subtotal - discount) * 0.18;
        const total = subtotal - discount + tax;

        const message = [
          `*${salonName}*`,
          `Invoice: *${createdInvoice.invoice_number}*`,
          `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
          ``,
          `Dear *${customer.name}*,`,
          ``,
          `Thank you for visiting us! Here's your bill:`,
          ``,
          `*Services:*`,
          itemLines,
          ``,
          `Subtotal: Rs.${subtotal.toFixed(2)}`,
          discount > 0 ? `Discount: -Rs.${discount.toFixed(2)}` : '',
          `Tax (18%): Rs.${tax.toFixed(2)}`,
          `*Total: Rs.${total.toFixed(2)}*`,
          `Payment: ${formData.payment_method.toUpperCase()}`,
          staffName ? `Served by: ${staffName}` : '',
          ``,
          `We look forward to seeing you again!`,
          `Call us: ${salonPhone}`
        ].filter(Boolean).join('\n');

        window.open(`https://web.whatsapp.com/send?phone=${digits}&text=${encodeURIComponent(message)}`, '_blank');
      }

      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const resetForm = () => {
    setFormData({ customer_id: '', staff_id: '', items: [], discount: 0, payment_method: 'cash', notes: '' });
    setSelectedServices([]);
    setShowAddCustomer(false);
    setNewCustomer({ name: '', phone: '', email: '', notes: '' });
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      toast.error('Customer name and phone are required');
      return;
    }
    setAddingCustomer(true);
    try {
      const response = await authAxios.post('/customers', newCustomer);
      const created = response.data;
      setCustomers([...customers, created]);
      setFormData({ ...formData, customer_id: created.id });
      setShowAddCustomer(false);
      setNewCustomer({ name: '', phone: '', email: '', notes: '' });
      toast.success(`Customer "${created.name}" added`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add customer');
    } finally {
      setAddingCustomer(false);
    }
  };

  const getCustomerName = (id) => customers.find(c => c.id === id)?.name || 'Unknown';
  const getCustomer = (id) => customers.find(c => c.id === id);
  const getServiceName = (id) => services.find(s => s.id === id)?.name || 'Unknown Service';
  const getStaffName = (id) => staff.find(s => s.id === id)?.name || '';

  const openViewDialog = (invoice) => {
    setViewInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleDownloadPDF = async (invoiceId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/invoices/${invoiceId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch (error) {
      toast.error('Failed to download PDF');
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${viewInvoice?.invoice_number}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Manrope', sans-serif; color: #1B3B36; padding: 40px; max-width: 800px; margin: 0 auto; }
            .salon-header { text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #D4AF37; }
            .salon-name { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #1B3B36; margin-bottom: 6px; }
            .salon-details { font-size: 12px; color: #6B726C; line-height: 1.6; }
            .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .meta-block { font-size: 13px; line-height: 1.7; }
            .meta-block .label { font-weight: 600; color: #1B3B36; }
            .meta-block .value { color: #6B726C; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { background: #F3F4F1; color: #1B3B36; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; border-bottom: 1px solid #E8EAE6; }
            td { padding: 10px 12px; font-size: 13px; color: #6B726C; border-bottom: 1px solid #E8EAE6; }
            .text-right { text-align: right; }
            .totals-row td { border: none; padding: 5px 12px; }
            .grand-total td { font-weight: 700; font-size: 16px; color: #1B3B36; border-top: 2px solid #D4AF37; padding-top: 12px; }
            .notes-section { margin-top: 20px; padding: 12px; background: #FBFBF9; border-radius: 8px; font-size: 12px; color: #6B726C; }
            .notes-section .label { font-weight: 600; color: #1B3B36; margin-bottom: 4px; }
            .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #6B726C; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatPhoneForWhatsApp = (phone) => {
    // Strip non-digits, ensure country code
    let digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) digits = '91' + digits.slice(1);
    if (!digits.startsWith('91') && digits.length === 10) digits = '91' + digits;
    return digits;
  };

  const sendInvoiceWhatsApp = (invoice) => {
    const customer = getCustomer(invoice.customer_id);
    if (!customer?.phone) {
      toast.error('Customer has no phone number');
      return;
    }
    const phone = formatPhoneForWhatsApp(customer.phone);
    const salonName = salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin';
    const salonPhone = salonProfile?.phone || '6909902650';
    const staffName = invoice.staff_id ? getStaffName(invoice.staff_id) : '';

    const itemLines = invoice.items.map((item, i) =>
      `  ${i + 1}. ${getServiceName(item.service_id)} x${item.quantity} - Rs.${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const message = [
      `*${salonName}*`,
      `Invoice: *${invoice.invoice_number}*`,
      `Date: ${format(new Date(invoice.created_at), 'dd MMM yyyy')}`,
      ``,
      `Dear *${customer.name}*,`,
      ``,
      `Thank you for visiting us! Here's your bill:`,
      ``,
      `*Services:*`,
      itemLines,
      ``,
      `Subtotal: Rs.${invoice.subtotal.toFixed(2)}`,
      invoice.discount > 0 ? `Discount: -Rs.${invoice.discount.toFixed(2)}` : '',
      `Tax (18%): Rs.${invoice.tax.toFixed(2)}`,
      `*Total: Rs.${invoice.total.toFixed(2)}*`,
      `Payment: ${invoice.payment_method.toUpperCase()}`,
      staffName ? `Served by: ${staffName}` : '',
      ``,
      `We look forward to seeing you again!`,
      `Call us: ${salonPhone}`
    ].filter(Boolean).join('\n');

    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp opened with invoice');
  };

  const sendWelcomeWhatsApp = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer?.phone) {
      toast.error('Customer has no phone number');
      return;
    }
    const phone = formatPhoneForWhatsApp(customer.phone);
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

    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp opened with welcome message');
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="invoices-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Invoices</h2>
            <p className="text-sm text-[#6B726C] mt-1">Manage billing and invoices</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <button className="btn-primary flex items-center gap-2" data-testid="create-invoice-button">
                <Plus size={18} />
                Create Invoice
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[#1B3B36]">Customer *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomer(!showAddCustomer)}
                      className="text-xs text-[#1B3B36] hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                      data-testid="toggle-add-customer-inline"
                    >
                      <UserPlus size={13} />
                      {showAddCustomer ? 'Select Existing' : 'Add New'}
                    </button>
                  </div>

                  {!showAddCustomer ? (
                    <select
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="input-field"
                      required
                      data-testid="invoice-customer-select"
                    >
                      <option value="">Select Customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {customer.phone}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-4 border border-[#D4AF37]/30 bg-[#FBFBF9] rounded-xl space-y-3" data-testid="inline-add-customer-form">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-[#6B726C] mb-1">Name *</label>
                          <input
                            type="text"
                            value={newCustomer.name}
                            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                            className="input-field text-sm"
                            placeholder="Customer name"
                            data-testid="inline-customer-name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#6B726C] mb-1">Phone *</label>
                          <input
                            type="tel"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            className="input-field text-sm"
                            placeholder="Phone number"
                            data-testid="inline-customer-phone"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-[#6B726C] mb-1">Email</label>
                        <input
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          className="input-field text-sm"
                          placeholder="Email (optional)"
                          data-testid="inline-customer-email"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomer}
                        disabled={addingCustomer}
                        className="btn-primary text-sm w-full flex items-center justify-center gap-2"
                        data-testid="inline-add-customer-button"
                      >
                        <UserPlus size={14} />
                        {addingCustomer ? 'Adding...' : 'Add Customer & Select'}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Staff Member</label>
                  <select
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="input-field"
                    data-testid="invoice-staff-select"
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
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Add Services</label>
                  <select
                    onChange={(e) => { if (e.target.value) addServiceToInvoice(e.target.value); e.target.value = ''; }}
                    className="input-field"
                    data-testid="invoice-service-select"
                  >
                    <option value="">Select a service to add</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - Rs.{service.price}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedServices.length > 0 && (
                  <div className="border border-[#E8EAE6] rounded-xl p-4">
                    <h4 className="text-sm font-medium text-[#1B3B36] mb-3">Selected Services</h4>
                    <div className="space-y-2">
                      {selectedServices.map((service, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-[#FBFBF9] rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#1B3B36]">{service.name}</p>
                            <p className="text-xs text-[#6B726C]">Rs.{service.price} each</p>
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={service.quantity}
                            onChange={(e) => updateServiceQuantity(index, e.target.value)}
                            className="input-field w-20"
                            data-testid={`service-quantity-${index}`}
                          />
                          <p className="text-sm font-medium text-[#1B3B36] w-24 text-right">
                            Rs.{(service.price * service.quantity).toFixed(2)}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeServiceFromInvoice(index)}
                            className="text-[#8C2A2A] hover:text-[#6B1F1F]"
                            data-testid={`remove-service-${index}`}
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-[#E8EAE6]">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6B726C]">Subtotal</span>
                        <span className="font-medium text-[#1B3B36]">
                          Rs.{selectedServices.reduce((sum, s) => sum + (s.price * s.quantity), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1B3B36] mb-2">Discount (Rs.)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                      className="input-field"
                      min="0"
                      step="0.01"
                      data-testid="invoice-discount-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1B3B36] mb-2">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="input-field"
                      data-testid="invoice-payment-method-select"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1B3B36] mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows={2}
                    data-testid="invoice-notes-input"
                  />
                </div>

                <button type="submit" className="btn-primary w-full" data-testid="invoice-submit-button">
                  Create Invoice
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invoice Table */}
        <div className="stat-card">
          <div className="table-container">
            <table className="data-table" data-testid="invoices-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Staff</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8">Loading...</td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8" data-testid="no-invoices-message">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                      <td className="font-medium text-[#1B3B36]">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-[#6B726C]" />
                          {invoice.invoice_number}
                        </div>
                      </td>
                      <td>{format(new Date(invoice.created_at), 'MMM dd, yyyy')}</td>
                      <td>{getCustomerName(invoice.customer_id)}</td>
                      <td>{invoice.staff_id ? getStaffName(invoice.staff_id) : '-'}</td>
                      <td>{invoice.items.length} item(s)</td>
                      <td className="font-medium">Rs.{invoice.total.toFixed(2)}</td>
                      <td className="capitalize">{invoice.payment_method}</td>
                      <td>
                        <span className="badge badge-success">{invoice.status}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openViewDialog(invoice)}
                            className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors"
                            title="View Invoice"
                            data-testid={`view-invoice-${invoice.id}`}
                          >
                            <Eye size={16} className="text-[#1B3B36]" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(invoice.id)}
                            className="p-2 hover:bg-[#F3F4F1] rounded-lg transition-colors"
                            title="Download PDF"
                            data-testid={`download-pdf-${invoice.id}`}
                          >
                            <Download size={16} className="text-[#D4AF37]" />
                          </button>
                          <button
                            onClick={() => sendInvoiceWhatsApp(invoice)}
                            className="p-2 hover:bg-[#dcf8c6] rounded-lg transition-colors"
                            title="Send via WhatsApp"
                            data-testid={`whatsapp-invoice-${invoice.id}`}
                          >
                            <MessageCircle size={16} className="text-[#25D366]" />
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

        {/* Invoice Detail View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Invoice {viewInvoice?.invoice_number}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewInvoice && sendInvoiceWhatsApp(viewInvoice)}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-[#25D366] text-white hover:bg-[#1da851] transition-all font-medium"
                    data-testid="whatsapp-invoice-from-view-button"
                  >
                    <MessageCircle size={16} />
                    WhatsApp
                  </button>
                  <button
                    onClick={handlePrint}
                    className="btn-secondary flex items-center gap-2 text-sm"
                    data-testid="print-invoice-button"
                  >
                    <Printer size={16} />
                    Print
                  </button>
                  <button
                    onClick={() => viewInvoice && handleDownloadPDF(viewInvoice.id)}
                    className="btn-primary flex items-center gap-2 text-sm"
                    data-testid="download-pdf-from-view-button"
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              </DialogTitle>
            </DialogHeader>

            {viewInvoice && (
              <div ref={printRef}>
                {/* Salon Header */}
                <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #D4AF37' }}>
                  {logoUrl && (
                    <img src={logoUrl} alt="Salon Logo" style={{ height: '60px', maxWidth: '200px', objectFit: 'contain', margin: '0 auto 8px' }} />
                  )}
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 700, color: '#1B3B36', marginBottom: '6px' }}>
                    {salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin'}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#6B726C', lineHeight: 1.6 }}>
                    {salonProfile?.address || 'Thangmeiband Sanakeithel Road, Ma-ke Salon 2nd Floor, Manipur, Imphal -795001'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B726C', lineHeight: 1.6 }}>
                    {[
                      salonProfile?.phone && `Phone: ${salonProfile.phone}`,
                      salonProfile?.email && `Email: ${salonProfile.email}`,
                      salonProfile?.gst_number && `GST: ${salonProfile.gst_number}`
                    ].filter(Boolean).join(' | ')}
                  </p>
                </div>

                {/* Invoice Meta + Customer Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', lineHeight: 1.7 }}>
                    <p><strong style={{ color: '#1B3B36' }}>Invoice #:</strong> <span style={{ color: '#6B726C' }}>{viewInvoice.invoice_number}</span></p>
                    <p><strong style={{ color: '#1B3B36' }}>Date:</strong> <span style={{ color: '#6B726C' }}>{format(new Date(viewInvoice.created_at), 'MMMM dd, yyyy')}</span></p>
                    <p><strong style={{ color: '#1B3B36' }}>Payment:</strong> <span style={{ color: '#6B726C', textTransform: 'uppercase' }}>{viewInvoice.payment_method}</span></p>
                    <p><strong style={{ color: '#1B3B36' }}>Status:</strong> <span className="badge badge-success">{viewInvoice.status}</span></p>
                    {viewInvoice.staff_id && getStaffName(viewInvoice.staff_id) && (
                      <p><strong style={{ color: '#1B3B36' }}>Staff:</strong> <span style={{ color: '#6B726C' }}>{getStaffName(viewInvoice.staff_id)}</span></p>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: 1.7, textAlign: 'right' }}>
                    <p><strong style={{ color: '#1B3B36' }}>Bill To:</strong></p>
                    <p style={{ color: '#6B726C' }}>{getCustomerName(viewInvoice.customer_id)}</p>
                    {getCustomer(viewInvoice.customer_id)?.phone && (
                      <p style={{ color: '#6B726C' }}>Phone: {getCustomer(viewInvoice.customer_id).phone}</p>
                    )}
                    {getCustomer(viewInvoice.customer_id)?.email && (
                      <p style={{ color: '#6B726C' }}>Email: {getCustomer(viewInvoice.customer_id).email}</p>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F3F4F1' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#1B3B36', borderBottom: '1px solid #E8EAE6' }}>#</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#1B3B36', borderBottom: '1px solid #E8EAE6' }}>Service</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#1B3B36', borderBottom: '1px solid #E8EAE6' }}>Qty</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#1B3B36', borderBottom: '1px solid #E8EAE6' }}>Unit Price</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#1B3B36', borderBottom: '1px solid #E8EAE6' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewInvoice.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #E8EAE6' }}>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6B726C' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1B3B36', fontWeight: 500 }}>{getServiceName(item.service_id)}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6B726C', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6B726C', textAlign: 'right' }}>Rs.{item.price.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#1B3B36', textAlign: 'right', fontWeight: 500 }}>Rs.{(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ width: '280px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                      <span style={{ color: '#6B726C' }}>Subtotal</span>
                      <span style={{ color: '#6B726C' }}>Rs.{viewInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                      <span style={{ color: '#6B726C' }}>Discount</span>
                      <span style={{ color: '#6B726C' }}>- Rs.{viewInvoice.discount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                      <span style={{ color: '#6B726C' }}>Tax (18%)</span>
                      <span style={{ color: '#6B726C' }}>Rs.{viewInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: '8px', borderTop: '2px solid #D4AF37', fontSize: '16px', fontWeight: 700 }}>
                      <span style={{ color: '#1B3B36' }}>Total</span>
                      <span style={{ color: '#1B3B36' }}>Rs.{viewInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {viewInvoice.notes && (
                  <div style={{ marginTop: '20px', padding: '12px', background: '#FBFBF9', borderRadius: '8px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#1B3B36', marginBottom: '4px' }}>Notes</p>
                    <p style={{ fontSize: '12px', color: '#6B726C' }}>{viewInvoice.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '11px', color: '#6B726C' }}>
                  <p>Thank you for choosing {salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin'}!</p>
                  <p>We look forward to seeing you again.</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Invoices;
