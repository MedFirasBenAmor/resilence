export type ProjectRequestActionState = {
  success: string | null;
  error: string | null;
};

export const DEFAULT_PROJECT_REQUEST_ACTION_STATE: ProjectRequestActionState = {
  success: null,
  error: null,
};
