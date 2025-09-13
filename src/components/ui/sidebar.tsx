
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Bot, Code, Database, Laptop, Network, Puzzle } from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarVariants = cva(
  "fixed left-0 top-0 z-40 h-screen transition-transform bg-background border-r",
  {
    variants: {
      variant: {
        default: "w-64",
        narrow: "w-16",
      },
      mobile: {
        hidden: "-translate-x-full",
        visible: "translate-x-0",
      },
    },
    defaultVariants: {
      variant: "default",
      mobile: "hidden",
    },
  }
)

interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({
  className,
  variant,
  mobile,
  open,
  onClose,
  ...props
}: SidebarProps) {
  return (
    <>
      {open && mobile === "visible" && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          sidebarVariants({ variant, mobile: open ? "visible" : "hidden" }),
          className
        )}
        {...props}
      />
    </>
  )
}

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex h-14 items-center border-b px-4", className)}
      {...props}
    />
  )
}

export function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)} {...props} />
}

export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-auto border-t p-4", className)}
      {...props}
    />
  )
}

const buttonVariants = cva(
  "inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "flex w-full items-center gap-2 rounded-lg border bg-background px-4 py-3 hover:bg-accent hover:text-accent-foreground",
        active:
          "flex w-full items-center gap-2 rounded-lg border border-primary bg-primary/10 px-4 py-3 text-primary hover:bg-primary/20",
        mcp:
          "flex w-full items-center gap-2 rounded-lg border border-tech-cyan bg-tech-cyan/10 px-4 py-3 text-tech-cyan hover:bg-tech-cyan/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const sidebarIconVariants = cva("h-5 w-5", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      active: "text-primary",
      mcp: "text-tech-cyan",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface SidebarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode
}

export function SidebarButton({
  className,
  variant,
  icon,
  children,
  ...props
}: SidebarButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props}>
      {icon && <span className={sidebarIconVariants({ variant })}>{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
    </button>
  )
}

export function SidebarButtonGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />
}

export function SidebarLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mb-2 px-2 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  )
}

export const defaultSidebarButtons = [
  {
    label: "AI Chat",
    icon: <Bot />,
    active: true,
  },
  {
    label: "MCP Server",
    icon: <Network />,
    variant: "mcp" as const,
  },
  {
    label: "Database",
    icon: <Database />,
  },
  {
    label: "Edge Functions",
    icon: <Code />,
  },
  {
    label: "Playground",
    icon: <Laptop />,
  },
  {
    label: "Extensions",
    icon: <Puzzle />,
  },
]
