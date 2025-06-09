
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { format, parseISO, setHours, setMinutes, setSeconds, setMilliseconds, isValid, startOfDay, formatISO } from "date-fns";
import type { Task, TaskCategory, Subtask, TaskPriority, Label } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase/config";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';


const taskCategories: [TaskCategory, ...TaskCategory[]] = ["General", "Assignment", "Class", "Personal"];
const taskPriorities: [TaskPriority, ...TaskPriority[]] = ["None", "Low", "Medium", "High", "Urgent"];


const subtaskSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Subtask description cannot be empty.").max(200, "Subtask too long"),
  isCompleted: z.boolean().default(false),
});

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(150, "Title must be at most 150 characters"),
  description: z.string().max(5000, "Description is too long").optional(),
  dueDate: z.date().nullable().optional(),
  category: z.enum(taskCategories, { required_error: "Category is required." }),
  priority: z.enum(taskPriorities).optional().default("None"),
  subtasks: z.array(subtaskSchema).optional(),
  reminderDate: z.date().nullable().optional(),
  reminderTime: z.string().optional().nullable(), // HH:mm format
  labelId: z.string().nullable().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmit: (data: TaskFormValues & { reminderAt?: string | null }, existingTaskId?: string) => void;
  editingTask?: Task | null;
  onClose: () => void;
}

