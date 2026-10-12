/**
 * Air & rail ticket booking (domain model).
 * Affordable search + draft booking; real payment / GDS is out of scope for v0.1.
 */

export const TRAVEL_MODES = Object.freeze(["air", "rail"]);

export const TICKET_STATUSES = Object.freeze([
  "draft",
  "held",
  "confirmed",
  "cancelled",
  "used"
]);

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Sample routes — low example fares (philosophy: keep travel accessible in the sim). */
export const SAMPLE_ROUTES = Object.freeze([
  { id: "air-led-mov", mode: "air", from: "LED", to: "MOW", fromName: "Санкт-Петербург", toName: "Москва", durationMin: 80, basePrice: 45 },
  { id: "air-mov-led", mode: "air", from: "MOW", to: "LED", fromName: "Москва", toName: "Санкт-Петербург", durationMin: 80, basePrice: 45 },
  { id: "air-led-txl", mode: "air", from: "LED", to: "BER", fromName: "Санкт-Петербург", toName: "Berlin", durationMin: 150, basePrice: 90 },
  { id: "rail-led-mov", mode: "rail", from: "LED", to: "MOW", fromName: "Санкт-Петербург", toName: "Москва", durationMin: 240, basePrice: 28 },
  { id: "rail-mov-led", mode: "rail", from: "MOW", to: "LED", fromName: "Москва", toName: "Санкт-Петербург", durationMin: 240, basePrice: 28 },
  { id: "rail-led-hel", mode: "rail", from: "LED", to: "HEL", fromName: "Санкт-Петербург", toName: "Helsinki", durationMin: 210, basePrice: 35 }
]);

export function createTravelState(seed = {}) {
  return {
    tickets: Array.isArray(seed.tickets) ? seed.tickets.map((t) => ({ ...t, passengers: t.passengers ? [...t.passengers] : [] })) : []
  };
}

export function searchTickets({ mode, from, to, maxPrice } = {}) {
  let list = SAMPLE_ROUTES.map((r) => ({ ...r }));
  if (mode && TRAVEL_MODES.includes(mode)) list = list.filter((r) => r.mode === mode);
  if (from) list = list.filter((r) => r.from.toLowerCase() === String(from).toLowerCase());
  if (to) list = list.filter((r) => r.to.toLowerCase() === String(to).toLowerCase());
  if (maxPrice != null) list = list.filter((r) => r.basePrice <= maxPrice);
  return list.sort((a, b) => a.basePrice - b.basePrice);
}

/**
 * Draft a ticket. price stays affordable (base * passengers).
 */
export function draftTicket({
  routeId,
  departAt,
  passengers = ["Traveler"],
  cabin = "standard"
} = {}) {
  const route = SAMPLE_ROUTES.find((r) => r.id === routeId);
  if (!route) return null;
  const names = (Array.isArray(passengers) ? passengers : [passengers])
    .map((p) => String(p).slice(0, 40))
    .filter(Boolean)
    .slice(0, 6);
  if (!names.length) names.push("Traveler");
  const start = Number(departAt) || Date.now() + 86400_000;
  const price = Math.round(route.basePrice * names.length * 100) / 100;
  return {
    ticketId: uid("tkt"),
    routeId: route.id,
    mode: route.mode,
    from: route.from,
    to: route.to,
    fromName: route.fromName,
    toName: route.toName,
    durationMin: route.durationMin,
    departAt: start,
    arriveAt: start + route.durationMin * 60_000,
    passengers: names,
    cabin: cabin === "business" ? "business" : "standard",
    price,
    currency: "EUR",
    status: "draft",
    createdAt: Date.now()
  };
}

export function confirmTicket(travelState, ticket) {
  if (!ticket || ticket.status !== "draft") return { ok: false, reason: "invalid" };
  ticket.status = "confirmed";
  ticket.confirmedAt = Date.now();
  travelState.tickets.push(ticket);
  return { ok: true, ticket };
}

export function cancelTicket(travelState, ticketId) {
  const t = travelState.tickets.find((x) => x.ticketId === ticketId);
  if (!t) return { ok: false, reason: "not_found" };
  if (t.status === "used") return { ok: false, reason: "already_used" };
  t.status = "cancelled";
  return { ok: true, ticket: t };
}

export function listTickets(travelState, { mode, status } = {}) {
  let list = travelState.tickets.map((t) => ({ ...t, passengers: [...t.passengers] }));
  if (mode) list = list.filter((t) => t.mode === mode);
  if (status) list = list.filter((t) => t.status === status);
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function summarizeTravel(travelState) {
  const active = travelState.tickets.filter((t) => t.status === "confirmed").length;
  const air = travelState.tickets.filter((t) => t.mode === "air" && t.status === "confirmed").length;
  const rail = travelState.tickets.filter((t) => t.mode === "rail" && t.status === "confirmed").length;
  if (!travelState.tickets.length) return "No tickets";
  return `${active} active · air ${air} · rail ${rail}`;
}
