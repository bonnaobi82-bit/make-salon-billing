import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { MessageCircle, Share2, Image as ImageIcon } from 'lucide-react';

const PRICE_LIST_IMAGE = 'https://customer-assets.emergentagent.com/job_beauty-billing-4/artifacts/jvswtnvx_WhatsApp%20Image%202026-04-18%20at%2011.03.29%20AM%20%281%29.jpeg';

const PriceList = () => {
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salonProfile, setSalonProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servRes, custRes, profileRes] = await Promise.all([
        authAxios.get('/services'),
        authAxios.get('/customers'),
        authAxios.get('/salon-profile')
      ]);
      setServices(servRes.data);
      setCustomers(custRes.data);
      setSalonProfile(profileRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneForWhatsApp = (phone) => {
    let digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) digits = '91' + digits.slice(1);
    if (!digits.startsWith('91') && digits.length === 10) digits = '91' + digits;
    return digits;
  };

  const sendPriceListToCustomer = async (customer) => {
    if (!customer?.phone) {
      toast.error('Customer has no phone number');
      return;
    }
    const phone = formatPhoneForWhatsApp(customer.phone);
    const salonName = salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin';
    const salonPhone = salonProfile?.phone || '6909902650';

    // Build text price list
    const grouped = services.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {});

    let message = `*${salonName} - Price List*\n\n`;
    Object.keys(grouped).forEach(cat => {
      message += `*${cat.charAt(0).toUpperCase() + cat.slice(1)}*\n`;
      grouped[cat].forEach(s => {
        message += `  ${s.name} — Rs.${s.price}\n`;
      });
      message += '\n';
    });
    message += `Book now: ${salonPhone}\nWe look forward to seeing you!`;

    // Try API first
    try {
      await authAxios.post('/whatsapp/send-invoice', {}); // dummy to check API
    } catch (e) {
      // ignore
    }

    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
    toast.success(`Price list sent to ${customer.name}`);
  };

  const sendPriceListToAll = () => {
    const customersWithPhone = customers.filter(c => c.phone);
    if (customersWithPhone.length === 0) {
      toast.error('No customers with phone numbers');
      return;
    }

    const salonName = salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin';
    const salonPhone = salonProfile?.phone || '6909902650';

    const grouped = services.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s);
      return acc;
    }, {});

    let message = `*${salonName} - Price List*\n\n`;
    Object.keys(grouped).forEach(cat => {
      message += `*${cat.charAt(0).toUpperCase() + cat.slice(1)}*\n`;
      grouped[cat].forEach(s => {
        message += `  ${s.name} — Rs.${s.price}\n`;
      });
      message += '\n';
    });
    message += `Book now: ${salonPhone}\nWe look forward to seeing you!`;

    // Open for first customer, rest will need manual
    const first = customersWithPhone[0];
    const phone = formatPhoneForWhatsApp(first.phone);
    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
    toast.success(`WhatsApp opened for ${first.name}. Send to remaining customers from Promotions page.`);
  };

  const sendImageToCustomer = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    const customer = customers.find(c => c.id === selectedCustomer);
    if (!customer?.phone) {
      toast.error('Customer has no phone number');
      return;
    }
    const phone = formatPhoneForWhatsApp(customer.phone);
    const salonName = salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin';
    const message = `*${salonName} - Hair Color Price List*\n\nPlease check our latest price list above!\n\nBook now: ${salonProfile?.phone || '6909902650'}`;

    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
    toast.success(`WhatsApp opened for ${customer.name}`);
  };

  const grouped = services.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const categoryLabels = {
    haircut: 'Haircut',
    coloring: 'Hair Color',
    spa: 'Spa',
    nails: 'Nails',
    facial: 'Facial',
    makeup: 'Makeup',
    other: 'Other'
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="pricelist-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Price List</h2>
            <p className="text-sm text-[#6B726C] mt-1">Share your price list with customers via WhatsApp</p>
          </div>
          <button
            onClick={sendPriceListToAll}
            className="flex items-center gap-2 bg-[#25D366] text-white rounded-full px-5 py-2.5 font-medium hover:bg-[#1da851] transition-all text-sm"
            data-testid="send-pricelist-all-button"
          >
            <Share2 size={16} />
            Share to All Customers
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Price List Image */}
          <div className="lg:col-span-1 space-y-4">
            <div className="stat-card">
              <h3 className="text-sm font-medium text-[#1B3B36] mb-3 flex items-center gap-2">
                <ImageIcon size={16} className="text-[#D4AF37]" />
                Hair Color Price Card
              </h3>
              <div className="rounded-xl overflow-hidden border border-[#E8EAE6]">
                <img
                  src={PRICE_LIST_IMAGE}
                  alt="Hair Color Price List"
                  className="w-full h-auto"
                  data-testid="price-list-image"
                />
              </div>

              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-medium text-[#1B3B36]">Send to Customer</h4>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="input-field"
                  data-testid="pricelist-customer-select"
                >
                  <option value="">Select Customer</option>
                  {customers.filter(c => c.phone).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
                <button
                  onClick={sendImageToCustomer}
                  disabled={!selectedCustomer}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-full px-4 py-2.5 font-medium hover:bg-[#1da851] transition-all text-sm disabled:opacity-50"
                  data-testid="send-pricelist-customer-button"
                >
                  <MessageCircle size={16} />
                  Send via WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* Right: Full Service Price List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <p className="text-[#6B726C]">Loading services...</p>
            ) : (
              Object.keys(grouped).map((category) => (
                <div key={category} className="stat-card" data-testid={`pricelist-category-${category}`}>
                  <h3 className="text-lg font-serif text-[#1B3B36] mb-4 pb-2 border-b border-[#E8EAE6]">
                    {categoryLabels[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <div className="space-y-0">
                    {grouped[category].map((service, idx) => (
                      <div
                        key={service.id}
                        className={`flex items-center justify-between py-3 ${idx < grouped[category].length - 1 ? 'border-b border-[#E8EAE6]/50' : ''}`}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1B3B36]">{service.name}</p>
                          {service.description && (
                            <p className="text-xs text-[#6B726C] mt-0.5">{service.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-serif font-bold text-[#D4AF37]">Rs.{service.price.toLocaleString()}</p>
                          <p className="text-[10px] text-[#6B726C]">{service.duration_minutes} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PriceList;
