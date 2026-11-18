/**
 * Configurable Pharmacy Providers
 * Defines deep search URLs, provider branding, and quick-commerce metadata
 */

export const PHARMACY_PROVIDERS = [
  {
    id: 'blinkit',
    name: 'Blinkit',
    deliveryTime: '10-15 mins',
    badge: 'Instant Delivery',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    searchUrl: (query) => `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
    description: 'Instant quick-commerce dark store network',
  },
  {
    id: 'zepto',
    name: 'Zepto',
    deliveryTime: '10-12 mins',
    badge: 'Superfast',
    tagColor: 'bg-purple-50 text-purple-700 border-purple-200',
    searchUrl: (query) => `https://www.zeptonow.com/search?q=${encodeURIComponent(query)}`,
    description: '10-minute grocery and pharmacy delivery',
  },
  {
    id: 'apollo',
    name: 'Apollo Pharmacy',
    deliveryTime: '2 hours',
    badge: 'Store Delivery',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
    searchUrl: (query) => `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(query)}`,
    description: 'India’s largest omni-channel retail pharmacy network',
  },
  {
    id: 'tata1mg',
    name: 'Tata 1mg',
    deliveryTime: 'Same day',
    badge: 'Best Value',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
    searchUrl: (query) => `https://www.1mg.com/search/all?name=${encodeURIComponent(query)}`,
    description: 'Trusted e-pharmacy with verified generic salts',
  },
  {
    id: 'pharmeasy',
    name: 'PharmEasy',
    deliveryTime: '1-2 days',
    badge: 'Scheduled',
    tagColor: 'bg-teal-50 text-teal-700 border-teal-200',
    searchUrl: (query) => `https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`,
    description: 'Comprehensive discount prescription medicines',
  },
];
