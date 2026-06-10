export type PortfolioActionState = {
  success: string | null;
  error: string | null;
};

export const DEFAULT_PORTFOLIO_ACTION_STATE: PortfolioActionState = {
  success: null,
  error: null,
};
