import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Dashboard, Draft } from "../domain/models";
import {
  loadWorkspace,
  saveWorkspace,
  clearWorkspace,
} from "../infrastructure/persistence";
import { workspaceSchema } from "../infrastructure/schema";
export type Workspace = {
  draft: Draft | null;
  draftStep: number;
  editingDashboardId: string | null;
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  theme: "light" | "dark" | "system";
  freshnessDays: number;
  guideSeen: boolean;
};
const empty: Workspace = {
  draft: null,
  draftStep: 0,
  editingDashboardId: null,
  dashboards: [],
  activeDashboardId: null,
  theme: "system",
  freshnessDays: 45,
  guideSeen: false,
};
type Action = { type: "patch"; patch: Partial<Workspace> } | { type: "reset" };
function workspaceReducer(state: Workspace, action: Action): Workspace {
  return action.type === "reset" ? { ...empty } : { ...state, ...action.patch };
}
const Context = createContext<null | {
  state: Workspace;
  patch: (patch: Partial<Workspace>) => void;
  storageMessage: string;
  clear: () => void;
  blocked: boolean;
}>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const loaded = useRef<ReturnType<typeof loadWorkspace<Workspace>> | null>(
    null,
  );
  if (!loaded.current) loaded.current = loadWorkspace(workspaceSchema);
  const [state, dispatch] = useReducer(
    workspaceReducer,
    loaded.current.workspace ?? empty,
  );
  const [blocked, setBlocked] = useState(loaded.current.blocked);
  const [storageMessage, setMessage] = useState(loaded.current.message ?? "");
  const current = useRef(state);
  current.current = state;
  useEffect(() => {
    if (blocked) return;
    const save = () => {
      const result = saveWorkspace(current.current, workspaceSchema);
      setMessage(
        result.ok
          ? "Saved on this browser."
          : (result.message ??
              "Storage is unavailable. Your changes are in memory only."),
      );
    };
    const timer = setTimeout(save, 300);
    window.addEventListener("pagehide", save);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", save);
    };
  }, [state, blocked]);
  const clear = () => {
    const result = clearWorkspace();
    if (!result.ok) {
      setMessage(
        result.message ??
          "Could not delete browser data. Try browser site settings.",
      );
      return;
    }
    setBlocked(false);
    dispatch({ type: "reset" });
    setMessage("Local workspace deleted.");
  };
  return (
    <Context.Provider
      value={{
        state,
        patch: (patch) => dispatch({ type: "patch", patch }),
        storageMessage,
        clear,
        blocked,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWorkspace() {
  const c = useContext(Context);
  if (!c) throw new Error("Workspace provider missing");
  return c;
}
