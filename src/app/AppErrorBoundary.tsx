import { Component, type ReactNode } from "react";
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="content">
        <h1>Something interrupted the workspace.</h1>
        <p>
          Your saved browser data has not been deleted. Reload to try again.
        </p>
        <button className="primary" onClick={() => location.reload()}>
          Reload app
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
