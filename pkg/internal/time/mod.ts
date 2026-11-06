/**
 * Pulsate Epoch 2022 January 1st 00:00:0.000UTC
 */
export const OFFSET_FROM_UNIX_EPOCH = 1640995200000n;
declare const pulsateTime: unique symbol;
export type PulsateTime = number & {
  [pulsateTime]: never;
};

export function addSecondsToDate(date: Date, seconds: number): Date {
  return addDuration(date, { seconds });
}

export interface Duration {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

/**
 * @returns a new Date shifted from `date` by `duration` (negative values shift it backward)
 */
export function addDuration(date: Date, duration: Duration): Date {
  const {
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
  } = duration;
  const totalMilliseconds =
    (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
  return new Date(date.getTime() + totalMilliseconds);
}

export function convertTo(date: Date): PulsateTime {
  return Number(BigInt(date.getTime()) - OFFSET_FROM_UNIX_EPOCH) as PulsateTime;
}
