"use client";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

/** Жою сияқты әрекеттерді растаумен орындайтын батырма. */
export default function ConfirmButton({ action, confirm, children, className = "btn-danger btn-sm" }: { action: () => Promise<unknown>; confirm?: string; children: React.ReactNode; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const r = (await action()) as { error?: string } | undefined;
          if (r?.error) alert(r.error);
        });
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
