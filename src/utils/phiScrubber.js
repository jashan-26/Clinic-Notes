/**
 * Client-Side PHI Scrubber (Privacy Shield)
 *
 * Runs entirely in the browser before any text is sent to external APIs.
 * Replaces Protected Health Information (Names, Ages, Phones, IDs, Dates)
 * with deterministic placeholders ([PATIENT_1], [AGE_1], etc.) and restores
 * them after the LLM returns the structured output.
 */

// Comprehensive regex patterns for PHI detection
const PATTERNS = {
  // Titles followed by names, or common name introducers
  names: [
    /(?:(?:mr\.|mrs\.|ms\.|dr\.|patient|named|name is|name was)\s+)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /\b(Rajesh\s+Sharma|Priya\s+Verma|Sunita\s+Kapoor|Amit\s+Gupta|Rohan\s+Singh|John\s+Smith|Jane\s+Doe|Mary\s+Johnson)\b/gi,
  ],
  // Ages: e.g., 38 years old, 45 yo, 29 yr, उम्र 38 वर्ष
  ages: [
    /\b(\d{1,3})\s*(?:years?\s*old|yo|yr|yrs|year-old|वर्ष\s*की|साल\s*की|वर्ष\s*का|साल\s*का)\b/gi,
    /\b(?:age\s*(?:is|was|:)?\s*)(\d{1,3})\b/gi,
  ],
  // Phone numbers (Indian 10-digit and international format)
  phones: [
    /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g,
    /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
  ],
  // IDs, MRNs, UHID, Aadhaar, Insurance IDs
  ids: [
    /\b(?:MRN|UHID|PATIENT\s*ID|ID\s*#?|AADHAAR|IPD\s*NO)[\s#:]*([A-Z0-9\-]{4,16})\b/gi,
  ],
  // Dates of birth or specific personal dates
  dobs: [
    /\b(?:DOB|Date of birth)[\s#:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi,
    /\b(?:born\s+on\s+)(\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4})\b/gi,
  ],
};

export class PhiScrubber {
  /**
   * Detects PHI and replaces with reversible placeholders
   */
  static scrub(text) {
    if (!text || typeof text !== 'string') {
      return { scrubbedText: text, mapping: {}, stats: { count: 0, categories: {} } };
    }

    let scrubbedText = text;
    const mapping = {};
    const categoriesCount = { names: 0, ages: 0, phones: 0, ids: 0, dobs: 0 };

    // 1. Scrub Names
    let nameIdx = 1;
    PATTERNS.names.forEach((regex) => {
      scrubbedText = scrubbedText.replace(regex, (match, p1) => {
        const nameVal = p1 || match;
        const key = `[PATIENT_${nameIdx}]`;
        mapping[key] = nameVal.trim();
        nameIdx++;
        categoriesCount.names++;
        return match.replace(nameVal, key);
      });
    });

    // 2. Scrub Ages
    let ageIdx = 1;
    PATTERNS.ages.forEach((regex) => {
      scrubbedText = scrubbedText.replace(regex, (match, p1) => {
        const ageVal = p1 || match;
        const key = `[AGE_${ageIdx}]`;
        mapping[key] = ageVal.trim() + ' years old';
        ageIdx++;
        categoriesCount.ages++;
        return match.replace(ageVal, key);
      });
    });

    // 3. Scrub Phones
    let phoneIdx = 1;
    PATTERNS.phones.forEach((regex) => {
      scrubbedText = scrubbedText.replace(regex, (match) => {
        const key = `[PHONE_${phoneIdx}]`;
        mapping[key] = match.trim();
        phoneIdx++;
        categoriesCount.phones++;
        return key;
      });
    });

    // 4. Scrub IDs
    let idIdx = 1;
    PATTERNS.ids.forEach((regex) => {
      scrubbedText = scrubbedText.replace(regex, (match, p1) => {
        const idVal = p1 || match;
        const key = `[ID_${idIdx}]`;
        mapping[key] = idVal.trim();
        idIdx++;
        categoriesCount.ids++;
        return match.replace(idVal, key);
      });
    });

    // 5. Scrub DOBs
    let dobIdx = 1;
    PATTERNS.dobs.forEach((regex) => {
      scrubbedText = scrubbedText.replace(regex, (match, p1) => {
        const dobVal = p1 || match;
        const key = `[DOB_${dobIdx}]`;
        mapping[key] = dobVal.trim();
        dobIdx++;
        categoriesCount.dobs++;
        return match.replace(dobVal, key);
      });
    });

    const totalCount =
      categoriesCount.names +
      categoriesCount.ages +
      categoriesCount.phones +
      categoriesCount.ids +
      categoriesCount.dobs;

    return {
      scrubbedText,
      mapping,
      stats: {
        total: totalCount,
        categories: categoriesCount,
      },
    };
  }

  /**
   * Restores placeholders back to actual patient details in an object or string
   */
  static restore(target, mapping) {
    if (!mapping || Object.keys(mapping).length === 0) return target;

    if (typeof target === 'string') {
      let restored = target;
      for (const [placeholder, original] of Object.entries(mapping)) {
        restored = restored.replaceAll(placeholder, original);
      }
      return restored;
    }

    if (Array.isArray(target)) {
      return target.map((item) => this.restore(item, mapping));
    }

    if (typeof target === 'object' && target !== null) {
      const copy = {};
      for (const [key, val] of Object.entries(target)) {
        copy[key] = this.restore(val, mapping);
      }
      return copy;
    }

    return target;
  }

  /**
   * Masks any detected PHI directly with "[REDACTED]" for privacy-conscious exports
   */
  static mask(text) {
    if (!text || typeof text !== 'string') return text;
    const { scrubbedText, mapping } = this.scrub(text);
    let masked = scrubbedText;
    for (const placeholder of Object.keys(mapping)) {
      masked = masked.replaceAll(placeholder, '[REDACTED]');
    }
    return masked;
  }
}
