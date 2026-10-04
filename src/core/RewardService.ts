import type { RewardAdapter } from './CreditService';

/** Development adapter only. A real SDK must resolve granted only after completed reward. */
export const requestRewardedCredit: RewardAdapter = () => new Promise(resolve => {
  window.setTimeout(() => resolve({ granted: true }), 900);
});
