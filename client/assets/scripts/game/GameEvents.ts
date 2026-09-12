/** 表现层只订阅这些结果，不反向改 Game。 */
export const GameEvents = {
  PICKED: "picked",
  PLACED: "placed",
  REJECTED: "rejected",
  CLEARED: "cleared",
  DEALT: "dealt",
} as const;

export type GameEventName = (typeof GameEvents)[keyof typeof GameEvents];
