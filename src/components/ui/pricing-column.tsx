"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Button } from "./button";

const pricingColumnVariants = cva(
  "relative flex flex-col gap-6 overflow-hidden rounded-2xl p-8 shadow-xl max-w-md",
  {
    variants: {
      variant: {
        default: "glass-1",
        glow: "glass-2 after:content-[''] after:absolute after:-top-[128px] after:left-1/2 after:h-[128px] after:w-[100%] after:max-w-[960px] after:-translate-x-1/2 after:rounded-[50%] dark:after:bg-foreground/30 after:blur-[72px]",
        "glow-brand": "glass-4 after:content-[''] after:absolute after:-top-[128px] after:left-1/2 after:h-[128px] after:w-[100%] after:max-w-[960px] after:-translate-x-1/2 after:rounded-[50%] after:bg-brand-foreground/70 after:blur-[72px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface PricingColumnProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pricingColumnVariants> {
  name: string;
  icon?: ReactNode;
  description: string;
  price: string | number;
  priceNote: string;
  cta: {
    variant: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    label: string;
    href: string;
  };
  features: string[];
  popular?: boolean;
}

export function PricingColumn({
  name,
  icon,
  description,
  price,
  priceNote,
  cta,
  features,
  variant,
  popular,
  className,
  ...props
}: PricingColumnProps) {
  return (
    <div
      className={cn(pricingColumnVariants({ variant, className }))}
      {...props}
    >
      {/* Top gradient line */}
      <hr
        className={cn(
          "absolute top-0 left-[10%] h-[1px] w-[80%] border-0 bg-gradient-to-r from-transparent via-foreground/60 to-transparent",
          variant === "glow-brand" && "via-brand",
        )}
      />
      
      <div className="flex flex-col gap-7">
        <header className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 font-bold">
            {icon && (
              <div className="text-muted-foreground flex items-center gap-2">
                {icon}
              </div>
            )}
            {name}
            {popular && (
              <Badge variant="secondary" className="ml-2 text-xs">
                Popular
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground max-w-[220px] text-sm">
            {description}
          </p>
        </header>
        
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-3 lg:flex-col lg:items-start xl:flex-row xl:items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-muted-foreground text-2xl font-bold">
                  {typeof price === 'number' ? '$' : ''}
                </span>
                <span className="text-6xl font-bold">{price}</span>
              </div>
            </div>
            <div className="flex min-h-[40px] flex-col">
              {typeof price === 'number' && price > 0 && (
                <>
                  <span className="text-sm">/month</span>
                  <span className="text-muted-foreground text-sm">
                    billed monthly
                  </span>
                </>
              )}
            </div>
          </div>
        </section>
        
        <Button variant={cta.variant} size="lg" asChild className="w-full">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
        
        <p className="text-muted-foreground min-h-[40px] max-w-[220px] text-sm">
          {priceNote}
        </p>
        
        <hr className="border-input" />
      </div>
      
      <div>
        <ul className="flex flex-col gap-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <Icon 
                icon="solar:check-circle-bold" 
                className="text-muted-foreground size-4 shrink-0" 
              />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { pricingColumnVariants };
