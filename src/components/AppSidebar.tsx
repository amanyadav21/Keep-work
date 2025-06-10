
"use client";

import * as React from 'react';
import { usePathname, useRouter }
from 'next/navigation';
import Link from 'next/link';
import {
  ListChecks,
  Users,
  Tag,
  Trash2,
  User,
  Settings as SettingsIcon,
  LogOut,
  CalendarClock, 
  Inbox, 
  AlarmClock,
  BarChart3,
  PlusCircle,
  Loader2,
  Edit2, // For editing labels (future)
  XCircle, // For deleting labels (future)
  ChevronDown,
  ChevronRight,
  MoreVertical, // Added for the three-dot menu
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label as UiLabel } from '@/components/ui/label'; // Aliased to avoid conflict
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import type { TaskFilter, Label } from '@/types';
import { cn } from '@/lib/utils';
import { db } from '@/firebase/config';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface AppSidebarProps {
  onAddTask: () => void; 
  currentFilter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  selectedLabelId: string | null;
  onLabelSelect: (labelId: string | null) => void;
}

interface NavItemConfig {
  href?: string;
  action?: () => void;
  label: string;
  icon: React.ElementType;
  tooltip: string;
  disabled?: boolean;
  isPageLink?: boolean;
  isExternal?: boolean;
  isFilter?: boolean;
  filterName?: TaskFilter;
  isLabel?: boolean;
  labelId?: string;
}

// Function to generate a color from a predefined palette based on string hash
// This provides some visual variety for labels without user color pickers yet
const labelColorPalette = [
  "#4285F4", // Google Blue
  "#DB4437", // Google Red
  "#F4B400", // Google Yellow
  "#0F9D58", // Google Green
  "#AB47BC", // Purple
  "#00ACC1", // Cyan
  "#FF7043", // Orange
  "#78909C", // Blue Grey
  "#5C6BC0", // Indigo
  "#EC407A", // Pink
];

