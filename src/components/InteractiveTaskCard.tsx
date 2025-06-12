
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import * as z from "zod";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Save, PlusCircle, Loader2, Trash2, ListChecks, Flag, BellRing, MoreHorizontal, X, AlarmClock, FolderOpen, Tag as LabelIcon, Palette, BellOff } from "lucide-react";
import { format, parseISO, setHours, setMinutes, setSeconds, setMilliseconds, isValid, startOfDay, formatISO } from "date-fns";
import type { Task, TaskCategory, Subtask, TaskPriority, Label } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/config";
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const taskCategories: [TaskCategory, ...TaskCategory[]] = ["General", "Assignment", "Class", "Personal"];
const taskPriorities: [TaskPriority, ...TaskPriority[]] = ["None", "Low", "Medium", "High", "Urgent"];

const subtaskSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Subtask description cannot be empty.").max(200, "Subtask too long"),
  isCompleted: z.boolean().default(false),
});

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required if description is empty or for saving an edit.").max(150, "Title must be at most 150 characters").optional().default(""),
  description: z.string().max(5000, "Description is too long").optional().default(""),
  dueDate: z.date().nullable().optional(),
  category: z.enum(taskCategories, { required_error: "Category is required." }).default("General"),
  priority: z.enum(taskPriorities).optional().default("None"),
  subtasks: z.array(subtaskSchema).optional().default([]),
  reminderDate: z.date().nullable().optional(),
  reminderTime: z.string().optional().nullable(), // HH:mm format
  labelId: z.string().nullable().optional(),
}).refine(data => !!data.title || !!data.description, {
  message: "Either title or description must be filled.",
  path: ["title"], // Show error on title, or a general form error
});


export type InteractiveTaskCardValues = z.infer<typeof taskFormSchema>;

interface InteractiveTaskCardProps {
  mode: 'add' | 'edit';
  task?: Task | null; // For 'edit' mode
  onSubmit: (data: InteractiveTaskCardValues, existingTaskId?: string) => void;
  onClose?: () => void; // For 'edit' mode (closing the centered view) or 'add' mode (collapsing)
  className?: string;
  initialContent?: string; // For add mode, if "Take a note..." had pre-filled text
}

