import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  clearWorkspace,
  loadWorkspace,
  saveWorkspace,
  WORKSPACE_KEY,
  type WorkspaceStorage,
} from "./persistence";
import { workspaceSchema } from "./schema";
const schema = z.object({ name: z.string(), count: z.number().finite() });
function memory(): WorkspaceStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe("versioned local workspace storage", () => {
  it("round trips validated state", () => {
    const storage = memory();
    expect(loadWorkspace(schema, storage)).toEqual({
      workspace: null,
      blocked: false,
    });
    expect(saveWorkspace({ name: "Anna", count: 3 }, schema, storage).ok).toBe(
      true,
    );
    expect(loadWorkspace(schema, storage).workspace).toEqual({
      name: "Anna",
      count: 3,
    });
  });
  it("preserves corrupt state until explicit recovery", () => {
    const storage = memory();
    storage.setItem(WORKSPACE_KEY, "broken");
    expect(loadWorkspace(schema, storage).blocked).toBe(true);
    expect(saveWorkspace({ name: "new", count: 1 }, schema, storage).ok).toBe(
      false,
    );
    expect(storage.getItem(WORKSPACE_KEY)).toBe("broken");
    expect(clearWorkspace(storage).ok).toBe(true);
    expect(saveWorkspace({ name: "new", count: 1 }, schema, storage).ok).toBe(
      true,
    );
  });
  it("rejects unsupported versions and nested invalid state", () => {
    const storage = memory();
    storage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        version: 2,
        savedAt: new Date().toISOString(),
        workspace: { name: "A", count: 2 },
      }),
    );
    expect(loadWorkspace(schema, storage).blocked).toBe(true);
    storage.setItem(
      WORKSPACE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        workspace: { name: 4, count: 2 },
      }),
    );
    expect(loadWorkspace(schema, storage).blocked).toBe(true);
  });
  it("reports write quota failures and preserves previous successful state", () => {
    const storage = memory();
    saveWorkspace({ name: "before", count: 1 }, schema, storage);
    const failing = {
      ...storage,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(
      saveWorkspace({ name: "after", count: 2 }, schema, failing),
    ).toMatchObject({ ok: false });
    expect(loadWorkspace(schema, storage).workspace?.name).toBe("before");
  });
  it("reports unavailable storage and delete failures", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadWorkspace(schema, storage).blocked).toBe(true);
    expect(saveWorkspace({ name: "A", count: 1 }, schema, storage).ok).toBe(
      false,
    );
    expect(clearWorkspace(storage).ok).toBe(false);
  });
  it("rejects non-finite values and impossible workspace shapes", () => {
    expect(
      saveWorkspace({ name: "A", count: Infinity }, schema, memory()).ok,
    ).toBe(false);
    expect(
      workspaceSchema.safeParse({
        draft: null,
        draftStep: 0,
        dashboards: [],
        activeDashboardId: null,
        theme: "dark",
        freshnessDays: 30,
      }).success,
    ).toBe(true);
    expect(
      workspaceSchema.safeParse({
        draft: null,
        draftStep: 0,
        dashboards: [{ id: "broken" }],
        activeDashboardId: null,
        theme: "dark",
        freshnessDays: 30,
      }).success,
    ).toBe(false);
  });
});
