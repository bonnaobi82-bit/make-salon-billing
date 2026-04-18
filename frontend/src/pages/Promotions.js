import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { authAxios } from '@/App';
import { toast } from 'sonner';
import { MessageCircle, Send, Users, Sparkles, Edit3, CheckCircle } from 'lucide-react';

const offerTemplates = [
  {
    id: 'festival',
    title: 'Festival Offer',
    message: `Hi *{name}*! Celebrate this festive season with *{salon}*!\n\nGet *FLAT 20% OFF* on all services!\n\nValid till: {date}\n\nBook now: {phone}\nVisit: {address}\n\nHurry, limited period offer!`
  },
  {
    id: 'new_service',
    title: 'New Service Launch',
    message: `Hi *{name}*! Exciting news from *{salon}*!\n\nWe've launched a *NEW SERVICE* just for you!\n\nCome experience it with a special *introductory discount*.\n\nBook now: {phone}\nVisit: {address}\n\nWe'd love to see you!`
  },
  {
    id: 'loyalty_reward',
    title: 'Loyalty Reward',
    message: `Hi *{name}*! Thank you for being a valued customer at *{salon}*!\n\nAs a special reward, enjoy *15% OFF* on your next visit!\n\nJust show this message at the salon.\n\nBook now: {phone}\n\nThank you for your loyalty!`
  },
  {
    id: 'weekend_special',
    title: 'Weekend Special',
    message: `Hi *{name}*! This weekend is special at *{salon}*!\n\n*BUY 1 GET 1 FREE* on selected services!\n\nOffer valid: This Saturday & Sunday only\n\nBook now: {phone}\nVisit: {address}\n\nDon't miss out!`
  },
  {
    id: 'referral',
    title: 'Refer & Earn',
    message: `Hi *{name}*! Love our services at *{salon}*?\n\n*Refer a friend* and you BOTH get *Rs.200 OFF* on your next visit!\n\nJust share this message with your friend and visit us together.\n\nBook now: {phone}\nVisit: {address}`
  }
];

