import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner if not dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-[#1B3B36] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-4 max-w-md"
      data-testid="pwa-install-banner"
      style={{ animation: 'slideUp 0.4s ease-out' }}
    >
      <div className="flex-1">
        <p className="text-sm font-medium">Install Ma-Ke Salon</p>
        <p className="text-xs text-white/70">Add to desktop for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 bg-[#D4AF37] text-[#1B3B36] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#c9a432] transition-colors"
        data-testid="pwa-install-button"
      >
        <Download size={14} />
        Install
      </button>
      <button
        onClick={handleDismiss}
        className="text-white/50 hover:text-white p-1"
        data-testid="pwa-install-dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
