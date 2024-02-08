/**
 * Pulsate Epoch 2022 January 1st 00:00:0.000UTC
 */
export const OffsetFromUnixEpoch = 1640995200000n;
declare const pulsateTime: unique symbol;
export type PulsateTime = number & {
  [pulsateTime]: never;
};

export function addSecondsToDate(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function calculateDiffFromEpoch(date: Date): PulsateTime {
  return Number(BigInt(date.getTime()) - OffsetFromUnixEpoch) as PulsateTime;
}