const Promotions = () => {
  const [customers, setCustomers] = useState([]);
  const [salonProfile, setSalonProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [totalToSend, setTotalToSend] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [custRes, profileRes] = await Promise.all([
        authAxios.get('/customers'),
        authAxios.get('/salon-profile')
      ]);
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

  const fillTemplate = (template, customerName) => {
    const salonName = salonProfile?.salon_name || 'Ma-ke Salon Unisex Hair & Skin';
    const salonPhone = salonProfile?.phone || '6909902650';
    const salonAddr = salonProfile?.address || 'Thangmeiband Sanakeithel Road, Manipur, Imphal -795001';
    const validDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return template
      .replace(/\{name\}/g, customerName)
      .replace(/\{salon\}/g, salonName)
      .replace(/\{phone\}/g, salonPhone)
      .replace(/\{address\}/g, salonAddr)
      .replace(/\{date\}/g, validDate);
  };

  const getMessageForCustomer = (customerName) => {
    if (useCustom) {
      return customMessage
        .replace(/\{name\}/g, customerName)
        .replace(/\{salon\}/g, salonProfile?.salon_name || 'Ma-ke Salon')
        .replace(/\{phone\}/g, salonProfile?.phone || '6909902650')
        .replace(/\{address\}/g, salonProfile?.address || '');
    }
    if (selectedTemplate) {
      return fillTemplate(selectedTemplate.message, customerName);
    }
    return '';
  };

  const getPreviewMessage = () => {
    return getMessageForCustomer('Customer Name');
  };

  const sendToAllCustomers = async () => {
    const customersWithPhone = customers.filter(c => c.phone);
    if (customersWithPhone.length === 0) {
      toast.error('No customers with phone numbers found');
      return;
    }

    const message = getMessageForCustomer('test');
    if (!message.trim()) {
      toast.error('Please select a template or write a custom message');
      return;
    }

    setSending(true);
    setTotalToSend(customersWithPhone.length);
    setSentCount(0);

    // Open WhatsApp for each customer with 1.5s delay
    for (let i = 0; i < customersWithPhone.length; i++) {
      const customer = customersWithPhone[i];
      const phone = formatPhoneForWhatsApp(customer.phone);
      const personalizedMessage = getMessageForCustomer(customer.name);

      window.open(
        `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(personalizedMessage)}`,
        '_blank'
      );

      setSentCount(i + 1);

      // Wait between opens to avoid browser blocking
      if (i < customersWithPhone.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    toast.success(`WhatsApp opened for ${customersWithPhone.length} customers!`);
    setSending(false);
  };

  const customersWithPhone = customers.filter(c => c.phone);

  return (
    <Layout>
      <div className="space-y-6" data-testid="promotions-page">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif text-[#1B3B36]">Promotions</h2>
            <p className="text-sm text-[#6B726C] mt-1">Send offers to all customers via WhatsApp</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#6B726C]">
            <Users size={16} />
            <span>{customersWithPhone.length} customers with phone numbers</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Template Selection */}
          <div className="space-y-4">
            {/* Toggle: Template vs Custom */}
            <div className="flex items-center bg-[#F0F2EE] rounded-full p-1 w-fit">
              <button
                onClick={() => setUseCustom(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!useCustom ? 'bg-[#1B3B36] text-white' : 'text-[#6B726C]'}`}
                data-testid="templates-tab"
              >
                Templates
              </button>
              <button
                onClick={() => setUseCustom(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${useCustom ? 'bg-[#1B3B36] text-white' : 'text-[#6B726C]'}`}
                data-testid="custom-tab"
              >
                Custom Message
              </button>
            </div>

            {!useCustom ? (
              /* Templates */
              <div className="space-y-3">
                {offerTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`stat-card cursor-pointer transition-all ${selectedTemplate?.id === template.id ? 'ring-2 ring-[#D4AF37] bg-[#FFFDF5]' : 'hover:border-[#D4AF37]'}`}
                    onClick={() => setSelectedTemplate(template)}
                    data-testid={`template-${template.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles size={18} className="text-[#D4AF37]" />
                        <h4 className="font-medium text-[#1B3B36]">{template.title}</h4>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <CheckCircle size={18} className="text-[#D4AF37]" fill="#D4AF37" stroke="white" />
                      )}
                    </div>
                    <p className="text-xs text-[#6B726C] mt-2 whitespace-pre-line line-clamp-3">
                      {template.message.replace(/\{name\}/g, 'Customer').replace(/\{salon\}/g, salonProfile?.salon_name || 'Ma-ke Salon').substring(0, 120)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /* Custom Message */
              <div className="stat-card">
                <div className="flex items-center gap-2 mb-3">
                  <Edit3 size={18} className="text-[#1B3B36]" />
                  <h4 className="font-medium text-[#1B3B36]">Write Your Message</h4>
                </div>
                <p className="text-xs text-[#6B726C] mb-3">
                  Use placeholders: <code className="bg-[#F0F2EE] px-1 rounded">{'{name}'}</code> <code className="bg-[#F0F2EE] px-1 rounded">{'{salon}'}</code> <code className="bg-[#F0F2EE] px-1 rounded">{'{phone}'}</code> <code className="bg-[#F0F2EE] px-1 rounded">{'{address}'}</code>
                </p>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="input-field"
                  rows={10}
                  placeholder={`Hi {name}! Great news from {salon}!\n\nWe have an amazing offer for you...\n\nCall us: {phone}`}
                  data-testid="custom-message-textarea"
                />
              </div>
            )}
          </div>

          {/* Right - Preview & Send */}
          <div className="space-y-4">
            {/* Preview */}
            <div className="stat-card">
              <h4 className="text-sm font-medium text-[#1B3B36] mb-3">Message Preview</h4>
              <div className="bg-[#e5ddd5] rounded-xl p-4" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23c8c0b5\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E")' }}>
                <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[90%] ml-auto shadow-sm">
                  <p className="text-sm text-[#303030] whitespace-pre-line" data-testid="message-preview">
                    {getPreviewMessage() || 'Select a template or write a message to see preview'}
                  </p>
                  <p className="text-[10px] text-[#6B726C] text-right mt-1">
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Send Button */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-[#1B3B36]">Send to All Customers</h4>
                  <p className="text-xs text-[#6B726C]">
                    Will open WhatsApp for {customersWithPhone.length} customers
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#25D366]/15">
                  <MessageCircle size={24} className="text-[#25D366]" />
                </div>
              </div>

              {sending && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[#6B726C] mb-1">
                    <span>Sending...</span>
                    <span>{sentCount}/{totalToSend}</span>
                  </div>
                  <div className="w-full bg-[#E8EAE6] rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-[#25D366] transition-all"
                      style={{ width: `${(sentCount / totalToSend) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={sendToAllCustomers}
                disabled={sending || (!selectedTemplate && !useCustom) || (useCustom && !customMessage.trim())}
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-full px-6 py-3 font-medium transition-all hover:bg-[#1da851] disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="send-to-all-button"
              >
                <Send size={18} />
                {sending ? `Sending ${sentCount}/${totalToSend}...` : `Send to All ${customersWithPhone.length} Customers`}
              </button>

              <p className="text-[10px] text-[#6B726C] mt-3 text-center">
                Each customer will get a personalized message with their name. WhatsApp tabs will open for each customer — you just need to press Send in each tab.
              </p>
            </div>

            {/* Info */}
            <div className="p-4 bg-[#FFF4E6] border border-[#FFE0B2] rounded-xl">
              <h4 className="font-medium text-[#E65100] mb-1 text-sm">How it works</h4>
              <ul className="text-xs text-[#6B726C] space-y-1">
                <li>1. Select a template or write a custom message</li>
                <li>2. Click "Send to All" — WhatsApp Web tabs open for each customer</li>
                <li>3. Press "Send" (Enter) in each WhatsApp tab</li>
                <li>4. Each message is personalized with the customer's name</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Promotions;
