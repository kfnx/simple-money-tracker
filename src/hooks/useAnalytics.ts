
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    if (window.plausible) {
      window.plausible('pageview');
    }
  }, [location.pathname]);

  const trackEvent = (eventName: string, props?: Record<string, string | number>) => {
    if (window.plausible) {
      window.plausible(eventName, { props });
    }
  };

  // Financial tracking events
  const trackFinancialEvent = {
    addExpense: (amount: number, category: string) => {
      trackEvent('Add Expense', { amount, category });
    },
    addIncome: (amount: number) => {
      trackEvent('Add Income', { amount });
    },
    editTransaction: (type: 'expense' | 'income') => {
      trackEvent('Edit Transaction', { type });
    },
    deleteTransaction: (type: 'expense' | 'income') => {
      trackEvent('Delete Transaction', { type });
    }
  };

  // Authentication events
  const trackAuthEvent = {
    signUp: () => trackEvent('Sign Up'),
    signIn: () => trackEvent('Sign In'),
    signOut: () => trackEvent('Sign Out'),
    verifyEmail: () => trackEvent('Email Verified')
  };

  // Category management events
  const trackCategoryEvent = {
    create: (categoryName: string) => trackEvent('Create Category', { category: categoryName }),
    edit: (categoryName: string) => trackEvent('Edit Category', { category: categoryName }),
    delete: (categoryName: string) => trackEvent('Delete Category', { category: categoryName })
  };

  // AI Assistant events
  const trackAIEvent = {
    openAssistant: () => trackEvent('Open AI Assistant'),
    sendMessage: () => trackEvent('AI Message Sent'),
    closeAssistant: () => trackEvent('Close AI Assistant')
  };

  // App usage events
  const trackAppEvent = {
    pwaInstall: () => trackEvent('PWA Installed'),
    offlineUsage: () => trackEvent('Offline Usage'),
    errorOccurred: (errorType: string) => trackEvent('Error', { type: errorType })
  };

  return {
    trackEvent,
    trackFinancialEvent,
    trackAuthEvent,
    trackCategoryEvent,
    trackAIEvent,
    trackAppEvent
  };
};
