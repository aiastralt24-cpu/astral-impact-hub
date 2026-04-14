"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  confirmMessage?: string;
  pendingLabel?: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  pendingLabel,
  children,
  disabled,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      disabled={disabled || pending}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) {
          return;
        }

        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingLabel ?? "Working..." : children}
    </button>
  );
}
