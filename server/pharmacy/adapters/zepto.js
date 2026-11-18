/**
 * Zepto Sandbox Adapter (Quick-Commerce Pharmacy)
 * In production: Replace with Zepto Partner API
 */
export class ZeptoAdapter {
  constructor() {
    this.name = 'Zepto';
    this.key = 'zepto';
    this.isSandbox = true;
    this.badge = '10-15 Min Superfast Delivery';
  }

  getSearchUrl(query) {
    return `https://www.zeptonow.com/search?q=${encodeURIComponent(query)}`;
  }

  getItemQuote(catalogItem) {
    const info = catalogItem.pricing?.zepto;
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
    const trackingId = 'ZEP-' + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      orderId: trackingId,
      provider: this.key,
      estimatedDelivery: '10-12 minutes',
      status: 'Placed',
    };
  }
}
