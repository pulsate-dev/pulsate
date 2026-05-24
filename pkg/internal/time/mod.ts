/**
 * Pulsate Epoch 2022 January 1st 00:00:0.000UTC
 */
export const OFFSET_FROM_UNIX_EPOCH = 1640995200000n;
declare const pulsateTime: unique symbol;
export type PulsateTime = number & {
  [pulsateTime]: never;
};

export function addSecondsToDate(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function convertTo(date: Date): PulsateTime {
  return Number(BigInt(date.getTime()) - OFFSET_FROM_UNIX_EPOCH) as PulsateTime;
}
