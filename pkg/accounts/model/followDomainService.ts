import type { AccountID } from './account.js';
import type { AccountFollow } from './follow.js';

/**
 * Returns true if `fromID` is in the followers list (i.e., fromID follows the account that owns `followers`).
 */
export const isFollowedBy = (
  followers: AccountFollow[],
  fromID: AccountID,
): boolean => followers.some((f) => f.getFromID() === fromID);

/**
 * Returns true if `targetID` is in the following list (i.e., the account that owns `following` follows targetID).
 */
export const isFollowing = (
  following: AccountFollow[],
  targetID: AccountID,
): boolean => following.some((f) => f.getTargetID() === targetID);
