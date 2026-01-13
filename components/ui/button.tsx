"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold uppercase tracking-wide border-none ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4.5 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 select-none cursor-pointer active:shadow-none",
  {
    variants: {
      variant: {
        default:
          "bg-white text-slate-700 hover:bg-slate-50 shadow-[0_4px_0_#cbd5e1] active:translate-y-[4px]",
        outline:
          "bg-white text-slate-600 hover:bg-slate-100 shadow-[0_4px_0_#cbd5e1] active:translate-y-[4px]",
        secondary:
          "bg-[#1CB0F6] text-white hover:bg-[#2BB5F7] shadow-[0_4px_0_#0DA5E6] active:translate-y-[4px]",
        ghost:
          "bg-transparent text-slate-500 border-transparent hover:bg-slate-100 shadow-none active:translate-y-0",
        destructive:
          "bg-[#FF4B4B] text-white hover:bg-[#FF5C5C] shadow-[0_4px_0_#E63946] active:translate-y-[4px]",
        link: "text-primary underline-offset-4 hover:underline shadow-none active:translate-y-0",
        success:
          "bg-[#58CC02] text-white hover:bg-[#5DD302] shadow-[0_4px_0_#58a700] active:translate-y-[4px]",
        warning:
          "bg-[#FFB800] text-white hover:bg-[#FFC420] shadow-[0_4px_0_#E6A500] active:translate-y-[4px]",
      },
      size: {
        default:
          "h-11 gap-1.5 px-4 py-2 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-8 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1 px-3 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        lg: "h-12 gap-2 px-8 text-lg has-data-[icon=inline-end]:pr-6 has-data-[icon=inline-start]:pl-6",
        icon: "size-11",
        "icon-xs": "size-8 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

