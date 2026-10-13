export function ensureWallet(state: any, userId: string, opts?: { initial?: number }): any;
export function credit(
  state: any,
  userId: string,
  amount: number,
  meta?: { type?: string; note?: string }
): any;
export function getBalance(state: any, userId: string): number;
