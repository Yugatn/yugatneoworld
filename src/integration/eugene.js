export class EugeneMessengerAdapter {
  constructor() {
    this.mode = "interface-only";
  }

  async listConversations() {
    return [];
  }

  async getConversation() {
    return { messages: [], status: "not_connected" };
  }

  async composeMessage(target) {
    return { target, status: "not_connected" };
  }

  async sendMessage(draft) {
    return { ok: false, status: "not_connected", draft };
  }
}