const getDeterministicColorForLabel = (labelName: string): string => {
  let hash = 0;
  for (let i = 0; i < labelName.length; i++) {
    const char = labelName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % labelColorPalette.length;
  return labelColorPalette[index];
};


export function AppSidebar({ onAddTask, currentFilter, onFilterChange, selectedLabelId, onLabelSelect }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, logOut, loading: authLoading } = useAuth();
  const { 
    state: sidebarState, 
    collapsible, 
    isMobile, 
    open: sidebarOpen, 
    defaultOpen 
  } = useSidebar();
  const router = useRouter();
  const { toast } = useToast();
  const [clientMounted, setClientMounted] = React.useState(false);

  const [userLabels, setUserLabels] = React.useState<Label[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = React.useState(false);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = React.useState(false);
  const [newLabelName, setNewLabelName] = React.useState("");
  const [isSavingLabel, setIsSavingLabel] = React.useState(false);
  // const [editingLabel, setEditingLabel] = React.useState<Label | null>(null); // For future edit functionality

  React.useEffect(() => {
    setClientMounted(true);
  }, []);

  React.useEffect(() => {
    if (user && clientMounted) {
      setIsLoadingLabels(true);
      const labelsCollectionRef = collection(db, `users/${user.uid}/labels`);
      const q = query(labelsCollectionRef, orderBy("name", "asc"));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const labelsData = querySnapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name,
            userId: data.userId,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            color: data.color || getDeterministicColorForLabel(data.name), 
          } as Label;
        });
        setUserLabels(labelsData);
        setIsLoadingLabels(false);
      }, (error) => {
        console.error("Error fetching labels:", error);
        toast({ title: "Error Fetching Labels", description: error.message, variant: "destructive" });
        setIsLoadingLabels(false);
      });
      return () => unsubscribe();
    } else {
      setUserLabels([]);
    }
  }, [user, clientMounted, toast]);

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !user) return;
    setIsSavingLabel(true);
    try {
      const labelsCollectionRef = collection(db, `users/${user.uid}/labels`);
      const existingLabel = userLabels.find(label => label.name.toLowerCase() === newLabelName.trim().toLowerCase());
      if (existingLabel) {
        toast({ title: "Label Exists", description: `A label named "${existingLabel.name}" already exists.`, variant: "default" });
        setIsSavingLabel(false);
        return;
      }

      await addDoc(labelsCollectionRef, {
        name: newLabelName.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        color: getDeterministicColorForLabel(newLabelName.trim()),
      });
      toast({ title: "Label Created", description: `Label "${newLabelName.trim()}" added.` });
      setNewLabelName("");
      setIsCreateLabelDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating label:", error);
      toast({ title: "Error Creating Label", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingLabel(false);
    }
  };
  
  const handleOpenEditLabelDialog = (label: Label) => {
    setLabelToEdit(label);
    setEditedLabelName(label.name);
    setIsEditLabelDialogOpen(true);
  };

  const handleUpdateLabel = async () => {
    if (!editedLabelName.trim() || !labelToEdit || !user) return;
    setIsUpdatingLabel(true);
    try {
      const existingLabel = userLabels.find(
        (l) => l.name.toLowerCase() === editedLabelName.trim().toLowerCase() && l.id !== labelToEdit.id
      );
      if (existingLabel) {
        toast({ title: "Label Name Exists", description: `Another label named "${existingLabel.name}" already exists.`, variant: "default" });
        setIsUpdatingLabel(false);
        return;
      }

      const labelDocRef = doc(db, `users/${user.uid}/labels`, labelToEdit.id);
      await updateDoc(labelDocRef, { name: editedLabelName.trim() }); 
      toast({ title: "Label Updated", description: `Label renamed to "${editedLabelName.trim()}".` });
      setIsEditLabelDialogOpen(false);
      setLabelToEdit(null);
    } catch (error: any) {
      console.error("Error updating label:", error);
      toast({ title: "Error Updating Label", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdatingLabel(false);
    }
  };

  const handleOpenDeleteLabelDialog = (label: Label) => {
    setLabelToDelete(label);
    setIsDeleteLabelDialogOpen(true);
  };

  const handleDeleteLabel = async () => {
    if (!labelToDelete || !user) return;
    setIsDeletingLabel(true);
    try {
      const batch = writeBatch(db);
      const labelDocRef = doc(db, `users/${user.uid}/labels`, labelToDelete.id);
      batch.delete(labelDocRef);

      const tasksQuery = query(collection(db, `users/${user.uid}/tasks`), where("labelId", "==", labelToDelete.id));
      const tasksSnapshot = await getDocs(tasksQuery);
      tasksSnapshot.forEach((taskDoc) => {
        batch.update(taskDoc.ref, { labelId: null });
      });

      await batch.commit();
      toast({ title: "Label Deleted", description: `Label "${labelToDelete.name}" deleted and removed from tasks.` });
      
      if (selectedLabelId === labelToDelete.id) {
        onLabelSelect(null); 
      }
      setIsDeleteLabelDialogOpen(false);
      setLabelToDelete(null);
    } catch (error: any) {
      console.error("Error deleting label:", error);
      toast({ title: "Error Deleting Label", description: error.message, variant: "destructive" });
    } finally {
      setIsDeletingLabel(false);
    }
  };


  const isIconOnly = clientMounted ? (!isMobile && sidebarState === 'collapsed' && collapsible === 'icon') : (!defaultOpen && collapsible === 'icon');


  const mainNavItems: NavItemConfig[] = [
  ];

  const filterNavItems: NavItemConfig[] = [
    { action: () => onFilterChange('general'), label: 'General', icon: Inbox, tooltip: 'General Tasks', isFilter: true, filterName: 'general' },
    { action: () => onFilterChange('today'), label: 'Today', icon: CalendarClock, tooltip: 'Tasks Due Today', isFilter: true, filterName: 'today' },
    { action: () => onFilterChange('pending'), label: 'Pending Tasks', icon: ListTodo, tooltip: 'Pending Tasks', isFilter: true, filterName: 'pending' },
    { action: () => onFilterChange('completed'), label: 'Completed Tasks', icon: ListChecks, tooltip: 'Completed Tasks', isFilter: true, filterName: 'completed' },
  ];
  
  const labelNavItems: NavItemConfig[] = userLabels.map(label => ({
    action: () => onLabelSelect(label.id),
    label: label.name,
    icon: Tag, // Fallback icon for icon-only mode
    tooltip: `View tasks in "${label.name}"`,
    isLabel: true,
    labelId: label.id,
  }));


  const categoryNavItems: NavItemConfig[] = [
    { href: '/classes', label: 'Class Section', icon: Users, tooltip: 'Class Section (Coming Soon)', disabled: true, isPageLink: true },
    { href: '/reminders', label: 'Reminders', icon: AlarmClock, tooltip: 'View Reminders', disabled: false, isPageLink: true },
    { href: '/performance', label: 'Performance', icon: BarChart3, tooltip: 'Performance Overview', disabled: false, isPageLink: true },
    // "Labels" as a page link removed, labels are now listed directly
  ];

  const managementNavItems: NavItemConfig[] = [
    { href: '/trash', label: 'Trash', icon: Trash2, tooltip: 'Trash', isPageLink: true },
    { href: '/settings', label: 'Settings', icon: SettingsIcon, tooltip: 'Settings', isPageLink: true },
  ];

  const renderNavItems = (items: NavItemConfig[], sectionTitle?: string) => {
    if (items.length === 0 && ! (sectionTitle === "Labels" && !isLoadingLabels) ) return null; // Keep Labels section if not loading, even if empty for "Create" button

    const sectionContent = (
      <>
        <SidebarMenu className={cn(isIconOnly && "w-auto")}>
          {items.map((item, index) => {
            let isActive = false;
            if (item.isPageLink) {
              isActive = pathname === item.href;
            } else if (item.isFilter) {
              isActive = currentFilter === item.filterName;
            }

            const commonButtonProps = {
              variant: "ghost" as const,
              onClick: item.action,
              disabled: item.disabled,
              isActive: isActive,
              "aria-label": item.tooltip,
              tooltip: item.tooltip,
              className: isActive ? ( (item.isFilter || item.isLabel) ? "bg-muted text-primary font-semibold border-l-2 border-primary -ml-[1px] pl-[calc(0.625rem-1px)]" : "bg-muted text-primary font-semibold" ) : "",
            };
            
            const buttonContent = (
              <>
                <span className="flex items-center flex-grow overflow-hidden mr-1">
                  {item.isLabel && !isIconOnly && item.color ? (
                    <span
                      className="mr-2 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                  ) : (
                    <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover/menu-button:text-foreground")} />
                  )}
                  {!isIconOnly && <span className="truncate">{item.label}</span>}
                </span>
                
                {item.isLabel && !isIconOnly && userLabels.find(l => l.id === item.labelId) && (
                  <div className="pl-1 flex-shrink-0" onClick={(e) => {e.preventDefault(); e.stopPropagation();}} data-nocardclick="true">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover/menu-item:opacity-100 focus-visible:opacity-100 transition-opacity"
                          aria-label={`Options for label ${item.label}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent sideOffset={5} align="start">
                        <DropdownMenuItem 
                          onClick={(e) => {
                              e.stopPropagation();
                              const labelToActOn = userLabels.find(l => l.id === item.labelId);
                              if (labelToActOn) handleOpenEditLabelDialog(labelToActOn);
                          }} 
                          className="cursor-pointer"
                        >
                          <Edit2 className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                              e.stopPropagation();
                              const labelToActOn = userLabels.find(l => l.id === item.labelId);
                              if (labelToActOn) handleOpenDeleteLabelDialog(labelToActOn);
                          }} 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </>
            );

            const commonButtonProps = {
              variant: "ghost" as const,
              onClick: item.action,
              disabled: item.disabled,
              isActive: isActive,
              "aria-label": item.tooltip,
              tooltip: item.tooltip,
            };

            const menuButton = (
              <SidebarMenuButton {...commonButtonProps} className={cn(item.isLabel && !isIconOnly && "flex items-center w-full")}>
                {buttonContent}
              </SidebarMenuButton>
            );
          }


            return (
              <SidebarMenuItem key={`${item.label}-${index}`} className={cn(isIconOnly ? 'flex justify-center' : 'group/menu-item', item.isLabel && !isIconOnly && "flex items-center justify-between")}>
                {item.href || item.action ? (
                  item.href ? (
                    <Link href={linkPath} className="block w-full h-full" target={item.isExternal ? "_blank" : "_self"} passHref>
                      {menuButtonElement}
                    </Link>
                  ) : (
                    menuButtonElement
                  )
                ) : (
                   <div className={cn("flex w-full items-center gap-2 overflow-hidden rounded-md px-2.5 py-1.5 text-left text-sm outline-none ring-ring transition-colors focus-visible:ring-2 active:bg-accent active:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50", sidebarMenuButtonVariants({variant: commonButtonProps.variant}), commonButtonProps.className)} aria-disabled={item.disabled} role="button" tabIndex={item.disabled ? -1 : 0}>
                    {buttonContent}
                   </div>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </>
    );
  };


  if (authLoading) {
    return (
      <Sidebar side="left" className="shadow-sm animate-pulse">
        <SidebarHeader>
           <div className={cn("h-7 w-7 bg-muted rounded-md shrink-0", isIconOnly && "mx-auto")}></div>
           {!isIconOnly && (<div className="h-6 w-24 bg-muted rounded animate-pulse ml-1"></div>)}
        </SidebarHeader>
        <SidebarContent className="p-0">
          <ScrollArea className="h-full w-full p-2">
            <div className={cn("flex-1", isIconOnly ? "space-y-2 flex flex-col items-center" : "space-y-1")}>
              {[...Array(5)].map((_, i) => <div key={i} className={cn("h-9 bg-muted rounded mt-1", isIconOnly ? "w-9" : "w-full")}></div>)}
              <SidebarSeparator />
              {[...Array(4)].map((_, i) => <div key={i} className={cn("h-9 bg-muted rounded mt-1", isIconOnly ? "w-9" : "w-full")}></div>)}
              <SidebarSeparator />
              {[...Array(2)].map((_, i) => <div key={i} className={cn("h-9 bg-muted rounded mt-1", isIconOnly ? "w-9" : "w-full")}></div>)}
            </div>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className={cn(isIconOnly && "items-center")}>
           <div className={cn("h-10 bg-muted rounded", isIconOnly ? "w-9" : "w-full")}></div>
        </SidebarFooter>
      </Sidebar>
    );
  }

  if (!user) {
    return null;
  }

  const userInitial = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()
    : user.email ? user.email[0].toUpperCase() : '?';

  const userMenuButton = (
    <Button
      variant="ghost"
      className={cn(
        "focus-visible:ring-ring focus-visible:ring-offset-background text-foreground hover:bg-muted",
        isIconOnly
          ? 'p-0 flex items-center justify-center h-9 w-9 rounded-full'
          : 'px-2 py-1.5 h-auto w-full justify-start'
      )}
      aria-label="User Menu"
    >
      <Avatar className={cn("h-8 w-8 shrink-0", isIconOnly ? '' : 'mr-2')}>
        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
        <AvatarFallback className="bg-muted text-muted-foreground">{userInitial}</AvatarFallback>
      </Avatar>
      {!isIconOnly && (
        <div className="flex flex-col items-start truncate min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {user.displayName || user.email?.split('@')[0]}
          </span>
          <span className="text-xs text-muted-foreground truncate -mt-0.5">
            View Profile
          </span>
        </div>
      )}
    </Button>
  );

  return (
    <Sidebar
      side="left"
      className="shadow-sm"
    >
      <SidebarHeader className="flex items-center">
        <SidebarTrigger className="shrink-0" tooltip="Toggle Sidebar" />
      </SidebarHeader>

      <SidebarContent className="p-0">
        <ScrollArea className="h-full w-full p-2">
          <div className={cn("flex-1", isIconOnly ? "space-y-2 flex flex-col items-center" : "space-y-1")}>
            
            {mainNavItems.length > 0 && <SidebarSeparator/>}
            {renderNavItems(mainNavItems)}
            
            {(mainNavItems.length > 0 && filterNavItems.length > 0) || (mainNavItems.length === 0 && filterNavItems.length > 0 && (categoryNavItems.length > 0 || managementNavItems.length > 0)) ? <SidebarSeparator /> : null}
            {renderNavItems(filterNavItems)}
            
            <SidebarSeparator />
            {/* Labels Section */}
            {!isIconOnly && (
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                 <div className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Labels</div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => setIsLabelDialogOpen(true)}>
                            <PlusCircle className="h-4 w-4"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Create new label</p></TooltipContent>
                </Tooltip>
              </div>
            )}
            {isIconOnly && (
                 <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary mt-1" onClick={() => setIsLabelDialogOpen(true)}>
                            <PlusCircle className="h-5 w-5"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right"><p>Create new label</p></TooltipContent>
                </Tooltip>
            )}
            {isLoadingLabels ? (
              <div className={cn("px-2.5 py-1.5", isIconOnly && "flex justify-center")}>
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              renderNavItems(labelNavItems)
            )}
            {/* End Labels Section */}


            <SidebarSeparator />
            {renderNavItems(categoryNavItems)}

            <SidebarSeparator />
            {renderNavItems(managementNavItems)}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className={cn(isIconOnly && "flex-col items-center")}>
        <div className={cn(
          "flex items-center",
          isIconOnly ? 'w-full flex-col space-y-2' : 'justify-between w-full'
        )}>
          <DropdownMenu>
            {isIconOnly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>{userMenuButton}</DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <p>{user.displayName || user.email?.split('@')[0] || "Account options"}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <DropdownMenuTrigger asChild>{userMenuButton}</DropdownMenuTrigger>
            )}
            <DropdownMenuContent sideOffset={isIconOnly ? 10 : 5} side={isIconOnly ? "right" : "top"} align="start" className="w-60 mb-1 bg-popover text-popover-foreground">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" /> <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="w-full cursor-pointer flex items-center">
                  <SettingsIcon className="mr-2 h-4 w-4" /> <span>Settings</span>
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/trash" className="w-full cursor-pointer flex items-center">
                  <Trash2 className="mr-2 h-4 w-4" /> <span>Trash</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center">
                <LogOut className="mr-2 h-4 w-4" /> <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className={isIconOnly ? 'mt-0' : ''}>
             {isIconOnly ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <ThemeToggle />
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <p>Toggle Theme</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <ThemeToggle />
            )}
          </div>
        </div>
      </SidebarFooter>

      {/* Create Label Dialog */}
      <Dialog open={isCreateLabelDialogOpen} onOpenChange={setIsCreateLabelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Label</DialogTitle>
            <DialogDescription>
              Enter a name for your new label.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              id="labelName"
              placeholder="Label name (e.g., Work, Study)"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => setNewLabelName('')}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" onClick={handleCreateLabel} disabled={isSavingLabel || !newLabelName.trim()}>
              {isSavingLabel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Label
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Label Dialog */}
      <Dialog open={isEditLabelDialogOpen} onOpenChange={setIsEditLabelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Label</DialogTitle>
            <DialogDescription>
              Update the name for your label "{labelToEdit?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <UiLabel htmlFor="editedLabelName" className="sr-only">New Label Name</UiLabel>
            <Input
              id="editedLabelName"
              placeholder="New label name"
              value={editedLabelName}
              onChange={(e) => setEditedLabelName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleUpdateLabel} disabled={isUpdatingLabel || !editedLabelName.trim()}>
              {isUpdatingLabel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Label Confirmation Dialog */}
      {labelToDelete && (
        <AlertDialog open={isDeleteLabelDialogOpen} onOpenChange={setIsDeleteLabelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Label "{labelToDelete.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the label "{labelToDelete.name}". 
                Tasks currently using this label will have it removed (they won't be deleted). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteLabel} disabled={isDeletingLabel} className="bg-destructive hover:bg-destructive/90">
                {isDeletingLabel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Label
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Sidebar>
  );
}

    