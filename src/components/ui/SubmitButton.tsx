"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export default function SubmitButton({ children, className = "btn-primary w-full h-12", pendingText = "Күте тұрыңыз…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? (<><Loader2 className="h-4 w-4 animate-spin" /> {pendingText}</>) : children}
    </button>
  );
}
