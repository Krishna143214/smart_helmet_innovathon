import type { ReactNode } from "react";
import { TopBar } from "./top-bar";
import type {
  FirebaseConnectionStatus,
  HelmetConnectionStatus,
} from "@/lib/types";

interface DashboardShellProps {
  children: ReactNode;
  email: string;
  firebaseStatus: FirebaseConnectionStatus;
  helmetStatus: HelmetConnectionStatus;
  lastUpdated: string;
  onSignOut: () => void;
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <main className="shell" id="appShell">
      <TopBar
        email={props.email}
        firebaseStatus={props.firebaseStatus}
        helmetStatus={props.helmetStatus}
        lastUpdated={props.lastUpdated}
        onSignOut={props.onSignOut}
      />
      {props.children}
      <div className="footer">
        MINEWATCH · SMART MINING HELMET · DATA PROVIDED BY YOUR ESP8266 DEVICE
      </div>
    </main>
  );
}
