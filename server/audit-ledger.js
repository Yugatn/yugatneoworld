/** Tamper-evident local hash chain; external anchoring is required to detect full-log replacement. */
import {createHash} from "node:crypto";
function sha(s){return createHash("sha256").update(s).digest("hex")}
export function appendAuditEvent(events,{type,actorId,subjectId,occurredAt,referenceHash}) {
  if (![type,actorId,subjectId,occurredAt,referenceHash].every(s=>typeof s==="string"&&s.length>0)) throw new Error("invalid_event");
  if (!Number.isFinite(Date.parse(occurredAt))) throw new Error("invalid_timestamp");
  const previousHash=events.length?events[events.length-1].hash:"GENESIS";
  const entry={sequence:events.length+1,type,actorId,subjectId,occurredAt,referenceHash,previousHash};
  return [...events,{...entry,hash:sha(JSON.stringify(entry))}];
}
export function verifyAuditChain(events){
  let previousHash="GENESIS";
  for(let i=0;i<events.length;i++){
    const {hash,...entry}=events[i];
    if(entry.sequence!==i+1||entry.previousHash!==previousHash||sha(JSON.stringify(entry))!==hash)return false;
    previousHash=hash;
  }
  return true;
}
