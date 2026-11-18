/**
 * Blinkit Sandbox Adapter (Quick-Commerce 10-min delivery)
 * In production: Replace with Blinkit Dark Store Integration
 */
export class BlinkitAdapter {
  constructor() {
    this.name = 'Blinkit';
    this.key = 'blinkit';
    this.isSandbox = true;
    this.badge = '10-15 Min Instant Delivery';
  }

  getSearchUrl(query) {
    return `https://blinkit.com/s/?q=${encodeURIComponent(query)}`;
  }

  getItemQuote(catalogItem) {
    const info = catalogItem.pricing?.blinkit;
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
    const trackingId = 'BLK-' + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      orderId: trackingId,
      provider: this.key,
      estimatedDelivery: '10-15 minutes',
      status: 'Placed',
    };
  }
}
