/**
 * PharmEasy Sandbox Adapter
 * In production: Replace with PharmEasy Partner Integration
 */
export class PharmEasyAdapter {
  constructor() {
    this.name = 'PharmEasy';
    this.key = 'pharmeasy';
    this.isSandbox = true;
    this.badge = 'Economy & Scheduled Delivery';
  }

  getSearchUrl(query) {
    return `https://pharmeasy.in/search/all?name=${encodeURIComponent(query)}`;
  }

  getItemQuote(catalogItem) {
    const info = catalogItem.pricing?.pharmeasy;
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
    const trackingId = 'PE-' + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      orderId: trackingId,
      provider: this.key,
      estimatedDelivery: 'Next day',
      status: 'Placed',
    };
  }
}
