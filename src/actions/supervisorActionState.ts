export type SupervisorFieldErrors = Partial<Record<
  | "firstName"
  | "lastName"
  | "email"
  | "password"
  | "confirmPassword"
  | "title"
  | "department"
  | "expertiseArea"
  | "organization",
  string
>>;

export type SupervisorActionState = {
  success: string | null;
  error: string | null;
  fieldErrors: SupervisorFieldErrors;
};

export const DEFAULT_SUPERVISOR_ACTION_STATE: SupervisorActionState = {
  success: null,
  error: null,
  fieldErrors: {} as SupervisorFieldErrors,
};
