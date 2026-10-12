/**
 * Differentiated access control for school / life-sim resources.
 * Roles + optional per-resource grants. Admin has full access.
 */

export const ACCESS_ROLES = Object.freeze([
  "guest",
  "student",
  "parent",
  "teacher",
  "admin"
]);

/** Resource kinds that can be ACL-gated. */
export const RESOURCE_KINDS = Object.freeze([
  "schedule",
  "class",
  "homework",
  "presentation",
  "bulletin",
  "embed",
  "school.settings"
]);

export const ACTIONS = Object.freeze([
  "view",
  "create",
  "edit",
  "delete",
  "assign",
  "moderate",
  "manage_roles"
]);

/**
 * Default matrix: role → resource → actions.
 * Admin is implicit full access (see can()).
 */
export const DEFAULT_ACL = Object.freeze({
  guest: Object.freeze({
    bulletin: Object.freeze(["view"]),
    presentation: Object.freeze(["view"])
  }),
  student: Object.freeze({
    schedule: Object.freeze(["view"]),
    class: Object.freeze(["view"]),
    homework: Object.freeze(["view"]),
    presentation: Object.freeze(["view"]),
    bulletin: Object.freeze(["view"]),
    embed: Object.freeze(["view"])
  }),
  parent: Object.freeze({
    schedule: Object.freeze(["view"]),
    class: Object.freeze(["view"]),
    homework: Object.freeze(["view"]),
    presentation: Object.freeze(["view"]),
    bulletin: Object.freeze(["view"]),
    embed: Object.freeze(["view"])
  }),
  teacher: Object.freeze({
    schedule: Object.freeze(["view", "create", "edit", "delete", "assign"]),
    class: Object.freeze(["view", "create", "edit"]),
    homework: Object.freeze(["view", "create", "edit", "assign"]),
    presentation: Object.freeze(["view", "create", "edit"]),
    bulletin: Object.freeze(["view", "create", "edit"]),
    embed: Object.freeze(["view", "create", "edit"])
  }),
  admin: Object.freeze(
    Object.fromEntries(
      RESOURCE_KINDS.map((k) => [k, Object.freeze([...ACTIONS])])
    )
  )
});

export function createAccessState(seed = {}) {
  return {
    /** role → overrides (optional extra grants / denials) */
    grants: seed.grants && typeof seed.grants === "object" ? structuredClone(seed.grants) : {},
    /** resourceId → { viewers: [], editors: [] } fine-grained */
    resources: seed.resources && typeof seed.resources === "object" ? structuredClone(seed.resources) : {}
  };
}

export function isAdmin(role) {
  return role === "admin";
}

/**
 * Check if role may perform action on resource kind.
 * Optional resourceId for per-item ACL.
 */
export function can(role, resourceKind, action, accessState = null, resourceId = null) {
  if (!ACCESS_ROLES.includes(role)) role = "guest";
  if (!RESOURCE_KINDS.includes(resourceKind)) return false;
  if (!ACTIONS.includes(action)) return false;

  if (isAdmin(role)) return true;

  // Per-resource ACL
  if (resourceId && accessState?.resources?.[resourceId]) {
    const r = accessState.resources[resourceId];
    if (action === "view" && Array.isArray(r.viewers) && r.viewers.includes(role)) return true;
    if (["edit", "delete", "create", "assign", "moderate"].includes(action)) {
      if (Array.isArray(r.editors) && r.editors.includes(role)) return true;
    }
    // explicit deny list
    if (Array.isArray(r.deny) && r.deny.includes(`${role}:${action}`)) return false;
  }

  // Role overrides in grants
  const override = accessState?.grants?.[role]?.[resourceKind];
  if (Array.isArray(override)) {
    if (override.includes(action)) return true;
    if (override.includes(`-${action}`)) return false;
  }

  const matrix = DEFAULT_ACL[role] || DEFAULT_ACL.guest;
  const allowed = matrix[resourceKind] || [];
  return allowed.includes(action);
}

/** Grant extra action to a role (admin tooling). */
export function grant(accessState, role, resourceKind, action) {
  if (!ACCESS_ROLES.includes(role) || !RESOURCE_KINDS.includes(resourceKind) || !ACTIONS.includes(action)) {
    return { ok: false, reason: "invalid" };
  }
  if (!accessState.grants[role]) accessState.grants[role] = {};
  if (!Array.isArray(accessState.grants[role][resourceKind])) {
    accessState.grants[role][resourceKind] = [];
  }
  const list = accessState.grants[role][resourceKind];
  const deny = `-${action}`;
  const di = list.indexOf(deny);
  if (di >= 0) list.splice(di, 1);
  if (!list.includes(action)) list.push(action);
  return { ok: true };
}

/** Revoke / deny action for role. */
export function revoke(accessState, role, resourceKind, action) {
  if (!ACCESS_ROLES.includes(role) || !RESOURCE_KINDS.includes(resourceKind) || !ACTIONS.includes(action)) {
    return { ok: false, reason: "invalid" };
  }
  if (!accessState.grants[role]) accessState.grants[role] = {};
  if (!Array.isArray(accessState.grants[role][resourceKind])) {
    accessState.grants[role][resourceKind] = [];
  }
  const list = accessState.grants[role][resourceKind];
  const i = list.indexOf(action);
  if (i >= 0) list.splice(i, 1);
  const deny = `-${action}`;
  if (!list.includes(deny)) list.push(deny);
  return { ok: true };
}

/** Set viewers/editors for a specific resource id. */
export function setResourceAcl(accessState, resourceId, { viewers = null, editors = null, deny = null } = {}) {
  const id = String(resourceId).slice(0, 64);
  if (!accessState.resources[id]) accessState.resources[id] = { viewers: [], editors: [], deny: [] };
  const r = accessState.resources[id];
  if (viewers) r.viewers = viewers.map(String).filter((x) => ACCESS_ROLES.includes(x));
  if (editors) r.editors = editors.map(String).filter((x) => ACCESS_ROLES.includes(x));
  if (deny) r.deny = deny.map(String).slice(0, 40);
  return r;
}

export function listPermissions(role) {
  if (isAdmin(role)) {
    return Object.fromEntries(RESOURCE_KINDS.map((k) => [k, [...ACTIONS]]));
  }
  const matrix = DEFAULT_ACL[role] || DEFAULT_ACL.guest;
  const out = {};
  for (const k of RESOURCE_KINDS) {
    out[k] = matrix[k] ? [...matrix[k]] : [];
  }
  return out;
}

export function summarizeAccess(role) {
  const perms = listPermissions(role);
  const bits = Object.entries(perms)
    .filter(([, a]) => a.length)
    .map(([k, a]) => `${k}:{${a.join(",")}}`);
  return `${role}: ${bits.join(" · ") || "none"}`;
}