export function TaskForm({ onSubmit, editingTask, onClose }: TaskFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [isDueDatePopoverOpen, setIsDueDatePopoverOpen] = useState(false);
  const [isPriorityPopoverOpen, setIsPriorityPopoverOpen] = useState(false);
  const [isReminderPopoverOpen, setIsReminderPopoverOpen] = useState(false);
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isLabelPopoverOpen, setIsLabelPopoverOpen] = useState(false); // For label selection

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

  let initialDueDate: Date | null = null;
  if (editingTask?.dueDate && isValid(parseISO(editingTask.dueDate))) {
    initialDueDate = parseISO(editingTask.dueDate);
  }

  let initialReminderDate: Date | null = null;
  let initialReminderTime: string = "09:00";

  if (editingTask?.reminderAt && isValid(parseISO(editingTask.reminderAt))) {
    const reminderDateTime = parseISO(editingTask.reminderAt);
    initialReminderDate = reminderDateTime;
    initialReminderTime = format(reminderDateTime, "HH:mm");
  }


  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: editingTask
      ? {
          title: editingTask.title || "",
          description: editingTask.description || "",
          dueDate: initialDueDate,
          category: editingTask.category,
          priority: editingTask.priority || "None",
          subtasks: editingTask.subtasks?.map(st => ({...st})) || [],
          reminderDate: initialReminderDate,
          reminderTime: initialReminderTime,
          labelId: editingTask.labelId || null,
        }
      : {
          title: "",
          description: "",
          dueDate: null,
          category: "General",
          priority: "None",
          subtasks: [],
          reminderDate: null,
          reminderTime: "09:00",
          labelId: null,
        },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const [newSubtaskText, setNewSubtaskText] = useState("");
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);
  const [showSubtasks, setShowSubtasks] = useState(!!editingTask?.subtasks?.length);


  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      append({ id: crypto.randomUUID(), text: newSubtaskText.trim(), isCompleted: false });
      setNewSubtaskText("");
      newSubtaskInputRef.current?.focus();
    }
  };

  const handleFormSubmit = (data: TaskFormValues) => {
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

    const submissionData = { ...data, dueDate: data.dueDate, reminderAt: reminderAtISO, labelId: data.labelId };
    onSubmit(submissionData, editingTask?.id);

    toast({
      title: editingTask ? "Task Updated" : "Task Added",
      description: `"${data.title.substring(0, 30)}${data.title.length > 30 ? "..." : ""}" ${editingTask ? 'updated' : 'added'}.`,
    });
    onClose();
  };

  const clearReminder = () => {
    form.setValue("reminderDate", null);
    form.setValue("reminderTime", "09:00");
    setIsReminderPopoverOpen(false);
  };

  const clearDueDate = () => {
    form.setValue("dueDate", null);
    setIsDueDatePopoverOpen(false);
  };

  const watchTitle = form.watch("title");
  const watchDescription = form.watch("description");
  const watchDueDate = form.watch("dueDate");
  const watchPriority = form.watch("priority");
  const watchReminderDate = form.watch("reminderDate");
  const watchReminderTime = form.watch("reminderTime");
  const watchCategory = form.watch("category");
  const watchLabelId = form.watch("labelId");

  useEffect(() => {
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto';
      const scrollHeight = descriptionTextareaRef.current.scrollHeight;
      const minHeight = 60;
      descriptionTextareaRef.current.style.height = `${Math.max(scrollHeight, minHeight)}px`;
    }
  }, [watchDescription]);

  useEffect(() => {
    if (!editingTask && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingTask]);

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-1 p-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="mb-5">
              <FormControl>
                <Input
                  ref={titleInputRef}
                  placeholder="Title"
                  {...field}
                  className="text-lg font-semibold border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 h-auto placeholder:text-muted-foreground/80"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="mb-5">
              <FormControl>
                <Textarea
                  ref={descriptionTextareaRef}
                  placeholder="Add a description..."
                  {...field}
                  className="text-sm border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 min-h-[60px] resize-none placeholder:text-muted-foreground/70 max-h-[200px] overflow-y-auto"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-x-2.5 gap-y-2 my-5 items-center">
          <Popover open={isDueDatePopoverOpen} onOpenChange={setIsDueDatePopoverOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full hover:bg-muted", watchDueDate ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground")} disabled={isSubmitting}>
                      <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                      {watchDueDate ? format(watchDueDate, "MMM d") : "Set date"}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Set due date</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {watchDueDate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="ghost" size="icon" onClick={clearDueDate} className="h-7 w-7 rounded-full -ml-2 mr-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Clear due date" disabled={isSubmitting}>
                            <X className="h-3.5 w-3.5"/>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Clear due date</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            )}
            <PopoverContent className="w-auto p-0">
              <FormField
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
                      <Button variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full hover:bg-muted", watchPriority && watchPriority !== "None" ? "bg-accent/10 text-accent-foreground border-accent/30 hover:bg-accent/20" : "text-muted-foreground hover:text-foreground")} disabled={isSubmitting}>
                        <Flag className="mr-1.5 h-3.5 w-3.5" />
                        {watchPriority && watchPriority !== "None" ? watchPriority : "Priority"}
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>Set priority</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            <PopoverContent className="w-[180px] p-1">
               <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                      <FormControl>
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
                      </FormControl>
                  )}
                />
            </PopoverContent>
          </Popover>

          <Popover open={isReminderPopoverOpen} onOpenChange={setIsReminderPopoverOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                     <Button variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full hover:bg-muted", watchReminderDate ? "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20" : "text-muted-foreground hover:text-foreground")} disabled={isSubmitting}>
                      <AlarmClock className="mr-1.5 h-3.5 w-3.5" />
                      {watchReminderDate ? `${format(watchReminderDate, "MMM d")}${watchReminderTime ? `, ${watchReminderTime}` : ""}` : "Add reminder"}
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent><p>Set reminder</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
             {watchReminderDate && (
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={clearReminder} className="h-7 w-7 rounded-full -ml-2 mr-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Clear reminder" disabled={isSubmitting}>
                            <BellOff className="h-3.5 w-3.5"/>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Clear reminder</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
            )}
            <PopoverContent className="w-auto p-2 space-y-2">
              <FormField
                control={form.control}
                name="reminderDate"
                render={({ field }) => (
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => { field.onChange(date); if (!watchReminderTime) form.setValue("reminderTime", "09:00"); }} // Don't close popover here
                    initialFocus
                    disabled={isSubmitting}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="reminderTime"
                render={({ field }) => (
                  <Input
                    type="time"
                    {...field}
                    value={field.value || ""}
                    className="h-8 text-sm"
                    disabled={!watchReminderDate || isSubmitting}
                  />
                )}
              />
               <Button size="sm" onClick={() => setIsReminderPopoverOpen(false)} className="w-full h-8 text-sm" disabled={isSubmitting}>Done</Button>
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setShowSubtasks(!showSubtasks)} aria-label="Toggle Subtasks" disabled={isSubmitting}>
                  <ListChecks className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{showSubtasks ? "Hide" : "Show"} subtasks</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover>
             <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="More options" disabled={isSubmitting}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent><p>More options</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            <PopoverContent className="w-48 p-1">
                <Button variant="ghost" className="w-full justify-start text-sm h-8 text-muted-foreground cursor-not-allowed" disabled>
                    <LabelIcon className="mr-2 h-4 w-4"/> Add label (legacy)
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm h-8 text-muted-foreground cursor-not-allowed" disabled>
                    <Palette className="mr-2 h-4 w-4"/> Change color
                </Button>
            </PopoverContent>
          </Popover>

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
                       <Checkbox
                          checked={field.isCompleted}
                          onCheckedChange={(checked) => {
                            update(index, { ...field, isCompleted: !!checked });
                          }}
                          id={`subtask-form-${field.id || index}`}
                          aria-label={`Mark subtask ${field.text} as completed`}
                          className="h-4 w-4"
                          disabled={isSubmitting}
                        />
                      <Input
                        {...form.register(`subtasks.${index}.text`)}
                        defaultValue={field.text}
                        className={cn(
                          "flex-grow h-7 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm",
                          field.isCompleted ? "line-through text-muted-foreground" : ""
                        )}
                        aria-label={`Edit subtask ${field.text}`}
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive/80 h-6 w-6 hover:bg-destructive/10"
                        aria-label={`Remove subtask ${field.text}`}
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

        <div className={cn("flex items-center justify-between pt-5", (showSubtasks && fields.length > 0) ? "mt-2 border-t" : "border-t")}>
          <div className="flex items-center gap-2">
            <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
              <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="text-xs h-9 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" disabled={isSubmitting}>
                              <FolderOpen className="mr-1.5 h-4 w-4" />
                              {watchCategory || "Category"}
                          </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Set category</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              <PopoverContent className="w-[180px] p-1">
                  <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                          <FormItem>
                              <FormControl>
                                  <select
                                      value={field.value}
                                      onChange={(e) => { field.onChange(e.target.value); setIsCategoryPopoverOpen(false); }}
                                      className="w-full p-2 text-sm border-0 focus:ring-0 bg-popover text-popover-foreground rounded-md"
                                      disabled={isSubmitting}
                                  >
                                      {taskCategories.map((cat) => (
                                          <option key={cat} value={cat}>{cat}</option>
                                      ))}
                                  </select>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
              </PopoverContent>
            </Popover>
            
            {/* Label Selector */}
            <Popover open={isLabelPopoverOpen} onOpenChange={setIsLabelPopoverOpen}>
               <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs h-9 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" disabled={isSubmitting || isLoadingLabels}>
                          {isLoadingLabels ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : <LabelIcon className="mr-1.5 h-4 w-4" />}
                          {watchLabelId && userLabels.find(l => l.id === watchLabelId) ? userLabels.find(l => l.id === watchLabelId)!.name.substring(0,15) + (userLabels.find(l => l.id === watchLabelId)!.name.length > 15 ? '...' : '') : "Label"}
                        </Button>
                      </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>Assign label</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              <PopoverContent className="w-[200px] p-0">
                <FormField
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
            <Button type="button" variant="ghost" onClick={onClose} className="text-sm h-9" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[100px] text-sm h-9" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? "Save" : "Add task"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
