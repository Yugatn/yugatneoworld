export class SymbiontEventAdapter {
  constructor() {
    this.mode = "local";
  }

  publish(event) {
    window.dispatchEvent(new CustomEvent("symbiont-event", { detail: event }));
    return event;
  }

  subscribe(handler) {
    const fn = (event) => handler(event.detail);
    window.addEventListener("symbiont-event", fn);
    return () => window.removeEventListener("symbiont-event", fn);
  }

  async requestCapability(capability) {
    return { authorized: false, capability, status: "not_connected_to_symbiont" };
  }

  async getIdentityAnchor() {
    return { status: "not_connected_to_symbiont" };
  }
}
