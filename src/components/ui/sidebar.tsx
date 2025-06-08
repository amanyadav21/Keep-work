
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

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextValue = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobileSheetOpen: boolean;
  setIsMobileSheetOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  collapsible?: "offcanvas" | "icon" | "none";
  effectiveSidebarWidth: string;
  sidebarWidthExpanded: string;
  sidebarIconWidth: string;
  defaultOpen: boolean; // Added for SSR consistency
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    collapsible?: SidebarContextValue['collapsible'];
    sidebarWidthExpanded?: string;
    sidebarIconWidth?: string;
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
    const [clientMounted, setClientMounted] = React.useState(false);
    const detectedIsMobile = useIsMobile();

    React.useEffect(() => {
      setClientMounted(true);
    }, []);

    const isMobile = clientMounted ? detectedIsMobile : false;

    const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);
    const [isSidebarOpenState, setIsSidebarOpenState] = React.useState(defaultOpen);

    const open = openProp ?? isSidebarOpenState;

    const setOpen = React.useCallback(
      (value: boolean | ((prevState: boolean) => boolean)) => {
        const newOpenState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(newOpenState);
        } else {
          setIsSidebarOpenState(newOpenState);
        }
        if (clientMounted && typeof document !== 'undefined' && collapsible === 'icon' && !isMobile) {
          document.cookie = `${SIDEBAR_COOKIE_NAME}=${newOpenState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
        }
      },
      [setOpenProp, open, collapsible, clientMounted, isMobile, setIsSidebarOpenState]
    );

    React.useEffect(() => {
      if (clientMounted && typeof document !== 'undefined' && collapsible === 'icon' && !isMobile) {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`))
          ?.split('=')[1];

        if (cookieValue !== undefined) {
          const cookieIsOpen = cookieValue === 'true';
          if (cookieIsOpen !== open) {
            setOpen(cookieIsOpen);
          }
        }
      }
    }, [clientMounted, collapsible, isMobile, defaultOpen, setOpen, open]);


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
      if (clientMounted && typeof window !== 'undefined') {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }
    }, [clientMounted, toggleSidebar]);

    const state = open ? "expanded" : "collapsed";

    const effectiveSidebarWidth = React.useMemo(() => {
      const currentOpen = clientMounted ? open : defaultOpen;
      const currentIsMobile = clientMounted ? isMobile : false;

      if (currentIsMobile) {
        return '0px';
      }
      if (collapsible === 'offcanvas' || collapsible === 'none') {
         return currentOpen ? sidebarWidthExpanded : '0px';
      }
      return currentOpen ? sidebarWidthExpanded : sidebarIconWidth;
    }, [clientMounted, open, defaultOpen, isMobile, collapsible, sidebarWidthExpanded, sidebarIconWidth]);


    const contextValue = React.useMemo<SidebarContextValue>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        isMobileSheetOpen,
        setIsMobileSheetOpen,
        toggleSidebar,
        collapsible,
        effectiveSidebarWidth,
        sidebarWidthExpanded,
        sidebarIconWidth,
        defaultOpen,
      }),
      [state, open, setOpen, isMobile, isMobileSheetOpen, toggleSidebar, collapsible, effectiveSidebarWidth, sidebarWidthExpanded, sidebarIconWidth, defaultOpen]
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
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
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
    const context = useSidebar();
    const { isMobile, isMobileSheetOpen, setIsMobileSheetOpen, collapsible, effectiveSidebarWidth, state: sidebarDesktopState, open: sidebarDesktopOpen, defaultOpen } = context;
    const [clientMounted, setClientMounted] = React.useState(false);
     React.useEffect(() => {
        setClientMounted(true);
    }, []);


    if (!clientMounted && context.isMobile === undefined ) { // SSR or pre-hydration
      const ssrOpen = defaultOpen;
      // const ssrEffectiveWidth = ssrOpen ? context.sidebarWidthExpanded : context.sidebarIconWidth;

      if (collapsible === 'offcanvas' && !ssrOpen) return null;
      if (collapsible === 'none' && !ssrOpen) return null;

    }

    if (isMobile) {
      return (
        <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className={cn(
              "w-[var(--sidebar-width-mobile)] p-0 [&>button]:hidden bg-card text-foreground",
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
      );
    }

    if (collapsible === 'offcanvas' && !sidebarDesktopOpen) {
      return null;
    }
     if (collapsible === 'none' && !sidebarDesktopOpen) {
        return null;
    }


    return (
      <div
        ref={ref}
        data-sidebar="sidebar"
        data-collapsible={collapsible}
        data-state={sidebarDesktopState}
        className={cn(
          "fixed inset-y-0 z-40 flex h-screen flex-col bg-card text-foreground border-border",
          side === "left" ? "left-0 border-r" : "right-0 border-l",
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
    );
  }
);
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & { tooltip?: string | React.ComponentProps<typeof TooltipContent> }
>(({ className, onClick, tooltip = "Toggle Sidebar", ...props }, ref) => {
  const context = useSidebar();
  const { toggleSidebar, isMobile, collapsible, open: sidebarOpen, defaultOpen } = context;
  const [clientMounted, setClientMounted] = React.useState(false);

  React.useEffect(() => {
    setClientMounted(true);
  }, []);


  if (!clientMounted && !isMobile) {
     const ssrOpen = defaultOpen;
     if (collapsible === "none" || (collapsible === 'offcanvas' && !ssrOpen)) {
        return null;
     }
  } else if (clientMounted && !isMobile) {
     if (collapsible === "none" || (collapsible === 'offcanvas' && !sidebarOpen)) {
        return null;
     }
  }

  const buttonElement = (
     <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7 text-foreground hover:bg-muted", className)}
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

  if (clientMounted && tooltip && !isMobile && collapsible === 'icon' && !sidebarOpen) {
    let tooltipProps: React.ComponentProps<typeof TooltipContent> = {
      side: "right",
      align: "center",
      className: "bg-popover text-popover-foreground"
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
});
SidebarTrigger.displayName = "SidebarTrigger";


const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-ring text-foreground placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="header"
      className={cn("flex h-[60px] items-center border-b border-border p-3 min-w-0", className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-sidebar="footer"
      className={cn("mt-auto flex flex-col gap-2 border-t border-border p-3", className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  const context = useSidebar();
  const { open, collapsible, isMobile, defaultOpen } = context;
  const [clientMounted, setClientMounted] = React.useState(false);
  React.useEffect(() => { setClientMounted(true); }, []);

  let isIconOnlyMode: boolean;
  if (!clientMounted) {
    // Approximation for SSR/pre-hydration. isMobile will be false on server.
    isIconOnlyMode = !defaultOpen && collapsible === 'icon'; 
  } else {
    isIconOnlyMode = !open && collapsible === 'icon' && !isMobile;
  }

  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn(
        isIconOnlyMode 
          ? "my-1.5 h-px w-3/4 mx-auto bg-border/70" // Style for icon-only mode
          : "mx-2 my-1 w-auto bg-border", // Style for expanded mode
        className
      )}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";


const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const context = useSidebar();
  const { open, collapsible, isMobile, defaultOpen } = context;
  const [clientMounted, setClientMounted] = React.useState(false);
  React.useEffect(() => { setClientMounted(true); }, []);

  const isIconOnlyMode = clientMounted ? (!open && collapsible === 'icon' && !isMobile) : (!defaultOpen && collapsible === 'icon');

  return (
    <div
      ref={ref}
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        isIconOnlyMode && "items-center overflow-hidden",
        className
      )}
      {...props}
    />
  );
});
SidebarContent.displayName = "SidebarContent";


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
));
SidebarMenu.displayName = "SidebarMenu";

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
));
SidebarMenuItem.displayName = "SidebarMenuItem";

