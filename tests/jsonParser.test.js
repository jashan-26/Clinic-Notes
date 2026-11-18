import { describe, it, expect } from 'vitest';
import { cleanAndParseJSON } from '../server/anthropic.js';

describe('LLM JSON Parser & Cleaner', () => {
  it('should parse strict JSON directly', () => {
    const raw = '{"summary": "Patient is stable", "diagnosis": "GERD"}';
    const parsed = cleanAndParseJSON(raw);
    expect(parsed.diagnosis).toBe('GERD');
  });

  it('should strip markdown code fences ```json ... ```', () => {
    const raw = '```json\n{\n  "status": "success",\n  "count": 5\n}\n```';
    const parsed = cleanAndParseJSON(raw);
    expect(parsed.status).toBe('success');
    expect(parsed.count).toBe(5);
  });

  it('should extract JSON even when surrounded by conversational text', () => {
    const raw = `Here is the JSON you requested:\n\n{"medicines": [{"name": "Dolo 650"}]}\n\nHope this helps!`;
    const parsed = cleanAndParseJSON(raw);
    expect(parsed.medicines[0].name).toBe('Dolo 650');
  });

  it('should throw descriptive error on invalid json', () => {
    const raw = 'Sorry, I cannot process this request.';
    expect(() => cleanAndParseJSON(raw)).toThrow();
  });
});
