/** Pure issuer authorization registry checks. Registry data must originate from a trusted administrator. */
export function authorizeIssuer(grants, {issuerId,organizationId,role,skillId,at}) {
  const t=Date.parse(at);
  if (!Number.isFinite(t)) return false;
  return grants.some(g=>g.issuerId===issuerId && g.organizationId===organizationId && g.role===role && g.status==="active" && (!g.skills || g.skills.includes(skillId)) && Number.isFinite(Date.parse(g.validFrom)) && Date.parse(g.validFrom)<=t && (!g.validUntil || Date.parse(g.validUntil)>=t) && (!g.revokedAt || Date.parse(g.revokedAt)>t));
}
export function checkIssuerSignature({grants,claim,signature,keys,verifySignature}) {
  if (!authorizeIssuer(grants,{issuerId:claim.issuerId,organizationId:claim.organizationId,role:claim.issuerRole,skillId:claim.skillId,at:claim.issuedAt})) return {valid:false,reason:"issuer_not_authorized"};
  const key=keys.find(k=>k.issuerId===claim.issuerId && k.organizationId===claim.organizationId && k.status==="active" && Date.parse(k.validFrom)<=Date.parse(claim.issuedAt) && (!k.validUntil || Date.parse(k.validUntil)>=Date.parse(claim.issuedAt)) && (!k.revokedAt || Date.parse(k.revokedAt)>Date.parse(claim.issuedAt)));
  if (!key) return {valid:false,reason:"no_active_key"};
  const record={id:claim.id,employeeId:claim.employeeId,organizationId:claim.organizationId,skillId:claim.skillId,issuerId:claim.issuerId,issuedAt:claim.issuedAt,reviewDueAt:claim.reviewDueAt,evidenceHash:claim.evidenceHash};
  return verifySignature(record,signature,key.publicKey) ? {valid:true,reason:"verified"} : {valid:false,reason:"invalid_signature"};
}
