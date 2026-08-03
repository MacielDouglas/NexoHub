"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  className,
  pendingLabel = "Carregando...",
}: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(className, pending && "opacity-50")}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
