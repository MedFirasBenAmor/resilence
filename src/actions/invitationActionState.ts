export type InvitationActionState = {
  success: string | null;
  error: string | null;
  invitePath?: string | null;
};

export const DEFAULT_INVITATION_ACTION_STATE: InvitationActionState = {
  success: null,
  error: null,
  invitePath: null,
};

export type InvitationLifecycleActionState = {
  success: string | null;
  error: string | null;
};

export const DEFAULT_INVITATION_LIFECYCLE_ACTION_STATE: InvitationLifecycleActionState = {
  success: null,
  error: null,
};
