export type StudentActionState = {
  success: string | null;
  error: string | null;
};

export const DEFAULT_STUDENT_ACTION_STATE: StudentActionState = {
  success: null,
  error: null,
};
