/**
 * Tata 1mg Sandbox Adapter
 * In production: Replace with 1mg Partner API
 */
export class Tata1mgAdapter {
  constructor() {
    this.name = 'Tata 1mg';
    this.key = 'tata1mg';
    this.isSandbox = true;
    this.badge = 'Comprehensive e-Pharmacy & Discounts';
  }

  getSearchUrl(query) {
    return `https://www.1mg.com/search/all?name=${encodeURIComponent(query)}`;
  }

  getItemQuote(catalogItem) {
    const info = catalogItem.pricing?.tata1mg;
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
    const trackingId = '1MG-' + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      orderId: trackingId,
      provider: this.key,
      estimatedDelivery: 'Same day (by 8 PM)',
      status: 'Placed',
    };
  }
}
