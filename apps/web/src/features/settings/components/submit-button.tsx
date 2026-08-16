"use client";

import { useFormStatus } from "react-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
};

export function SubmitButton({ children, className, pendingLabel }: Props) {
  const { pending } = useFormStatus();
  const { t } = useTranslation();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(className, pending && "opacity-50")}
    >
      {pending ? (pendingLabel ?? t("common.loading")) : children}
    </button>
  );
}
