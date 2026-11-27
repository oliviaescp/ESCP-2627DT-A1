import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./app/App";
import { AppLaunch } from "./app/AppLaunch";
import { WorkspaceProvider } from "./app/Workspace";
import { AppErrorBoundary } from "./app/AppErrorBoundary";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <HashRouter>
        <WorkspaceProvider>
          <AppLaunch>
            <App />
          </AppLaunch>
        </WorkspaceProvider>
      </HashRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
