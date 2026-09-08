"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();
  const [showTransitionMessage, setShowTransitionMessage] = useState(false);

  useEffect(() => {
    if (!pending) {
      setShowTransitionMessage(false);
      return;
    }
    const timer = window.setTimeout(() => setShowTransitionMessage(true), 1000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <div className="space-y-3">
      <Button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="h-14 w-full bg-[linear-gradient(135deg,#0047ab,#0059ff)] text-lg shadow-[0_16px_34px_rgba(0,71,171,0.22)] hover:brightness-[1.03] disabled:cursor-wait disabled:opacity-80"
      >
        {pending ? <><LoaderCircle className="h-5 w-5 animate-spin" /> Signing in…</> : "Continue"}
      </Button>
      {showTransitionMessage ? <p role="status" className="text-center text-sm text-[var(--gray-mid)]">Taking you to your dashboard…</p> : null}
    </div>
  );
}
