/**
 * Apollo Pharmacy Sandbox Adapter
 * In production: Replace with Apollo 24/7 B2B Partner API
 */
export class ApolloAdapter {
  constructor() {
    this.name = 'Apollo Pharmacy';
    this.key = 'apollo';
    this.isSandbox = true;
    this.badge = 'Same-day / 2h Store Delivery';
  }

  getSearchUrl(query) {
    return `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(query)}`;
  }

  getItemQuote(catalogItem) {
    const info = catalogItem.pricing?.apollo;
    if (!info) return null;
    return {
      provider: this.key,
      providerName: this.name,
      price: info.price,
      stock: info.stock,
      eta: info.eta,
      deliveryFee: info.deliveryFee,
      isSandbox: this.isSandbox,
      searchUrl: this.getSearchUrl(catalogItem.name),
    };
  }

  async placeOrder(orderPayload) {
    // Simulated API call with random order ID
    const trackingId = 'APO-' + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      orderId: trackingId,
      provider: this.key,
      estimatedDelivery: 'Within 2 hours',
      status: 'Placed',
    };
  }
}
