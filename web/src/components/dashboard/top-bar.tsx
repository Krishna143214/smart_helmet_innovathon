import type {
  FirebaseConnectionStatus,
  HelmetConnectionStatus,
} from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TopBarProps {
  email: string;
  firebaseStatus: FirebaseConnectionStatus;
  helmetStatus: HelmetConnectionStatus;
  lastUpdated: string;
  onSignOut: () => void;
}

const firebaseLabel: Record<FirebaseConnectionStatus, string> = {
  connecting: "Firebase connecting",
  connected: "Firebase connected",
  disconnected: "Firebase disconnected",
  error: "Database read denied",
};

export function TopBar({
  email,
  firebaseStatus,
  helmetStatus,
  onSignOut,
}: TopBarProps) {
  const pathname = usePathname();
  const firebaseDot =
    firebaseStatus === "connected"
      ? "green"
      : firebaseStatus === "error"
        ? "red"
        : "";
  const helmetDot =
    helmetStatus === "online"
      ? "green"
      : helmetStatus === "offline"
        ? "red"
        : "";

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Image
            src="/icon.png"
            width={44}
            height={44}
            alt="MineWatch"
            priority
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <div className="brand-name">MINEWATCH</div>
          <div className="brand-sub">SMART MINING HELMET</div>
        </div>
      </div>
      <div className="top-actions">
        <nav className="top-actions__nav" aria-label="Main navigation">
          {pathname !== "/" && <Link className="btn" href="/">Dashboard</Link>}
          {pathname !== "/simulation" && <Link className="btn" href="/simulation">Simulation Lab</Link>}
        </nav>
        <div className="pill">
          <span className={`dot ${firebaseDot}`} />
          <span>{firebaseLabel[firebaseStatus]}</span>
        </div>
        <div className="pill">
          <span className={`dot ${helmetDot}`} />
          <span>
            {helmetStatus === "unknown"
              ? "Device unknown"
              : `Helmet ${helmetStatus}`}
          </span>
        </div>
        <div className="pill user-pill" title={email}>
          Supervisor
        </div>
        <button
          className="btn flex items-center gap-2"
          id="logoutButton"
          type="button"
          onClick={onSignOut}
          title="Sign Out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out preview-icon"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
        </button>
      </div>
    </header>
  );
}
