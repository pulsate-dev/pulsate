/**
 * Pulsate Epoch 2022 January 1st 00:00:0.000UTC
 */
export const EPOCH = 1640995200000n;
declare const unixTimeFromEpochBase: unique symbol;
export type UNIXTimeFromEpoch = number & {
  [unixTimeFromEpochBase]: 'UNIXTimeFromEpoch';
};

export function addSecondsToDate(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function calculateDiffFromEpoch(date: Date): UNIXTimeFromEpoch {
  return Number(BigInt(date.getTime()) - EPOCH) as UNIXTimeFromEpoch;
}
