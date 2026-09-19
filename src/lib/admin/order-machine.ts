/**
 * Order lifecycle state machine — shared by the admin actions (server) and
 * the OrderActions UI (client). Plain module: no "use server" here, since
 * server-action files may only export async functions.
 */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  awaiting_payment: ["cancelled"],
  payment_submitted: ["confirmed", "payment_rejected"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  payment_rejected: [],
  cancelled: [],
  expired: [],
};
