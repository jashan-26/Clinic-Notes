import { describe, it, expect } from 'vitest';
import { PharmacyGateway } from '../server/pharmacy/gateway.js';

describe('Pharmacy Gateway & Fuzzy Matcher', () => {
  const gateway = new PharmacyGateway();

  it('should find Combiflam even when queried with spelling variation "Combiflame"', () => {
    const results = gateway.search('Combiflame');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Combiflam');
  });

  it('should find Paracetamol / Dolo when queried with generic salt "paracetamol"', () => {
    const results = gateway.search('paracetamol');
    expect(results.length).toBeGreaterThan(0);
    const matchesSalt = results.some((r) =>
      r.genericSalt.toLowerCase().includes('paracetamol')
    );
    expect(matchesSalt).toBe(true);
  });

  it('should tag isBestPrice and isFastest among provider quotes', () => {
    const results = gateway.search('Combiflam');
    const quotes = results[0].quotes;
    expect(quotes.length).toBeGreaterThan(0);

    const hasBestPrice = quotes.some((q) => q.isBestPrice === true);
    const hasFastest = quotes.some((q) => q.isFastest === true);

    expect(hasBestPrice).toBe(true);
    expect(hasFastest).toBe(true);
  });

  it('should reject placing an order with Rx-only medicine if prescription is not attached', async () => {
    const rxItem = {
      id: 'med-3',
      name: 'Pan 40',
      rxRequired: true,
      price: 145.0,
      quantity: 1,
    };

    await expect(
      gateway.placeOrder({
        items: [rxItem],
        provider: 'apollo',
        patientDetails: { name: 'Test Patient' },
        prescriptionAttached: false,
      })
    ).rejects.toThrow('Rx verification required');
  });

  it('should allow checkout for OTC medicines without prescription', async () => {
    const otcItem = {
      id: 'med-1',
      name: 'Combiflam',
      rxRequired: false,
      price: 42.5,
      quantity: 1,
    };

    const order = await gateway.placeOrder({
      items: [otcItem],
      provider: 'blinkit',
      patientDetails: { name: 'Test Patient' },
      prescriptionAttached: false,
    });

    expect(order.orderId).toBeDefined();
    expect(order.status).toBe('Placed');
  });
});