export function InteractiveTaskCard({
  mode,
  task,
  onSubmit,
  onClose,
  className,
  initialContent = ""
}: InteractiveTaskCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // State for 'add' mode expansion
  const [isLocallyExpanded, setIsLocallyExpanded] = useState(mode === 'edit'); // Edit mode is always "expanded"

  const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);
  const [isReminderPopoverOpen, setIsReminderPopoverOpen] = useState(false);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false);

  const [userLabels, setUserLabels] = useState<Label[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoadingLabels(true);
      const labelsCollectionRef = collection(db, `users/${user.uid}/labels`);
      const q = query(labelsCollectionRef, orderBy("name", "asc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const labelsData = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Label));
        setUserLabels(labelsData);
        setIsLoadingLabels(false);
      }, (error) => {
        console.error("Error fetching labels for TaskForm:", error);
        toast({ title: "Error fetching labels", description: error.message, variant: "destructive" });
        setIsLoadingLabels(false);
      });
      return () => unsubscribe();
    }
  }, [user, toast]);

  const getInitialFormValues = useCallback(() => {
    if (mode === 'edit' && task) {
      let initialDueDate: Date | null = null;
      if (task.dueDate && isValid(parseISO(task.dueDate))) {
        initialDueDate = parseISO(task.dueDate);
      }
      let initialReminderDate: Date | null = null;
      let initialReminderTime: string = "09:00";
      if (task.reminderAt && isValid(parseISO(task.reminderAt))) {
        const reminderDateTime = parseISO(task.reminderAt);
        initialReminderDate = reminderDateTime;
        initialReminderTime = format(reminderDateTime, "HH:mm");
      }
      return {
        title: task.title || "",
        description: task.description || "",
        dueDate: initialDueDate,
        category: task.category || "General",
        priority: task.priority || "None",
        subtasks: task.subtasks?.map(st => ({ ...st })) || [],
        reminderDate: initialReminderDate,
        reminderTime: initialReminderTime,
        labelId: task.labelId || null,
      };
    }
    // For 'add' mode
    return {
      title: "",
      description: initialContent, // Use initialContent for add mode
      dueDate: null,
      category: "General" as TaskCategory,
      priority: "None" as TaskPriority,
      subtasks: [],
      reminderDate: null,
      reminderTime: "09:00",
      labelId: null,
    };
  }, [mode, task, initialContent]);

  const form = useForm<InteractiveTaskCardValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: getInitialFormValues(),
  });

  useEffect(() => {
    form.reset(getInitialFormValues());
    if (mode === 'add' && initialContent) {
      setIsLocallyExpanded(true); // Expand if initial content is passed
    }
     if (mode === 'edit') {
      setIsLocallyExpanded(true); // Ensure edit mode starts expanded visually
    }
  }, [mode, task, initialContent, form, getInitialFormValues]);


  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const [newSubtaskText, setNewSubtaskText] = useState("");
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);
  const [showSubtasks, setShowSubtasks] = useState(mode === 'edit' ? !!task?.subtasks?.length : false);

  const handleExpand = useCallback(() => {
    if (!isLocallyExpanded && mode === 'add') {
      setIsLocallyExpanded(true);
    }
  }, [isLocallyExpanded, mode]);

  useEffect(() => {
    if (isLocallyExpanded && mode === 'add') {
      // If description has content (from initial "Take a note..." input),
      // and title is empty, focus description. Otherwise, focus title.
      if (form.getValues("description") && !form.getValues("title")) {
        descriptionTextareaRef.current?.focus();
      } else {
        titleInputRef.current?.focus();
      }
    } else if (mode === 'edit') {
        titleInputRef.current?.focus();
    }
  }, [isLocallyExpanded, mode, form]);

  const resetAndCollapse = useCallback(() => {
    form.reset(getInitialFormValues()); // Reset with potentially new initial values
    setNewSubtaskText("");
    setShowSubtasks(mode === 'edit' ? !!task?.subtasks?.length : false);
    if (mode === 'add') {
      setIsLocallyExpanded(false);
    }
    if (onClose) onClose();
  }, [form, mode, task, onClose, getInitialFormValues]);

  const handleFormSubmit = (data: InteractiveTaskCardValues) => {
    if (!data.title && !data.description) {
      // For add mode, if both are empty on explicit save attempt, just close
      if (mode === 'add') {
        resetAndCollapse();
        return;
      }
      // For edit mode, an explicit save attempt probably means they want to clear it,
      // but our schema should prevent totally empty saves if it's an existing task.
      // However, if schema allows (e.g. title optional if desc present), proceed.
    }

    let reminderAtISO: string | null = null;
    if (data.reminderDate && data.reminderTime) {
      try {
        const [hours, minutes] = data.reminderTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          let reminderDateTime = setSeconds(data.reminderDate, 0);
          reminderDateTime = setMilliseconds(reminderDateTime, 0);
          reminderDateTime = setHours(reminderDateTime, hours);
          reminderDateTime = setMinutes(reminderDateTime, minutes);
          reminderAtISO = reminderDateTime.toISOString();
        }
      } catch (e) {
        console.error("Error parsing reminder time:", e);
        toast({ title: "Invalid Reminder Time", description: "Please ensure reminder time is set correctly.", variant: "destructive"});
        return;
      }
    }
    
    const submissionData = { ...data, reminderAt: reminderAtISO };
    onSubmit(submissionData, mode === 'edit' ? task?.id : undefined);
    
    const taskTitle = data.title || data.description || "Task";
    toast({
      title: mode === 'edit' ? "Task Updated" : "Task Added",
      description: `"${taskTitle.substring(0, 30)}${taskTitle.length > 30 ? "..." : ""}" ${mode === 'edit' ? 'updated' : 'added'}.`,
    });
    
    if (mode === 'add') {
        resetAndCollapse(); // Collapse and clear add form
    } else if (onClose) {
        onClose(); // Close edit view
    }
  };

  const handleSaveAndCollapse = useCallback(() => {
    const currentData = form.getValues();
    if (currentData.title?.trim() || currentData.description?.trim()) {
      form.handleSubmit(handleFormSubmit)(); // Trigger validation and submit
    } else {
      resetAndCollapse(); // If empty, just collapse/close
    }
  }, [form, resetAndCollapse, handleFormSubmit]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        if (mode === 'add' && isLocallyExpanded) {
          handleSaveAndCollapse();
        }
        // For 'edit' mode, click outside is handled by the backdrop in HomePage
      }
    };

    if (mode === 'add' && isLocallyExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mode, isLocallyExpanded, handleSaveAndCollapse]);


  const watchDescription = form.watch("description");
  useEffect(() => {
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto';
      const scrollHeight = descriptionTextareaRef.current.scrollHeight;
      const minHeight = (mode === 'add' && !form.getValues("title") && isLocallyExpanded) ? 24 : 40; 
      descriptionTextareaRef.current.style.height = `${Math.max(scrollHeight, minHeight)}px`;
    }
  }, [watchDescription, isLocallyExpanded, mode, form]);


  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      append({ id: crypto.randomUUID(), text: newSubtaskText.trim(), isCompleted: false });
      setNewSubtaskText("");
      newSubtaskInputRef.current?.focus();
    }
  };

  const clearReminder = () => {
    form.setValue("reminderDate", null);
    form.setValue("reminderTime", "09:00"); // Reset to default or null
    setIsReminderPopoverOpen(false);
  };

  const clearDueDate = () => {
    form.setValue("dueDate", null);
    setIsDueDatePopoverOpen(false);
  };

  const isSubmitting = form.formState.isSubmitting;

  // Collapsed view for 'add' mode
  if (mode === 'add' && !isLocallyExpanded) {
    return (
      <div
        className={cn("max-w-2xl mx-auto mb-6", className)}
        ref={cardRef} // Ref for click outside detection if needed even for collapsed
      >
        <Input
          type="text"
          placeholder="Take a note..."
          onClick={handleExpand}
          onFocus={handleExpand}
          value={form.getValues("description")} // Bind to description for initial typing
          onChange={(e) => {
            form.setValue("description", e.target.value);
            if (!isLocallyExpanded && e.target.value.trim() !== "") {
                handleExpand();
            }
          }}
          className="w-full h-12 px-4 py-3 text-base bg-card text-foreground/80 border border-border rounded-lg shadow hover:shadow-lg transition-shadow duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-background cursor-text"
        />
      </div>
    );
  }

  // Expanded view for 'add' mode or 'edit' mode
  return (
    <div
      ref={cardRef}
      className={cn(
        "bg-card rounded-xl shadow-xl border border-border/70 focus-within:border-primary/70 focus-within:shadow-2xl transition-all duration-200 ease-out",
        mode === 'add' ? "max-w-2xl mx-auto mb-6 p-4" : "w-full max-w-xl p-6", // Different max-width and padding for centered edit mode
        className
      )}
      onClick={(e) => e.stopPropagation()} // Prevent clicks inside from bubbling to a backdrop
    >
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-1">
        { (mode === 'edit' || (mode === 'add' && isLocallyExpanded) ) && (
            <Controller
                name="title"
                control={form.control}
                render={({ field }) => (
                    <Input
                    ref={titleInputRef}
                    placeholder="Title"
                    {...field}
                    className="text-lg font-semibold border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 h-auto placeholder:text-muted-foreground/80 mb-1"
                    disabled={isSubmitting}
                    />
                )}
            />
        )}
        {form.formState.errors.title && <p className="text-xs text-destructive px-1">{form.formState.errors.title.message}</p>}


        <Controller
            name="description"
            control={form.control}
            render={({ field }) => (
                <Textarea
                ref={descriptionTextareaRef}
                placeholder="Take a note..."
                {...field}
                className="text-sm border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 min-h-[40px] resize-none placeholder:text-muted-foreground/70"
                rows={1}
                disabled={isSubmitting}
                />
            )}
        />
        {form.formState.errors.description && <p className="text-xs text-destructive px-1">{form.formState.errors.description.message}</p>}
        {form.formState.errors.root && <p className="text-xs text-destructive px-1">{form.formState.errors.root.message}</p>}


        {/* Toolbar for date, priority, etc. */}
        <div className="flex flex-wrap gap-x-2 gap-y-2 pt-2 items-center">
          <Popover open={isDueDatePopoverOpen} onOpenChange={setIsDueDatePopoverOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full hover:bg-muted", form.watch("dueDate") ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground")} disabled={isSubmitting}>
                      <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                      {form.watch("dueDate") ? format(form.watch("dueDate") as Date, "MMM d") : "Set date"}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Set due date</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {form.watch("dueDate") && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button type="button" variant="ghost" size="icon" onClick={clearDueDate} className="h-7 w-7 rounded-full -ml-2 mr-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Clear due date" disabled={isSubmitting}>
                            <X className="h-3.5 w-3.5"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Clear due date</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            )}
            <PopoverContent className="w-auto p-0">
              <Controller
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => { field.onChange(date); setIsDueDatePopoverOpen(false); }}
                    initialFocus
                    disabled={(date) => date < startOfDay(new Date()) || isSubmitting}
                  />
                )}
              />
            </PopoverContent>
          </Popover>

          <Popover open={isPriorityPopoverOpen} onOpenChange={setIsPriorityPopoverOpen}>
             <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full hover:bg-muted", form.watch("priority") && form.watch("priority") !== "None" ? "bg-accent/10 text-accent-foreground border-accent/30 hover:bg-accent/20" : "text-muted-foreground hover:text-foreground")} disabled={isSubmitting}>
                        <Flag className="mr-1.5 h-3.5 w-3.5" />
                        {form.watch("priority") && form.watch("priority") !== "None" ? form.watch("priority") : "Priority"}
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Set priority</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            <PopoverContent className="w-[180px] p-1">
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                      <select
                        value={field.value || "None"}
                        onChange={(e) => { field.onChange(e.target.value as TaskPriority); setIsPriorityPopoverOpen(false); }}
                        className="w-full p-2 text-sm border-0 focus:ring-0 bg-popover text-popover-foreground rounded-md"
                        disabled={isSubmitting}
                      >
                        {taskPriorities.map((p) => (
                          <option key={p} value={p}>{p === "None" ? "No Priority" : p}</option>
                        ))}
                      </select>
                  )}
                />
            </PopoverContent>
          </Popover>

          <Popover open={isReminderPopoverOpen} onOpenChange={setIsReminderPopoverOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                     <Button type="button" variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full hover:bg-muted", form.watch("reminderDate") ? "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20" : "text-muted-foreground hover:text-foreground")} disabled={isSubmitting}>
                      <AlarmClock className="mr-1.5 h-3.5 w-3.5" />
                      {form.watch("reminderDate") ? `${format(form.watch("reminderDate") as Date, "MMM d")}${form.watch("reminderTime") ? `, ${form.watch("reminderTime")}` : ""}` : "Add reminder"}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Set reminder</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
             {form.watch("reminderDate") && (
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" onClick={clearReminder} className="h-7 w-7 rounded-full -ml-2 mr-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Clear reminder" disabled={isSubmitting}>
                            <BellOff className="h-3.5 w-3.5"/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Clear reminder</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
            )}
            <PopoverContent className="w-auto p-2 space-y-2">
              <Controller
                control={form.control}
                name="reminderDate"
                render={({ field }) => (
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => { field.onChange(date); if (!form.watch("reminderTime")) form.setValue("reminderTime", "09:00"); }}
                    initialFocus
                    disabled={isSubmitting}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="reminderTime"
                render={({ field }) => (
                  <Input
                    type="time"
                    {...field}
                    value={field.value || ""}
                    className="h-8 text-sm"
                    disabled={!form.watch("reminderDate") || isSubmitting}
                  />
                )}
              />
               <Button type="button" size="sm" onClick={() => setIsReminderPopoverOpen(false)} className="w-full h-8 text-sm" disabled={isSubmitting}>Done</Button>
            </PopoverContent>
          </Popover>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setShowSubtasks(!showSubtasks)} aria-label="Toggle Subtasks" disabled={isSubmitting}>
                  <ListChecks className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{showSubtasks ? "Hide" : "Show"} subtasks</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>

        {showSubtasks && (
          <div className="space-y-3 pt-3 pb-2">
            <Separator />
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
               <ListChecks className="h-5 w-5 text-muted-foreground" />
               Subtasks / Checklist
            </div>
            <div className="flex gap-2">
              <Input
                ref={newSubtaskInputRef}
                type="text"
                placeholder="Add a subtask..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-grow h-9 text-sm"
                disabled={isSubmitting}
              />
              <Button type="button" onClick={handleAddSubtask} variant="outline" size="icon" aria-label="Add subtask" className="h-9 w-9" disabled={isSubmitting}>
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            {fields.length > 0 && (
              <ScrollArea className="h-32 w-full rounded-md border p-2 bg-muted/30">
                <div className="space-y-1.5">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-1.5 bg-background rounded-md shadow-sm hover:bg-muted/75 transition-colors">
                       <Controller
                            name={`subtasks.${index}.isCompleted`}
                            control={form.control}
                            render={({ field: checkboxField }) => (
                                <Checkbox
                                    checked={checkboxField.value}
                                    onCheckedChange={checkboxField.onChange}
                                    id={`subtask-form-${field.id || index}`}
                                    aria-label={`Mark subtask ${form.getValues(`subtasks.${index}.text`)} as completed`}
                                    className="h-4 w-4"
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        <Controller
                            name={`subtasks.${index}.text`}
                            control={form.control}
                            render={({ field: inputField }) => (
                                <Input
                                    {...inputField}
                                    className={cn(
                                    "flex-grow h-7 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm",
                                    form.getValues(`subtasks.${index}.isCompleted`) ? "line-through text-muted-foreground" : ""
                                    )}
                                    aria-label={`Edit subtask ${inputField.value}`}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive/80 h-6 w-6 hover:bg-destructive/10"
                        aria-label={`Remove subtask ${form.getValues(`subtasks.${index}.text`)}`}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Bottom bar with category, label, save, cancel */}
        <div className={cn("flex items-center justify-between pt-5 border-t mt-3")}>
          <div className="flex items-center gap-2">
            <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
              <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="text-xs h-9 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" disabled={isSubmitting}>
                              <FolderOpen className="mr-1.5 h-4 w-4" />
                              {form.watch("category") || "Category"}
                          </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Set category</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              <PopoverContent className="w-[180px] p-1">
                  <Controller
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                          <select
                              value={field.value}
                              onChange={(e) => { field.onChange(e.target.value as TaskCategory); setIsCategoryPopoverOpen(false); }}
                              className="w-full p-2 text-sm border-0 focus:ring-0 bg-popover text-popover-foreground rounded-md"
                              disabled={isSubmitting}
                          >
                              {taskCategories.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                              ))}
                          </select>
                      )}
                  />
              </PopoverContent>
            </Popover>
            
            <Popover open={isLabelPopoverOpen} onOpenChange={setIsLabelPopoverOpen}>
               <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="text-xs h-9 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" disabled={isSubmitting || isLoadingLabels}>
                          {isLoadingLabels ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : <LabelIcon className="mr-1.5 h-4 w-4" />}
                          {form.watch("labelId") && userLabels.find(l => l.id === form.watch("labelId")) ? userLabels.find(l => l.id === form.watch("labelId"))!.name.substring(0,15) + (userLabels.find(l => l.id === form.watch("labelId"))!.name.length > 15 ? '...' : '') : "Label"}
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Assign label</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              <PopoverContent className="w-[200px] p-0">
                <Controller
                  control={form.control}
                  name="labelId"
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => { field.onChange(value === "none" ? null : value); setIsLabelPopoverOpen(false); }}
                      value={field.value || "none"}
                      disabled={isSubmitting || isLoadingLabels}
                    >
                      <SelectTrigger className="w-full h-auto border-0 focus:ring-0 rounded-t-md rounded-b-none">
                        <SelectValue placeholder="Select a label" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Label</SelectItem>
                        {userLabels.map((label) => (
                          <SelectItem key={label.id} value={label.id}>
                            {label.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </PopoverContent>
            </Popover>

          </div>
          <div className="flex space-x-2">
            <Button type="button" variant="ghost" onClick={resetAndCollapse} className="text-sm h-9" disabled={isSubmitting}>
              {mode === 'edit' ? "Cancel" : "Close"}
            </Button>
            <Button type="submit" className="min-w-[100px] text-sm h-9" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

    

