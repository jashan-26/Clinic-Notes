import { describe, it, expect } from 'vitest';
import { PhiScrubber } from '../src/utils/phiScrubber.js';

describe('PhiScrubber (Client-Side Privacy Shield)', () => {
  it('should scrub patient names, ages, phone numbers and hospital IDs into deterministic placeholders', () => {
    const rawNote =
      'Today I met with a patient. Her name was Mrs. Smith. She was 38 years old female, phone 9876543210, MRN CN-84920.';

    const { scrubbedText, mapping, stats } = PhiScrubber.scrub(rawNote);

    expect(scrubbedText).not.toContain('Mrs. Smith');
    expect(scrubbedText).not.toContain('9876543210');
    expect(scrubbedText).not.toContain('CN-84920');

    expect(scrubbedText).toContain('[PATIENT_1]');
    expect(scrubbedText).toContain('[PHONE_1]');
    expect(scrubbedText).toContain('[ID_1]');
    expect(stats.total).toBeGreaterThanOrEqual(3);
  });

  it('should successfully restore scrubbed placeholders back to actual values', () => {
    const rawNote = 'Dr. Sharma met patient Rajesh Sharma, age 45 years old, UHID CN-90123.';
    const { scrubbedText, mapping } = PhiScrubber.scrub(rawNote);

    const restored = PhiScrubber.restore(scrubbedText, mapping);
    expect(restored).toContain('Rajesh Sharma');
    expect(restored).toContain('CN-90123');
  });

  it('should mask PHI with [REDACTED] when mask() is invoked', () => {
    const note = 'Follow up with Priya Verma, phone 9812345678, ID CN-44219.';
    const masked = PhiScrubber.mask(note);

    expect(masked).toContain('[REDACTED]');
    expect(masked).not.toContain('Priya Verma');
    expect(masked).not.toContain('9812345678');
  });
});
