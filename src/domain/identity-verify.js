/**
 * Identity verification for civic features (voting).
 * Links phone ↔ passport ↔ INN without storing plaintext passport/INN.
 * Only hashes + masked phone are kept in world state.
 *
 * Real government eID / SMS gateways are out of scope — this is the domain contract.
 */

/** Simple deterministic hash for Node/browser without crypto dependency in tests.
 * Not a security hash for production — replace with SHA-256 + salt server-side. */
export function hashIdentityValue(value, salt = "yugatn-id-v1") {
  const s = String(salt) + "|" + String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8) +
    ("00000000" + ((h * 2654435761) >>> 0).toString(16)).slice(-8);
}

export function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

/** RU INN: 10 (org) or 12 (person) digits. */
export function normalizeInn(inn) {
  const d = String(inn || "").replace(/\D/g, "");
  if (d.length !== 10 && d.length !== 12) return null;
  return d;
}

/** Passport series+number as digits only (RU: 10 digits typical). */
export function normalizePassport(passport) {
  const d = String(passport || "").replace(/\D/g, "");
  if (d.length < 8 || d.length > 12) return null;
  return d;
}

export function maskPhone(digits) {
  if (!digits || digits.length < 4) return "***";
  return "*".repeat(Math.max(0, digits.length - 4)) + digits.slice(-4);
}

export const VERIFY_LEVELS = Object.freeze({
  none: 0,
  phone: 1,
  full: 2 // phone + passport + INN linked
});

export function createIdentityState(seed = {}) {
  return {
    /** userId → record */
    profiles: seed.profiles && typeof seed.profiles === "object"
      ? Object.fromEntries(
          Object.entries(seed.profiles).map(([k, v]) => [k, { ...v }])
        )
      : {},
    /** Prevent duplicate full identities: hash → userId */
    innIndex: seed.innIndex && typeof seed.innIndex === "object" ? { ...seed.innIndex } : {},
    passportIndex: seed.passportIndex && typeof seed.passportIndex === "object"
      ? { ...seed.passportIndex }
      : {},
    phoneIndex: seed.phoneIndex && typeof seed.phoneIndex === "object" ? { ...seed.phoneIndex } : {}
  };
}

function profileOf(state, userId) {
  const id = String(userId || "local");
  if (!state.profiles[id]) {
    state.profiles[id] = {
      userId: id,
      level: VERIFY_LEVELS.none,
      phoneMasked: null,
      phoneHash: null,
      passportHash: null,
      innHash: null,
      phoneVerifiedAt: null,
      fullVerifiedAt: null,
      consentDataProcessing: false
    };
  }
  return state.profiles[id];
}

export function getVerification(state, userId) {
  const p = profileOf(state, userId);
  return {
    userId: p.userId,
    level: p.level,
    levelName: p.level >= VERIFY_LEVELS.full ? "full" : p.level >= VERIFY_LEVELS.phone ? "phone" : "none",
    phoneMasked: p.phoneMasked,
    phoneVerified: Boolean(p.phoneVerifiedAt),
    fullyVerified: p.level >= VERIFY_LEVELS.full,
    consentDataProcessing: p.consentDataProcessing
  };
}

export function isFullyVerified(state, userId) {
  return getVerification(state, userId).fullyVerified;
}

/**
 * Step 1: bind & verify phone (SMS code stub: any 4–6 digit code accepted in domain if provided).
 */
export function verifyPhone(state, userId, phone, {
  smsCode = null,
  expectedCode = null,
  consent = false
} = {}) {
  if (!consent) return { ok: false, reason: "consent_required" };
  const digits = normalizePhone(phone);
  if (!digits) return { ok: false, reason: "invalid_phone" };
  if (expectedCode != null && String(smsCode) !== String(expectedCode)) {
    return { ok: false, reason: "bad_sms_code" };
  }
  const phoneHash = hashIdentityValue(digits);
  const existing = state.phoneIndex[phoneHash];
  if (existing && existing !== String(userId)) {
    return { ok: false, reason: "phone_already_used" };
  }
  const p = profileOf(state, userId);
  p.consentDataProcessing = true;
  p.phoneHash = phoneHash;
  p.phoneMasked = maskPhone(digits);
  p.phoneVerifiedAt = Date.now();
  p.level = Math.max(p.level, VERIFY_LEVELS.phone);
  state.phoneIndex[phoneHash] = String(userId);
  return {
    ok: true,
    verification: getVerification(state, userId),
    message: "Phone verified"
  };
}

/**
 * Step 2: link passport + INN to the verified phone.
 * Plain values are hashed immediately and discarded.
 */
export function linkPassportAndInn(state, userId, {
  passport,
  inn,
  consent = false
} = {}) {
  if (!consent) return { ok: false, reason: "consent_required" };
  const p = profileOf(state, userId);
  if (p.level < VERIFY_LEVELS.phone || !p.phoneHash) {
    return { ok: false, reason: "phone_required_first" };
  }
  const passNorm = normalizePassport(passport);
  const innNorm = normalizeInn(inn);
  if (!passNorm) return { ok: false, reason: "invalid_passport" };
  if (!innNorm) return { ok: false, reason: "invalid_inn" };

  const passportHash = hashIdentityValue(passNorm);
  const innHash = hashIdentityValue(innNorm);

  if (state.passportIndex[passportHash] && state.passportIndex[passportHash] !== String(userId)) {
    return { ok: false, reason: "passport_already_used" };
  }
  if (state.innIndex[innHash] && state.innIndex[innHash] !== String(userId)) {
    return { ok: false, reason: "inn_already_used" };
  }

  p.passportHash = passportHash;
  p.innHash = innHash;
  p.fullVerifiedAt = Date.now();
  p.level = VERIFY_LEVELS.full;
  state.passportIndex[passportHash] = String(userId);
  state.innIndex[innHash] = String(userId);

  return {
    ok: true,
    verification: getVerification(state, userId),
    message: "Identity fully verified (phone + passport + INN). Raw documents not stored."
  };
}

/** Check hashes match without revealing data. */
export function matchesInnHash(state, userId, inn) {
  const norm = normalizeInn(inn);
  if (!norm) return false;
  const p = profileOf(state, userId);
  return p.innHash === hashIdentityValue(norm);
}

export function revokeVerification(state, userId) {
  const p = profileOf(state, userId);
  if (p.phoneHash) delete state.phoneIndex[p.phoneHash];
  if (p.passportHash) delete state.passportIndex[p.passportHash];
  if (p.innHash) delete state.innIndex[p.innHash];
  p.level = VERIFY_LEVELS.none;
  p.phoneMasked = null;
  p.phoneHash = null;
  p.passportHash = null;
  p.innHash = null;
  p.phoneVerifiedAt = null;
  p.fullVerifiedAt = null;
  return { ok: true };
}

export function summarizeIdentity(state, userId) {
  const v = getVerification(state, userId);
  return `${v.levelName}${v.phoneMasked ? " · " + v.phoneMasked : ""}`;
}
