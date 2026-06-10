export type ApplicationActionState = {
  success: string | null;
  error: string | null;
};

export const DEFAULT_APPLICATION_ACTION_STATE: ApplicationActionState = {
  success: null,
  error: null,
};
