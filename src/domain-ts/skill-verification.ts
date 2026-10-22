/** Skill attestations: evidence and authority checks. NOT a substitute for identity verification or cryptographic signature validation. */
export type AuthorityRole = "hr" | "supervisor" | "director";
export type EmploymentEvidence = { source: "employment_registry" | "employer_record"; referenceHash: string; verified: boolean; employeeId: string; organizationId: string; startDate: string; endDate?: string };
export type SkillEvidence = { kind: "work_sample" | "task_record" | "assessment"; referenceHash: string; verified: boolean };
export type SkillAttestation = { id: string; employeeId: string; organizationId: string; skillId: string; issuerId: string; issuerRole: AuthorityRole; issuerAuthorized: boolean; employment: EmploymentEvidence; evidence: SkillEvidence[]; issuedAt: string; reviewDueAt: string; revokedAt?: string; disputed?: boolean; signatureVerified: boolean };
export type SkillStatus = "verified_current" | "review_due" | "disputed" | "revoked" | "unverified";
const hashPattern = /^[a-f0-9]{64}$/i;
function dateValue(s: string): number { const n = Date.parse(s); return Number.isFinite(n) ? n : NaN; }
export function validateAttestation(a: SkillAttestation): string[] {
  const errors: string[] = [];
  if (![a.id,a.employeeId,a.organizationId,a.skillId,a.issuerId].every(v => typeof v === "string" && v.trim().length > 0)) errors.push("missing_identity");
  if (!["hr","supervisor","director"].includes(a.issuerRole) || !a.issuerAuthorized) errors.push("unauthorized_issuer");
  if (!a.employment.verified || a.employment.employeeId !== a.employeeId || a.employment.organizationId !== a.organizationId || !hashPattern.test(a.employment.referenceHash)) errors.push("employment_unverified");
  const issued = dateValue(a.issuedAt), due = dateValue(a.reviewDueAt), start = dateValue(a.employment.startDate);
  const end = a.employment.endDate ? dateValue(a.employment.endDate) : Infinity;
  if (![issued,due,start,end].every(n => !Number.isNaN(n)) || issued < start || issued > end || due <= issued) errors.push("invalid_dates");
  if (!a.evidence.length || !a.evidence.some(e => e.verified && hashPattern.test(e.referenceHash))) errors.push("skill_evidence_missing");
  if (!a.signatureVerified) errors.push("signature_unverified");
  return errors;
}
export function skillStatus(a: SkillAttestation, now: string): SkillStatus {
  if (a.revokedAt) return "revoked";
  if (a.disputed) return "disputed";
  if (validateAttestation(a).length) return "unverified";
  const time = dateValue(now);
  if (!Number.isFinite(time)) return "unverified";
  return time >= dateValue(a.reviewDueAt) ? "review_due" : "verified_current";
}
export function skillSummary(attestations: readonly SkillAttestation[], employeeId: string, now: string) {
  const selected = attestations.filter(a => a.employeeId === employeeId);
  const grouped = new Map<string, SkillAttestation[]>();
  for (const a of selected) grouped.set(a.skillId, [...(grouped.get(a.skillId) || []), a]);
  return [...grouped].map(([skillId, entries]) => ({ skillId, status: entries.some(a => skillStatus(a,now) === "verified_current") ? "verified_current" : entries.some(a => skillStatus(a,now) === "review_due") ? "review_due" : "unverified", confirmations: entries.filter(a => skillStatus(a,now) === "verified_current").length }));
}