export const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md px-2.5 py-1.5 text-left text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-foreground hover:bg-muted hover:text-foreground",
        primary: "text-primary-foreground bg-primary hover:bg-primary/90",
        secondary: "text-secondary-foreground bg-secondary hover:bg-secondary/80",
        ghost: "text-foreground hover:bg-muted hover:text-foreground",
        destructive: "text-destructive hover:bg-destructive/10 text-destructive-foreground",
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
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
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
    const [clientMounted, setClientMounted] = React.useState(false);
    React.useEffect(() => { setClientMounted(true); }, []);

    const { isMobile, open: sidebarOpen, collapsible, defaultOpen } = context;

    let isIconOnlyEffective: boolean;
    if (!clientMounted) {
        isIconOnlyEffective = !defaultOpen && collapsible === 'icon' && !isMobile;
    } else {
        isIconOnlyEffective = !sidebarOpen && collapsible === 'icon' && !isMobile;
    }

    const effectiveSize = isIconOnlyEffective ? 'icon' : size;

    const activeClasses = () => {
      if (!isActive) return "";

      if (isIconOnlyEffective) {
        // Collapsed (Icon-Only) Sidebar Active Item Styling
        return "bg-accent text-accent-foreground"; // Consistent for all variants when icon-only
      } else {
        // Expanded Sidebar Active Item Styling
        if (variant === "default" || variant === "ghost") {
          return "bg-muted text-primary font-semibold border-l-2 border-primary";
        }
        if (variant === "primary") {
          return "bg-primary text-primary-foreground font-semibold"; // Already has strong active appearance
        }
        if (variant === "destructive") {
          return "bg-destructive/10 text-destructive font-semibold border-l-2 border-destructive";
        }
      }
      return "";
    };


    const buttonContent = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={effectiveSize}
        data-active={isActive}
        className={cn(
          sidebarMenuButtonVariants({ variant, size: effectiveSize, className }),
          activeClasses()
        )}
        {...props}
      >
        {children}
      </Comp>
    );

    const showTooltip = clientMounted && tooltip && isIconOnlyEffective;

    if (showTooltip) {
      let tooltipProps: React.ComponentProps<typeof TooltipContent> = {
        side: "right",
        align: "center",
        className: "bg-popover text-popover-foreground"
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
);
SidebarMenuButton.displayName = "SidebarMenuButton";


export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};

