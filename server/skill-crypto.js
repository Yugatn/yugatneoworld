/** Detached Ed25519 signatures; keys must be enrolled through an authenticated authority registry in production. */
import { createHash, sign, verify } from "node:crypto";
export function canonicalSkillPayload(record) {
  const fields = ["id","employeeId","organizationId","skillId","issuerId","issuedAt","reviewDueAt","evidenceHash"];
  const obj = {};
  for (const field of fields) {
    if (typeof record[field] !== "string" || !record[field]) throw new TypeError("missing_" + field);
    obj[field] = record[field];
  }
  return JSON.stringify(obj);
}
export function digestEvidence(data) { return createHash("sha256").update(data).digest("hex"); }
export function signAttestation(record, privateKey) { return sign(null, Buffer.from(canonicalSkillPayload(record)), privateKey).toString("base64"); }
export function verifyAttestationSignature(record, signature, publicKey) {
  try {
    if (typeof signature !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) return false;
    const bytes = Buffer.from(signature, "base64");
    return bytes.length === 64 && verify(null, Buffer.from(canonicalSkillPayload(record)), publicKey, bytes);
  } catch { return false; }
}
