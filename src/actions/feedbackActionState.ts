export type FeedbackActionState = {
  success: string | null;
  error: string | null;
};

export const DEFAULT_FEEDBACK_ACTION_STATE: FeedbackActionState = {
  success: null,
  error: null,
};
