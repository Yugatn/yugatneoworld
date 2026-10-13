export function pushNotification(
  state: any,
  opts: {
    userId: string;
    type?: string;
    title?: string;
    body?: string;
    refType?: string | null;
    refId?: string | null;
  }
): { ok: boolean; notification?: any; reason?: string };
