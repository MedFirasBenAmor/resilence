export type ProjectRoomActionState = {
  success: string | null;
  error: string | null;
};

export const DEFAULT_PROJECT_ROOM_ACTION_STATE: ProjectRoomActionState = {
  success: null,
  error: null,
};
