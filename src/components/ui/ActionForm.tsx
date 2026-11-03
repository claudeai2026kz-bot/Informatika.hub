"use client";
import { useActionState } from "react";
import { FormAlert } from "./Field";

type State = { error?: string; ok?: string } | undefined;

/** Server action-мен жұмыс істейтін форма: қате мен сәттілік хабарын көрсетеді. */
export default function ActionForm({ action, children, className = "space-y-4", encType }: {
  action: (s: State, fd: FormData) => Promise<State>;
  children: React.ReactNode;
  className?: string;
  encType?: string;
}) {
  const [state, run] = useActionState(action, undefined);
  return (
    <form action={run} className={className} encType={encType}>
      <FormAlert msg={state?.error} />
      <FormAlert tone="ok" msg={state?.ok} />
      {children}
    </form>
  );
}
