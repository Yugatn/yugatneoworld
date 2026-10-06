export const EVENT_SCHEMA_VERSION = "0.1";

export function createEvent(eventType, payload = {}, context = {}) {
  return {
    event_id: crypto.randomUUID(),
    event_type: eventType,
    schema_version: EVENT_SCHEMA_VERSION,
    actor_identity: context.actorIdentity ?? "local-session",
    subject_scope: context.subjectScope ?? "self",
    object_id: context.objectId ?? null,
    world_id: context.worldId ?? "local-world",
    apartment_id: context.apartmentId ?? "local-apartment",
    timestamp: new Date().toISOString(),
    correlation_id: context.correlationId ?? null,
    capability: context.capability ?? null,
    payload,
    provenance: {
      source: "yugatn-eworld",
      mode: context.mode ?? "prototype"
    }
  };
}
