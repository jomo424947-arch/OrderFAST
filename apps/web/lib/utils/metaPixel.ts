export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '262394306384064';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

// Track standard PageView
export const pageview = () => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', 'PageView');
  }
};

// Track standard or custom events
export const trackEvent = (name: string, options: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    window.fbq('track', name, options);
  }
};

// Track Purchase
export const trackPurchase = (params: {
  value: number;
  currency?: string;
  orderId?: string;
  numItems?: number;
}) => {
  trackEvent('Purchase', {
    value: params.value,
    currency: params.currency || 'EGP',
    content_type: 'product',
    order_id: params.orderId,
    num_items: params.numItems,
  });
};

// Track AddToCart
export const trackAddToCart = (params: {
  contentName?: string;
  value?: number;
  currency?: string;
}) => {
  trackEvent('AddToCart', {
    content_name: params.contentName,
    value: params.value,
    currency: params.currency || 'EGP',
    content_type: 'product',
  });
};
