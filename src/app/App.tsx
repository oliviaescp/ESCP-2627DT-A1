import { useEffect, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import { useWorkspace } from "./Workspace";
import {
  allSources,
  buildDashboard,
  confirmFields,
  newDraft,
  removeSource,
  withSampleData,
} from "./workflow";
import type { Dashboard, Draft, Scenario } from "../domain/models";
import { parseFile, createDataSource } from "../infrastructure/parsers";
import { Creation } from "../features/Creation";
import { Overview } from "../features/Overview";
import { QuickGuide } from "../features/QuickGuide";
import { DashboardView } from "../features/DashboardView";
import {
  AlertsView,
  SettingsView,
  SourceDetails,
  SourcesView,
} from "../features/Management";
import { Icon } from "../components/Icon";
import { Sheet } from "../components/Sheet";
export default function App() {
  const { state, patch, storageMessage, clear, blocked } = useWorkspace();
  const navigate = useNavigate();
  const location = useLocation();
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const changed = () => setOnline(navigator.onLine);
    window.addEventListener("online", changed);
    window.addEventListener("offline", changed);
    return () => {
      window.removeEventListener("online", changed);
      window.removeEventListener("offline", changed);
    };
  }, []);
  const sources = allSources(state.dashboards, state.draft);
  const source = sources.find((s) => s.id === sourceId);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        state.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : state.theme;
      document.documentElement.style.colorScheme =
        document.documentElement.dataset.theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [state.theme]);
  const create = () => {
    if (!state.draft)
      patch({ draft: newDraft(), draftStep: 0, editingDashboardId: null });
    navigate(
      `/onboarding/${["context", "kpis", "upload", "mapping", "generating"][state.draft ? Math.min(state.draftStep, 3) : 0]}`,
    );
  };
  const saveAndOpen = (dashboard: Dashboard) => {
    patch({
      dashboards: [...state.dashboards, dashboard],
      activeDashboardId: dashboard.id,
    });
    navigate(`/dashboards/${dashboard.id}`);
  };
  const openSample = (scenario: Scenario) => {
    const sample = withSampleData(newDraft(scenario));
    saveAndOpen(
      buildDashboard(
        { ...sample, mappings: confirmFields(sample.mappings) },
        undefined,
        undefined,
        state.freshnessDays,
      ),
    );
  };
  const update = (d: Dashboard) => {
    try {
      const built = buildDashboard(d, d.name, d, state.freshnessDays);
      patch({
        dashboards: state.dashboards.map((x) => (x.id === d.id ? built : x)),
      });
    } catch {
      setNotice(
        "Could not update this view. Check periods and mappings. Your saved dashboard is unchanged.",
      );
    }
  };
  const edit = (d: Dashboard) => {
    patch({
      draft: structuredClone(d),
      draftStep: 0,
      activeDashboardId: d.id,
      editingDashboardId: d.id,
    });
    navigate("/onboarding/context");
  };
  const deleteSource = (id: string) => {
    patch({
      dashboards: state.dashboards.map((d) => {
        const changed = removeSource(d, id);
        return buildDashboard(changed, d.name, d, state.freshnessDays);
      }),
      draft: state.draft ? removeSource(state.draft, id) : null,
    });
    setSourceId(null);
    setNotice(
      "Source removed from all dashboards. Dependent KPIs now show unavailable until remapped.",
    );
  };
  const replace = async (id: string, file: File) => {
    const parsed = await parseFile(file);
    const replacement = createDataSource(parsed, id);
    const modify = (d: Draft): Draft => ({
      ...d,
      sources: d.sources.map((s) => (s.id === id ? replacement : s)),
      mappings: d.mappings.map((m) =>
        m.sourceId === id ? { ...m, status: "suggested" as const } : m,
      ),
    });
    patch({
      dashboards: state.dashboards.map((d) =>
        buildDashboard(modify(d), d.name, d, state.freshnessDays),
      ),
      draft: state.draft ? modify(state.draft) : null,
    });
    setNotice(
      "Source replaced. Its mappings require confirmation; edit the dashboard to review them.",
    );
  };
  const count = state.dashboards.reduce((n, d) => n + d.warnings.length, 0);
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="app-header">
        <button className="brand" onClick={() => navigate("/")}>
          <span className="brand-mark" aria-hidden="true">
            <Icon name="trend" size={21} />
          </span>
          <span>dAIshi</span>
        </button>
        <nav className="bottom-nav" aria-label="Primary navigation">
          {[
            ["/", "grid", "Overview"],
            ["/sources", "database", "Sources"],
            ["/alerts", "bell", "Alerts"],
            ["/settings", "settings", "Settings"],
          ].map(([path, icon, label]) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              className={({ isActive }) =>
                isActive ||
                (path === "/" && location.pathname.startsWith("/dashboards/"))
                  ? "active"
                  : ""
              }
            >
              <span className="nav-icon">
                <Icon name={icon as "grid"} />
                {path === "/alerts" && count > 0 && (
                  <span className="nav-count">{count}</span>
                )}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="Toggle theme"
            onClick={() =>
              patch({
                theme:
                  document.documentElement.dataset.theme === "dark"
                    ? "light"
                    : "dark",
              })
            }
          >
            <Icon
              name={
                document.documentElement.dataset.theme === "dark"
                  ? "sun"
                  : "moon"
              }
            />
          </button>
          <button
            className="icon-button new-dashboard"
            aria-label="Create dashboard"
            onClick={create}
          >
            <Icon name="plus" size={20} />
            <span className="header-create-label">Create dashboard</span>
          </button>
        </div>
      </header>
      <main id="main" className="content" tabIndex={-1}>
        {!online && (
          <p role="status" className="notice">
            You are offline. Local calculations and saved data still work in
            this loaded app. Reloading requires access to the static app.
          </p>
        )}
        {blocked && (
          <p role="alert" className="error">
            {storageMessage} Clear the local workspace in Settings to enable
            saving; otherwise changes remain in memory.
          </p>
        )}
        {!blocked && storageMessage && !storageMessage.startsWith("Saved") && (
          <p role="status" className="notice">
            {storageMessage}
          </p>
        )}
        {notice && (
          <div role="status" className="notice">
            {notice}
            <button className="text-button" onClick={() => setNotice("")}>
              Dismiss message
            </button>
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={
              <>
                <QuickGuide onOpenPractice={saveAndOpen} />
                <Overview
                  dashboards={state.dashboards}
                  hasDraft={!!state.draft}
                  onCreate={create}
                  onSample={openSample}
                  onOpen={(id) => {
                    patch({ activeDashboardId: id });
                    navigate(`/dashboards/${id}`);
                  }}
                  onDelete={setDeleteId}
                />
              </>
            }
          />
          <Route
            path="/dashboards/:dashboardId"
            element={
              <DashboardRoute
                onEdit={edit}
                onUpdate={update}
                onReviewSource={setSourceId}
              />
            }
          />
          <Route
            path="/dashboards/:dashboardId/edit"
            element={<Navigate to="/" replace />}
          />
          <Route path="/onboarding/:step" element={<Creation />} />
          <Route
            path="/sources"
            element={
              <SourcesView
                sources={sources}
                onDelete={deleteSource}
                onReplace={replace}
              />
            }
          />
          <Route
            path="/alerts"
            element={
              <AlertsView
                dashboards={state.dashboards}
                onReviewSource={setSourceId}
              />
            }
          />
          <Route
            path="/settings"
            element={
              <>
                <SettingsView
                  theme={state.theme}
                  onTheme={(theme) => patch({ theme })}
                  onClear={() => {
                    clear();
                    navigate("/");
                  }}
                  storageMessage={storageMessage}
                />
                <label className="field freshness-setting">
                  Outdated-source threshold (days)
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={state.freshnessDays}
                    onChange={(e) => {
                      const days = Number(e.target.value);
                      if (Number.isInteger(days) && days >= 1 && days <= 3650)
                        patch({
                          freshnessDays: days,
                          dashboards: state.dashboards.map((d) =>
                            buildDashboard(d, d.name, d, days),
                          ),
                        });
                    }}
                  />
                </label>
              </>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <p className="workspace-status" role="status">
          {blocked
            ? "Saving paused"
            : storageMessage.startsWith("Saved")
              ? storageMessage
              : "Local-only prototype"}{" "}
          · You remain in control.
        </p>
      </main>
      {source && (
        <SourceDetails source={source} onClose={() => setSourceId(null)} />
      )}
      {deleteId && (
        <Sheet title="Delete this dashboard?" onClose={() => setDeleteId(null)}>
          <p>
            Its saved view and definitions will be removed from this browser.
            Sources used by other dashboards stay available.
          </p>
          <div className="actions">
            <button className="secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </button>
            <button
              className="danger"
              onClick={() => {
                patch({
                  dashboards: state.dashboards.filter((d) => d.id !== deleteId),
                  activeDashboardId:
                    state.activeDashboardId === deleteId
                      ? null
                      : state.activeDashboardId,
                });
                setDeleteId(null);
              }}
            >
              Delete dashboard
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
function DashboardRoute({
  onEdit,
  onUpdate,
  onReviewSource,
}: {
  onEdit: (d: Dashboard) => void;
  onUpdate: (d: Dashboard) => void;
  onReviewSource: (id: string) => void;
}) {
  const { state } = useWorkspace();
  const { dashboardId } = useParams();
  const d = state.dashboards.find((x) => x.id === dashboardId);
  return d ? (
    <DashboardView
      key={d.id}
      dashboard={d}
      onEdit={() => onEdit(d)}
      onUpdate={onUpdate}
      onReviewSource={onReviewSource}
    />
  ) : (
    <Navigate to="/" replace />
  );
}
