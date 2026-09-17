"use client";

import dynamic from "next/dynamic";

const MapExplorer = dynamic(() => import("@/components/MapExplorer").then((m) => m.MapExplorer), {
  ssr: false,
  loading: () => (
    <div className="map-shell">
      <aside className="panel">
        <p className="kicker">Loading atlas</p>
        <h1>Mapping Access Under Occupation</h1>
        <p className="lede">Drawing the 1944 street layer…</p>
      </aside>
      <div className="map-canvas" />
      <aside className="panel right" />
    </div>
  ),
});

export default function HomePage() {
  return <MapExplorer />;
}
