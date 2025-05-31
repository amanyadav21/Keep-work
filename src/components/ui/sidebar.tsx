
"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH_MOBILE = "18rem" 
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextValue = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  isMobileSheetOpen: boolean
  setIsMobileSheetOpen: (open: boolean) => void
  isMobile: boolean | undefined
  toggleSidebar: () => void
  collapsible?: "offcanvas" | "icon" | "none"
  effectiveSidebarWidth: string
  sidebarWidthExpanded: string
  sidebarIconWidth: string
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean
    open?: boolean
    onOpenChange?: (open: boolean) => void
    collapsible?: SidebarContextValue['collapsible']
    sidebarWidthExpanded?: string
    sidebarIconWidth?: string
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      collapsible = "icon",
      sidebarWidthExpanded = "var(--sidebar-width-expanded)",
      sidebarIconWidth = "var(--sidebar-width-collapsed)",
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile(); // Handles its own mounting and window checks. Undefined on server.

    const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
    const [isSidebarOpenState, setIsSidebarOpenState] = React.useState(() => {
      if (typeof document !== 'undefined' && collapsible === 'icon') {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
          ?.split('=')[1];
        if (cookieValue) {
          return cookieValue === 'true';
        }
      }
      return defaultOpen;
    });

    const open = openProp ?? isSidebarOpenState;

    const setOpen = React.useCallback(
      (value: boolean | ((prevState: boolean) => boolean)) => {
        const newOpenState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(newOpenState);
        } else {
          setIsSidebarOpenState(newOpenState);
        }
        if (typeof document !== 'undefined' && collapsible === 'icon') {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${newOpenState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open, collapsible, setIsSidebarOpenState]
    );

    const toggleSidebar = React.useCallback(() => {
      if (isMobile) {
        setIsMobileSheetOpen((currentOpenState) => !currentOpenState);
      } else {
        setOpen((currentOpenState) => !currentOpenState);
      }
    }, [isMobile, setOpen, setIsMobileSheetOpen]);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
          (event.metaKey || event.ctrlKey)
        ) {
          event.preventDefault();
          toggleSidebar();
        }
      };
      if (typeof window !== 'undefined') {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }
    }, [toggleSidebar]);

    const state = open ? "expanded" : "collapsed";

    const effectiveSidebarWidth = React.useMemo(() => {
      if (isMobile === undefined) { // SSR or before useIsMobile client effect
        if (collapsible === 'offcanvas' || collapsible === 'none') return '0px';
        return defaultOpen ? sidebarWidthExpanded : (collapsible === 'icon' ? sidebarIconWidth : '0px');
      }
      if (isMobile) {
        return '0px'; // Mobile uses Sheet, so main content has no margin
      }
      // Desktop logic
      if (collapsible === 'offcanvas' || collapsible === 'none') {
        return '0px';
      }
      return open ? sidebarWidthExpanded : sidebarIconWidth;
    }, [isMobile, collapsible, open, defaultOpen, sidebarWidthExpanded, sidebarIconWidth]);

    const contextValue = React.useMemo<SidebarContextValue>(
      () => ({
        state,
        open,
        setOpen,
        isMobile, // Directly use isMobile from useIsMobile hook
        isMobileSheetOpen,
        setIsMobileSheetOpen,
        toggleSidebar,
        collapsible,
        effectiveSidebarWidth,
        sidebarWidthExpanded,
        sidebarIconWidth,
      }),
      [state, open, setOpen, isMobile, isMobileSheetOpen, toggleSidebar, collapsible, effectiveSidebarWidth, sidebarWidthExpanded, sidebarIconWidth]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            className={cn("group/sidebar-wrapper", className)}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
)
SidebarProvider.displayName = "SidebarProvider"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right"
  }
