import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "../components/Icon";

export function AppLaunch({ children }: { children: ReactNode }) {
  const [launching, setLaunching] = useState(true);

  useEffect(() => {
    if (!launching) return;
    const finish = () => setLaunching(false);
    const reducedMotion = matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timer = window.setTimeout(finish, reducedMotion ? 350 : 2100);
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", skip);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", skip);
    };
  }, [launching]);

  if (!launching) return <>{children}</>;

  return (
    <main className="launch-screen" aria-label="dAIshi launch">
      <div className="launch-brand">
        <span className="launch-mark" aria-hidden="true">
          <Icon name="trend" size={64} />
        </span>
        <h1 className="launch-name">dAIshi</h1>
      </div>
      <button className="launch-skip" onClick={() => setLaunching(false)}>
        Skip intro
      </button>
    </main>
  );
}
