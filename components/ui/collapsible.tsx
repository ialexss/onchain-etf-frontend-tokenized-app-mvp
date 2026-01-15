"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

const CollapsibleContext = React.createContext<{
  open: boolean
  onOpenChange: (open: boolean) => void
}>({
  open: false,
  onOpenChange: () => {},
})

const Collapsible = React.forwardRef<
  HTMLDivElement,
  CollapsibleProps
>(({ open: controlledOpen, onOpenChange, children, className, ...props }, ref) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const handleOpenChange = onOpenChange || setInternalOpen

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
})
Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ className, children, asChild, ...props }, ref) => {
  const { open, onOpenChange } = React.useContext(CollapsibleContext)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: () => onOpenChange(!open),
      ref,
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpenChange(!open)}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
}

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, children, forceMount, ...props }, ref) => {
  const { open } = React.useContext(CollapsibleContext)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setIsMounted(true)
    }
  }, [open])

  if (!open && !forceMount && !isMounted) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden transition-all",
        open ? "animate-in slide-in-from-top-1" : "animate-out slide-out-to-top-1",
        className
      )}
      style={{
        display: open ? "block" : "none",
      }}
      {...props}
    >
      {children}
    </div>
  )
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }

