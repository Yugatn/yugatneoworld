import { loadLaborStore, publicVacancies } from "./labor-store.js";
/** Public, read-only labor discovery API. No personal data or unverified reputation. */
const demo = Object.freeze([
  { id: "demo-design", organizationId: "demo-studio", organizationName: "Demo Creative Studio", title: "2D World Designer", description: "Create accessible educational and social spaces in a 2D virtual world.", location: "Remote", status: "open", demo: true, worldRoom: "office:demo-studio" },
  { id: "demo-mentor", organizationId: "demo-academy", organizationName: "Demo Academy", title: "Learning Community Mentor", description: "Help organize collaborative workshops and educational events.", location: "Remote", status: "open", demo: true, worldRoom: "office:demo-academy" }
]);
function reply(res, status, body, headers) {
  res.writeHead(status, { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}
export async function handleLaborApi(req, res, pathname, headers = {}) {
  if (!pathname.startsWith("/api/v1/labor/")) return false;
  if (req.method !== "GET" && req.method !== "HEAD") {
    reply(res, 405, { error: "method_not_allowed" }, { ...headers, Allow: "GET, HEAD" });
    return true;
  }
  if (pathname === "/api/v1/labor/vacancies") {
    const url = new URL(req.url, "http://localhost");
    const query = (url.searchParams.get("q") || "").trim().toLocaleLowerCase().slice(0, 100);
    const configured = Boolean(process.env.LABOR_STORE_PATH);
    try {
      const results = configured
        ? publicVacancies(await loadLaborStore(process.env.LABOR_STORE_PATH), query)
        : demo.filter(v => !query || [v.title, v.description, v.location, v.organizationName].some(s => s.toLocaleLowerCase().includes(query)));
      reply(res, 200, { items: results, total: results.length, source: configured ? "operator_snapshot" : "demonstration_data", disclaimer: configured ? "Employer verification depends on operator-provided records. Applications are disabled." : "Not real vacancies. Applications are disabled." }, headers);
    } catch {
      reply(res, 503, { error: "labor_store_unavailable" }, headers);
    }
    return true;
  }
  if (pathname === "/api/v1/labor/capabilities") {
    reply(res, 200, { discovery: "demo", applications: false, reviews: false, reputation: false, persistence: Boolean(process.env.LABOR_STORE_PATH), worldRooms: "prototype" }, headers);
    return true;
  }
  reply(res, 404, { error: "not_found" }, headers);
  return true;
}