>(
  (
    {
      side = "left",
      className,
      children,
      style, 
      ...props
    },
    ref
  ) => {
    const context = useSidebar(); // context will be available due to the fix in SidebarProvider

    const { isMobile, isMobileSheetOpen, setIsMobileSheetOpen, collapsible, effectiveSidebarWidth, state: sidebarDesktopState, open: sidebarDesktopOpen } = context;

    if (isMobile === undefined) {
      // SSR or initial client render before isMobile is determined.
      // Render a placeholder or nothing, consistent with desktop default.
      // This avoids trying to render mobile sheet logic on server.
      // The fixed sidebar for desktop might render with default width.
      if (collapsible === 'offcanvas' || collapsible === 'none') return null;
       const ssrWidth = sidebarDesktopOpen ? context.sidebarWidthExpanded : context.sidebarIconWidth;
       return (
         <div
            ref={ref}
            data-sidebar="sidebar"
            data-ssr="true"
            className={cn(
              "fixed inset-y-0 z-40 flex h-screen flex-col",
              side === "left" ? "left-0" : "right-0",
              className 
            )}
            style={{ width: ssrWidth, ...style }}
            {...props}
          >
            {/* Optionally render children if sidebar is visible by default on desktop SSR */}
            {/* Or keep it minimal to avoid hydration mismatches with client-rendered children */}
         </div>
       );
    }
    
    if (isMobile) {
      return (
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className={cn(
              "w-[var(--sidebar-width-mobile)] p-0 [&>button]:hidden", 
              className 
            )}
            style={
              {
                "--sidebar-width-mobile": SIDEBAR_WIDTH_MOBILE,
                ...style 
              } as React.CSSProperties
            }
            side={side}
          >
            <SheetTitle className="sr-only">Sidebar Menu</SheetTitle>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      )
    }
    
    if (collapsible === 'offcanvas' && !sidebarDesktopOpen) {
      return null; 
    }
    
    if (collapsible === 'none' && !sidebarDesktopOpen) { // 'none' implies always open or always closed based on `open`
        return null;
    }


    return (
      <div
        ref={ref}
        data-sidebar="sidebar"
        data-collapsible={collapsible}
        data-state={sidebarDesktopState}
        className={cn(
          "fixed inset-y-0 z-40 flex h-screen flex-col", 
          side === "left" ? "left-0" : "right-0",
          className
        )}
        style={{
          width: effectiveSidebarWidth,
          transition: 'width 0.2s ease-in-out', 
          ...style
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & { tooltip?: string | React.ComponentProps<typeof TooltipContent> }
>(({ className, onClick, tooltip = "Toggle Sidebar", ...props }, ref) => {
  const context = useSidebar();
  if (!context) return null; // Should not happen with provider fix

  const { toggleSidebar, isMobile, collapsible, open: sidebarOpen, effectiveSidebarWidth } = context;

  if (isMobile === undefined && !isMobile) { // SSR and targeting desktop: render based on desktop rules
     if (collapsible === "none" || (collapsible === 'offcanvas' && effectiveSidebarWidth !== '0px')) {
        return null;
     }
  } else if (!isMobile) { // Client, desktop
     if (collapsible === "none" || (collapsible === 'offcanvas' && effectiveSidebarWidth !== '0px')) {
        return null;
     }
  }
  // For mobile (isMobile === true), trigger is always shown.

  const buttonElement = (
     <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );

  if (tooltip && !isMobile && collapsible === 'icon' && !sidebarOpen) { 
    let tooltipProps: React.ComponentProps<typeof TooltipContent> = {
      side: "right",
      align: "center",
    };
    if (typeof tooltip === "string") {
      tooltipProps.children = <p>{tooltip}</p>;
    } else {
      tooltipProps = {...tooltipProps, ...tooltip};
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
        <TooltipContent {...tooltipProps} />
      </Tooltip>
    );
  }

  return buttonElement;
})
SidebarTrigger.displayName = "SidebarTrigger"


const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className
      )}
      {...props}
    />
  )
})
SidebarInput.displayName = "SidebarInput"

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex h-[60px] items-center border-b border-sidebar-border p-3", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("mt-auto flex flex-col gap-2 border-t border-sidebar-border p-3", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  const context = useSidebar();
  if (!context) return null;
  if (!context.open && context.collapsible === "icon" && !context.isMobile) { // Also check not mobile
    return null
  }
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn(
        "mx-2 my-1 w-auto bg-sidebar-border", 
        className
      )}
      {...props}
    />
  )
})
SidebarSeparator.displayName = "SidebarSeparator"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const context = useSidebar();
  if (!context) return null;
  const { open, collapsible, isMobile } = context;
  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col", 
        !open && collapsible === 'icon' && !isMobile && "items-center overflow-hidden",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"


const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-0.5", className)} 
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md px-2.5 py-1.5 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-primary data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        primary: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90",
        outline:
          "bg-transparent shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: { 
        default: "h-9 text-sm",
        sm: "h-8 text-xs",
        lg: "h-10 text-sm", 
        icon: "h-9 w-9 !p-0 flex items-center justify-center rounded-md"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const context = useSidebar();
    
    if(!context) { // Should ideally not happen with provider fixes
        return <Comp ref={ref} className={cn(sidebarMenuButtonVariants({ variant, size, className }))} {...props} disabled>{children}</Comp>;
    }

    const { isMobile, open: sidebarOpen, collapsible } = context;
    const isIconOnly = !isMobile && !sidebarOpen && collapsible === 'icon';
    const effectiveSize = isIconOnly ? 'icon' : size;

    const buttonContent = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={effectiveSize} 
        data-active={isActive}
        className={cn(
          sidebarMenuButtonVariants({ variant, size: effectiveSize, className }) 
        )}
        {...props}
      >
        {children}
      </Comp>
    );

    const showTooltip = tooltip && isIconOnly;

    if (showTooltip) {
      let tooltipProps: React.ComponentProps<typeof TooltipContent> = {
        side: "right",
        align: "center",
      };
      if (typeof tooltip === "string") {
        tooltipProps.children = <p>{tooltip}</p>;
      } else {
        tooltipProps = {...tooltipProps, ...tooltip};
      }
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent {...tooltipProps} />
        </Tooltip>
      );
    }

    return buttonContent;
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
