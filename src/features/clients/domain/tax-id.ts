/**
 * Spanish tax identifier validation: NIF, NIE and CIF (BIZ-06).
 *
 * Pure module: no React, Supabase or Next.js imports.
 *
 * References:
 *  - NIF (personal, Spanish citizens): 8 digits + control letter.
 *  - NIE (foreign residents): first letter X/Y/Z mapped to 0/1/2, then the
 *    same control letter algorithm as NIF.
 *  - CIF (legal entities): leading organisation-type letter, 7 digits, then a
 *    control character that may be a digit or a letter depending on the
 *    organisation type.
 */

export type TaxIdKind = "NIF" | "NIE" | "CIF";

export type TaxIdValidationError =
  | "empty"
  | "invalid_format"
  | "invalid_control_character";

export type TaxIdValidationResult =
  | { readonly ok: true; readonly kind: TaxIdKind; readonly normalized: string }
  | { readonly ok: false; readonly error: TaxIdValidationError };

// Letter used as the NIF/NIE control character for a given mod-23 remainder.
const NIF_CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";

// Letters allowed as the first character of a CIF.
// A, B, C, D, E, F, G, H, J, N, P, Q, R, S, U, V, W.
const CIF_ORG_LETTERS = new Set("ABCDEFGHJNPQRSUVW".split(""));

// Organisation types whose control character must be a letter (A..J indexed by
// the computed digit 0..9).
const CIF_LETTER_CONTROL_ORGS = new Set(["P", "Q", "R", "S", "W", "N"]);

// Organisation types whose control character must be a digit.
const CIF_DIGIT_CONTROL_ORGS = new Set(["A", "B", "E", "H"]);

// Remaining organisation types accept either a digit or the equivalent letter
// (C, D, F, G, J, U, V).

const CIF_CONTROL_LETTERS = "JABCDEFGHI";

/**
 * Normalize a raw tax ID: uppercase and strip whitespace, dots and hyphens.
 */
export function normalizeTaxId(raw: string): string {
  return raw.replace(/[\s.\-_/]/g, "").toUpperCase();
}

/**
 * Validate a Spanish NIF, NIE or CIF, including the control character.
 * Accepts common cosmetic separators (spaces, dots, hyphens) and casing.
 */
export function validateSpanishTaxId(raw: string): TaxIdValidationResult {
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return { ok: false, error: "empty" };
  }

  const value = normalizeTaxId(raw);

  if (/^\d{8}[A-Z]$/.test(value)) {
    return validateNif(value);
  }

  if (/^[XYZ]\d{7}[A-Z]$/.test(value)) {
    return validateNie(value);
  }

  if (/^[A-Z]\d{7}[0-9A-J]$/.test(value)) {
    return validateCif(value);
  }

  return { ok: false, error: "invalid_format" };
}

function controlLetterForNumber(numericValue: number): string {
  const index = numericValue % 23;
  // NIF_CONTROL_LETTERS is a 23-character string; the modulo keeps us in range.
  return NIF_CONTROL_LETTERS.charAt(index);
}

function validateNif(value: string): TaxIdValidationResult {
  const digits = value.slice(0, 8);
  const providedLetter = value.charAt(8);
  const expectedLetter = controlLetterForNumber(Number.parseInt(digits, 10));

  if (providedLetter !== expectedLetter) {
    return { ok: false, error: "invalid_control_character" };
  }
  return { ok: true, kind: "NIF", normalized: value };
}

function validateNie(value: string): TaxIdValidationResult {
  const prefixMap: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const prefix = value.charAt(0);
  const mapped = prefixMap[prefix];
  if (mapped === undefined) {
    return { ok: false, error: "invalid_format" };
  }

  const digits = mapped + value.slice(1, 8);
  const providedLetter = value.charAt(8);
  const expectedLetter = controlLetterForNumber(Number.parseInt(digits, 10));

  if (providedLetter !== expectedLetter) {
    return { ok: false, error: "invalid_control_character" };
  }
  return { ok: true, kind: "NIE", normalized: value };
}

function validateCif(value: string): TaxIdValidationResult {
  const orgLetter = value.charAt(0);
  if (!CIF_ORG_LETTERS.has(orgLetter)) {
    return { ok: false, error: "invalid_format" };
  }

  const body = value.slice(1, 8);
  const providedControl = value.charAt(8);

  let evenSum = 0;
  let oddSum = 0;

  for (let index = 0; index < body.length; index += 1) {
    const digit = Number.parseInt(body.charAt(index), 10);
    // Positions in the body are 1..7 (one-based). Odd positions (1, 3, 5, 7)
    // are doubled and their digits summed; even positions are added as-is.
    const oneBasedPosition = index + 1;
    if (oneBasedPosition % 2 === 1) {
      const doubled = digit * 2;
      oddSum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      evenSum += digit;
    }
  }

  const totalSum = evenSum + oddSum;
  const controlDigit = (10 - (totalSum % 10)) % 10;
  const controlLetter = CIF_CONTROL_LETTERS.charAt(controlDigit);

  const mustBeLetter = CIF_LETTER_CONTROL_ORGS.has(orgLetter);
  const mustBeDigit = CIF_DIGIT_CONTROL_ORGS.has(orgLetter);

  if (mustBeLetter) {
    if (providedControl !== controlLetter) {
      return { ok: false, error: "invalid_control_character" };
    }
    return { ok: true, kind: "CIF", normalized: value };
  }

  if (mustBeDigit) {
    if (providedControl !== String(controlDigit)) {
      return { ok: false, error: "invalid_control_character" };
    }
    return { ok: true, kind: "CIF", normalized: value };
  }

  // Mixed organisation types accept either the digit or the letter.
  if (providedControl === String(controlDigit) || providedControl === controlLetter) {
    return { ok: true, kind: "CIF", normalized: value };
  }
  return { ok: false, error: "invalid_control_character" };
}
