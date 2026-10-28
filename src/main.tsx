import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import { WorkspaceProvider } from "./app/Workspace";
import { AppErrorBoundary } from "./app/AppErrorBoundary";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <WorkspaceProvider>
          <App />
        </WorkspaceProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);
