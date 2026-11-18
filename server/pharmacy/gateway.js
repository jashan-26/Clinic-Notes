import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';

import { ApolloAdapter } from './adapters/apollo.js';
import { BlinkitAdapter } from './adapters/blinkit.js';
import { ZeptoAdapter } from './adapters/zepto.js';
import { Tata1mgAdapter } from './adapters/tata1mg.js';
import { PharmEasyAdapter } from './adapters/pharmeasy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read catalog
const catalogPath = path.join(__dirname, 'catalog.json');
let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (err) {
  console.error('Error loading pharmacy catalog:', err);
}

export class PharmacyGateway {
  constructor() {
    this.adapters = {
      apollo: new ApolloAdapter(),
      blinkit: new BlinkitAdapter(),
      zepto: new ZeptoAdapter(),
      tata1mg: new Tata1mgAdapter(),
      pharmeasy: new PharmEasyAdapter(),
    };

    // Setup Fuse.js for fuzzy brand, salt, and category matching
    this.fuse = new Fuse(catalog, {
      keys: [
        { name: 'name', weight: 0.6 },
        { name: 'genericSalt', weight: 0.3 },
        { name: 'category', weight: 0.1 },
      ],
      threshold: 0.45,
      ignoreLocation: true,
      includeScore: true,
    });

    // In-memory orders store
    this.orders = new Map();
  }

  /**
   * Search medicines by query string (e.g. "Combiflam", "Combiflame", "ibuprofen", "paracetamol")
   */
  search(query) {
    if (!query || query.trim() === '') {
      // return popular top 6
      return catalog.slice(0, 6).map((item) => this.enrichMedicine(item));
    }

    const cleanQuery = query.trim();
    const results = this.fuse.search(cleanQuery);

    if (results.length > 0) {
      return results.slice(0, 8).map((res) => this.enrichMedicine(res.item));
    }

    // Direct fallback substring search
    const lower = cleanQuery.toLowerCase();
    const fallback = catalog.filter(
      (m) =>
        m.name.toLowerCase().includes(lower) ||
        m.genericSalt.toLowerCase().includes(lower)
    );

    if (fallback.length > 0) {
      return fallback.slice(0, 8).map((item) => this.enrichMedicine(item));
    }

    // If still no direct match, return a synthesized mock entry based on query
    return [
      {
        id: `custom-${Date.now()}`,
        name: cleanQuery,
        genericSalt: 'Salt composition pending clinical review',
        strength: 'Standard therapeutic dose',
        dosageForm: 'Oral Form',
        category: 'Prescription Medicine',
        rxRequired: true,
        description: `Prescribed by doctor during consultation (${cleanQuery}).`,
        quotes: [
          {
            provider: 'apollo',
            providerName: 'Apollo Pharmacy',
            price: 75.0,
            stock: true,
            eta: '2 hours',
            deliveryFee: 25,
            isSandbox: true,
            searchUrl: `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(cleanQuery)}`,
            isBestPrice: true,
            isFastest: false,
          },
          {
            provider: 'blinkit',
            providerName: 'Blinkit',
            price: 85.0,
            stock: true,
            eta: '12 mins',
            deliveryFee: 30,
            isSandbox: true,
            searchUrl: `https://blinkit.com/s/?q=${encodeURIComponent(cleanQuery)}`,
            isBestPrice: false,
            isFastest: true,
          },
          {
            provider: 'tata1mg',
            providerName: 'Tata 1mg',
            price: 78.0,
            stock: true,
            eta: 'Same day',
            deliveryFee: 20,
            isSandbox: true,
            searchUrl: `https://www.1mg.com/search/all?name=${encodeURIComponent(cleanQuery)}`,
            isBestPrice: false,
            isFastest: false,
          },
        ],
        genericAlternatives: [],
      },
    ];
  }

