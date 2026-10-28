import { z } from "zod";

export const WORKSPACE_KEY = "daishi.workspace.v1";
export interface WorkspaceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export interface LoadResult<T> {
  workspace: T | null;
  message?: string;
  blocked: boolean;
}
export interface SaveResult {
  ok: boolean;
  message?: string;
}

function storageOrDefault(storage?: WorkspaceStorage): WorkspaceStorage {
  return storage ?? window.localStorage;
}

/** Invalid saved data is retained until the user explicitly chooses recovery. */
export function loadWorkspace<T>(
  schema: z.ZodType<T>,
  storage?: WorkspaceStorage,
): LoadResult<T> {
  try {
    const raw = storageOrDefault(storage).getItem(WORKSPACE_KEY);
    if (raw === null) return { workspace: null, blocked: false };
    const envelope: unknown = JSON.parse(raw);
    const parsed = z
      .object({
        version: z.literal(1),
        savedAt: z.string().datetime(),
        workspace: schema,
      })
      .safeParse(envelope);
    if (!parsed.success)
      return {
        workspace: null,
        blocked: true,
        message:
          "The saved workspace is damaged or from an unsupported version. It has been left untouched. Clear local workspace in Settings to start again.",
      };
    return { workspace: parsed.data.workspace, blocked: false };
  } catch {
    return {
      workspace: null,
      blocked: true,
      message:
        "The local workspace could not be read. Browser storage may be unavailable or saved data may be damaged. Existing data has not been overwritten. Check browser permissions or clear local workspace in Settings.",
    };
  }
}

export function saveWorkspace<T>(
  workspace: T,
  schema: z.ZodType<T>,
  storage?: WorkspaceStorage,
): SaveResult {
  try {
    const validated = schema.safeParse(workspace);
    if (!validated.success)
      return {
        ok: false,
        message:
          "The workspace could not be validated and was not saved. Your previous saved workspace is unchanged. Return to the last valid state or reload.",
      };
    const destination = storageOrDefault(storage);
    const previous = loadWorkspace(schema, destination);
    if (previous.blocked) return { ok: false, message: previous.message };
    const envelope = {
      version: 1,
      savedAt: new Date().toISOString(),
      workspace: validated.data,
    };
    destination.setItem(WORKSPACE_KEY, JSON.stringify(envelope));
    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        "Changes are only in memory: browser storage is unavailable or full. Your previous saved workspace is unchanged. Delete unused sources or dashboards and retry saving; keep this tab open until saved.",
    };
  }
}

export function clearWorkspace(storage?: WorkspaceStorage): SaveResult {
  try {
    storageOrDefault(storage).removeItem(WORKSPACE_KEY);
    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        "Local data could not be cleared. Check browser storage permissions and retry. Existing data is unchanged.",
    };
  }
}
