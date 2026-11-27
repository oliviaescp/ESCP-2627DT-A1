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
      <main className="content recovery-page">
        <p className="eyebrow">dAIshi workspace</p>
        <h1>Reload your workspace</h1>
        <p>
          Something interrupted the app. Your saved dashboards are still in this
          browser.
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