  /**
   * Enriches catalog item with quotes from all providers, tags Best Price and Fastest
   */
  enrichMedicine(item) {
    const quotes = [];
    let minPrice = Infinity;
    let minPriceIndex = -1;
    let fastestEtaMins = Infinity;
    let fastestIndex = -1;

    Object.values(this.adapters).forEach((adapter) => {
      const quote = adapter.getItemQuote(item);
      if (quote) {
        quotes.push(quote);
        const idx = quotes.length - 1;

        if (quote.stock && quote.price < minPrice) {
          minPrice = quote.price;
          minPriceIndex = idx;
        }

        // ETA score in minutes for comparison
        let etaMinutes = 9999;
        const etaLower = quote.eta.toLowerCase();
        if (etaLower.includes('min')) {
          const match = etaLower.match(/\d+/);
          etaMinutes = match ? parseInt(match[0], 10) : 15;
        } else if (etaLower.includes('hour')) {
          const match = etaLower.match(/\d+/);
          etaMinutes = (match ? parseInt(match[0], 10) : 2) * 60;
        } else if (etaLower.includes('same day')) {
          etaMinutes = 480;
        } else {
          etaMinutes = 1440;
        }

        if (quote.stock && etaMinutes < fastestEtaMins) {
          fastestEtaMins = etaMinutes;
          fastestIndex = idx;
        }
      }
    });

    quotes.forEach((q, idx) => {
      q.isBestPrice = idx === minPriceIndex;
      q.isFastest = idx === fastestIndex;
    });

    return {
      ...item,
      quotes,
    };
  }

  /**
   * Place an order across selected provider with Rx validation
   */
  async placeOrder({ items, provider, patientDetails, prescriptionAttached }) {
    if (!items || items.length === 0) {
      throw new Error('Cart is empty.');
    }

    const adapter = this.adapters[provider] || this.adapters.blinkit;

    // Check if any item requires Prescription
    const hasRxItem = items.some((it) => it.rxRequired);
    if (hasRxItem && !prescriptionAttached) {
      const rxError = new Error('Rx verification required for prescription-only medicines.');
      rxError.code = 'PRESCRIPTION_REQUIRED';
      throw rxError;
    }

    const orderResult = await adapter.placeOrder({ items, patientDetails });
    const orderId = orderResult.orderId;

    const orderRecord = {
      orderId,
      provider: adapter.name,
      providerKey: adapter.key,
      items,
      totalAmount: items.reduce((acc, curr) => acc + (curr.price || 0) * (curr.quantity || 1), 0),
      deliveryFee: 25,
      patientDetails: patientDetails || { name: 'Patient', address: 'Ward 3, Greenview Clinic', phone: '+91 98765 43210' },
      prescriptionAttached: Boolean(prescriptionAttached),
      status: 'Placed',
      createdAt: Date.now(),
      steps: [
        { label: 'Order Placed', time: new Date().toLocaleTimeString(), completed: true },
        { label: 'Pharmacy Packed', time: null, completed: false },
        { label: 'Out for Delivery', time: null, completed: false },
        { label: 'Delivered', time: null, completed: false },
      ],
    };

    this.orders.set(orderId, orderRecord);
    return orderRecord;
  }

  /**
   * Get live tracking status for an order (progresses over time)
   */
  getOrderTracking(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      return null;
    }

    const elapsedSeconds = Math.floor((Date.now() - order.createdAt) / 1000);

    // Dynamic progression simulation:
    // 0-6 seconds: Placed
    // 7-14 seconds: Packed
    // 15-24 seconds: Out for Delivery
    // 25+ seconds: Delivered
    if (elapsedSeconds >= 25) {
      order.status = 'Delivered';
      order.steps[1].completed = true;
      order.steps[2].completed = true;
      order.steps[3].completed = true;
      if (!order.steps[3].time) order.steps[3].time = new Date().toLocaleTimeString();
    } else if (elapsedSeconds >= 14) {
      order.status = 'Out for Delivery';
      order.steps[1].completed = true;
      order.steps[2].completed = true;
      if (!order.steps[2].time) order.steps[2].time = new Date().toLocaleTimeString();
    } else if (elapsedSeconds >= 6) {
      order.status = 'Packed';
      order.steps[1].completed = true;
      if (!order.steps[1].time) order.steps[1].time = new Date().toLocaleTimeString();
    }

    return order;
  }
}
