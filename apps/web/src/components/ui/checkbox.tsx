"use client";

import * as CheckboxPrimitive from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<
  React.ComponentProps<typeof CheckboxPrimitive.Checkbox.Root>,
  "indeterminate"
> & {
  indeterminate?: boolean;
  children?: React.ReactNode;
};

function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Checkbox.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-[4px] border border-input ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:border-primary data-[checked]:bg-primary data-[checked]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Checkbox.Indicator className="flex h-full w-full items-center justify-center text-current">
        <CheckIcon className="size-3" aria-hidden="true" />
      </CheckboxPrimitive.Checkbox.Indicator>
      {children}
    </CheckboxPrimitive.Checkbox.Root>
  );
}

export { Checkbox };
