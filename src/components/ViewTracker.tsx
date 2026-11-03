"use client";
import { useEffect } from "react";

export default function ViewTracker({ kind, id }: { kind: "material" | "assessment"; id: string }) {
  useEffect(() => {
    fetch("/api/views", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id }), keepalive: true }).catch(() => {});
  }, [kind, id]);
  return null;
}
