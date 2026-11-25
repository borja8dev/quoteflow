import { describe, expect, it } from "vitest";

import { normalizeTaxId, validateSpanishTaxId } from "./tax-id";

describe("normalizeTaxId", () => {
  it("uppercases and strips common separators", () => {
    expect(normalizeTaxId("  12345678-z  ")).toBe("12345678Z");
    expect(normalizeTaxId("x.1234567.l")).toBe("X1234567L");
    expect(normalizeTaxId("a 5881 8501")).toBe("A58818501");
  });
});

describe("validateSpanishTaxId — NIF", () => {
  it("accepts a valid NIF", () => {
    const result = validateSpanishTaxId("12345678Z");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe("NIF");
      expect(result.normalized).toBe("12345678Z");
    }
  });

  it("accepts the all-zero edge case", () => {
    const result = validateSpanishTaxId("00000000T");
    expect(result.ok).toBe(true);
  });

  it("normalizes casing and cosmetic separators", () => {
    const result = validateSpanishTaxId(" 12345678-z ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalized).toBe("12345678Z");
    }
  });

  it("rejects a NIF with a wrong control letter", () => {
    const result = validateSpanishTaxId("12345678A");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_control_character");
    }
  });

  it("rejects a NIF shorter or longer than 9 characters", () => {
    expect(validateSpanishTaxId("1234567Z").ok).toBe(false);
    expect(validateSpanishTaxId("123456789Z").ok).toBe(false);
  });

  it("rejects a NIF containing non-digit characters where digits are required", () => {
    expect(validateSpanishTaxId("1234A678Z").ok).toBe(false);
  });
});

describe("validateSpanishTaxId — NIE", () => {
  it("accepts valid NIEs for each prefix letter", () => {
    const results = [
      validateSpanishTaxId("X1234567L"),
      validateSpanishTaxId("Y0000000Z"),
      validateSpanishTaxId("Z0000000M"),
    ];
    for (const result of results) {
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.kind).toBe("NIE");
      }
    }
  });

  it("rejects a NIE with a wrong control letter", () => {
    const result = validateSpanishTaxId("X1234567A");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_control_character");
    }
  });

  it("rejects a NIE whose first letter is not X, Y or Z", () => {
    const result = validateSpanishTaxId("W1234567L");
    expect(result.ok).toBe(false);
  });
});

describe("validateSpanishTaxId — CIF", () => {
  it("accepts a CIF with a digit control character (organisation type A)", () => {
    const result = validateSpanishTaxId("A58818501");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe("CIF");
    }
  });

  it("accepts a CIF with a letter control character (organisation type Q)", () => {
    const result = validateSpanishTaxId("Q2818002D");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.kind).toBe("CIF");
    }
  });

  it("accepts a mixed-control CIF (F-type) with both the letter and the digit form", () => {
    expect(validateSpanishTaxId("F20000006").ok).toBe(true);
    expect(validateSpanishTaxId("F20000000F").ok).toBe(false); // length wrong
    expect(validateSpanishTaxId("F2000000F").ok).toBe(true);
  });

  it("rejects a CIF with a wrong control character", () => {
    const result = validateSpanishTaxId("A58818502");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_control_character");
    }
  });

  it("rejects a letter-control CIF given a digit control (P-type)", () => {
    // P4300007 computes control digit 4 / letter D → 'D' is valid, '4' is not.
    expect(validateSpanishTaxId("P4300007D").ok).toBe(true);
    const result = validateSpanishTaxId("P43000074");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_control_character");
    }
  });

  it("rejects a digit-control CIF given a letter control (A-type)", () => {
    // A58818501 is valid with digit '1'. The matching letter 'A' must not be accepted.
    const result = validateSpanishTaxId("A5881850A");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_control_character");
    }
  });

  it("rejects CIFs whose organisation letter is not allowed", () => {
    // 'I', 'K', 'L', 'M', 'O', 'T', 'X', 'Y', 'Z' are not valid CIF prefixes.
    for (const prefix of ["I", "K", "L", "M", "O", "T"]) {
      const result = validateSpanishTaxId(`${prefix}12345670`);
      expect(result.ok).toBe(false);
    }
  });
});

describe("validateSpanishTaxId — general rejection", () => {
  it("rejects empty or whitespace-only input", () => {
    expect(validateSpanishTaxId("").ok).toBe(false);
    expect(validateSpanishTaxId("   ").ok).toBe(false);
    const empty = validateSpanishTaxId("");
    if (!empty.ok) {
      expect(empty.error).toBe("empty");
    }
  });

  it("rejects values that do not match any supported format", () => {
    const samples = ["ABCDEFGHI", "123456789", "12345678", "Z12345Z"];
    for (const sample of samples) {
      const result = validateSpanishTaxId(sample);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("invalid_format");
      }
    }
  });
});
