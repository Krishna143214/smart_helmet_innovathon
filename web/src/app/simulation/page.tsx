"use client";

import Image from "next/image";
import Link from "next/link";
import { AiSimulationLab } from "@/components/dashboard/ai-simulation-lab";

export default function SimulationPage() {
  return (
    <main className="shell simulation-page-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Image src="/icon.png" width={44} height={44} alt="MineWatch" priority className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="brand-name">MINEWATCH</div>
            <div className="brand-sub">SIMULATION DEMO</div>
          </div>
        </div>
        <div className="top-actions">
          <div className="pill"><span className="dot green" />Simulation only</div>
          <Link className="btn" href="/">Live dashboard</Link>
        </div>
      </header>
      <div className="dashboard-stack">
        <section className="page-heading">
          <div>
            <div className="eyebrow">MineWatch / AI tools</div>
            <h1>Simulation Lab</h1>
            <div className="subheading">Explore simulated sensor conditions and see how the model and helmet indicators respond.</div>
          </div>
          <div className="sync-note">SIMULATION MODE<br /><span>Separate from live helmet controls</span></div>
        </section>
        <AiSimulationLab />
      </div>
      <div className="footer">MINEWATCH · SIMULATION DEMO · NO LIVE DEVICE COMMANDS</div>
    </main>
  );
}
