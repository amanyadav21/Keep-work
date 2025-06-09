
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
  FormLabel,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CalendarDays, Save, PlusCircle, Loader2, Trash2, ListChecks, Flag, BellRing, MoreHorizontal, X, AlarmClock, FolderOpen, Tag, Palette, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, setHours, setMinutes, setSeconds, setMilliseconds, isValid, startOfDay, formatISO } from "date-fns";
import type { Task, TaskCategory, Subtask, TaskPriority } from "@/types";
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
const taskPriorities: [TaskPriority, ...TaskPriority[]] = ["Urgent", "High", "Medium", "Low", "None"];


const subtaskSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Subtask description cannot be empty.").max(200, "Subtask too long"),
  isCompleted: z.boolean().default(false),
});

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(150, "Title must be at most 150 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  dueDate: z.date({ required_error: "Due date is required." }),
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
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

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
          description: editingTask.description,
          dueDate: editingTask.dueDate ? parseISO(editingTask.dueDate) : new Date(new Date().setHours(23, 59, 59, 999)),
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
    
    const submissionData = { ...data, dueDate: data.dueDate, reminderAt: reminderAtISO };
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
  };

  const clearDueDate = () => {
    form.setValue("dueDate", null);
  };
  
  const watchTitle = form.watch("title");
  const watchDescription = form.watch("description");
  const watchDueDate = form.watch("dueDate");
  const watchPriority = form.watch("priority");
  const watchReminderDate = form.watch("reminderDate");
  const watchReminderTime = form.watch("reminderTime");
  const watchCategory = form.watch("category"); 

  useEffect(() => {
    if (descriptionTextareaRef.current) {
      descriptionTextareaRef.current.style.height = 'auto'; 
      const scrollHeight = descriptionTextareaRef.current.scrollHeight;
      const minHeight = 60; 
      descriptionTextareaRef.current.style.height = `${Math.max(scrollHeight, minHeight)}px`;
    }
  }, [watchDescription]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-1 p-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="mb-0">
              <FormControl>
                <Input
                  placeholder="Title"
                  {...field}
                  className="text-lg font-semibold border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 h-auto placeholder:text-muted-foreground/80"
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
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="E.g., Research and write a 5-page essay on the Roman Empire..."
                  {...field}
                  className="text-sm border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2 min-h-[60px] resize-none placeholder:text-muted-foreground/70 max-h-[200px] overflow-y-auto"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex flex-wrap gap-2 my-3 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full", watchDueDate ? "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20" : "text-muted-foreground hover:text-foreground")}>
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                {watchDueDate ? format(watchDueDate, "MMM d") : "Set date"}
              </Button>
            </PopoverTrigger>
            {watchDueDate && (
                <Button variant="ghost" size="icon" onClick={clearDueDate} className="h-6 w-6 rounded-full -ml-2 mr-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Clear due date">
                    <X className="h-3.5 w-3.5"/>
                </Button>
            )}
            <PopoverContent className="w-auto p-0">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    disabled={(date) => date < startOfDay(new Date())}
                  />
                )}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full", watchPriority && watchPriority !== "None" ? "bg-accent/10 text-accent-foreground border-accent/30 hover:bg-accent/20" : "text-muted-foreground hover:text-foreground")}>
                <Flag className="mr-1.5 h-3.5 w-3.5" />
                {watchPriority && watchPriority !== "None" ? watchPriority : "Priority"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[180px] p-1">
               <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                      <FormControl>
                          <select
                            value={field.value || "None"} 
                            onChange={(e) => field.onChange(e.target.value as TaskPriority)}
                            className="w-full p-2 text-sm border-0 focus:ring-0 bg-popover text-popover-foreground rounded-md"
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

          <Popover>
            <PopoverTrigger asChild>
               <Button variant="outline" size="sm" className={cn("text-xs h-7 px-2.5 rounded-full", watchReminderDate ? "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20" : "text-muted-foreground hover:text-foreground")}>
                <AlarmClock className="mr-1.5 h-3.5 w-3.5" />
                {watchReminderDate ? `${format(watchReminderDate, "MMM d")}${watchReminderTime ? `, ${watchReminderTime}` : ""}` : "Add reminder"}
              </Button>
            </PopoverTrigger>
             {watchReminderDate && (
                <Button variant="ghost" size="icon" onClick={clearReminder} className="h-6 w-6 rounded-full -ml-2 mr-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Clear reminder">
                    <BellOff className="h-3.5 w-3.5"/>
                </Button>
            )}
            <PopoverContent className="w-auto p-2 space-y-2">
              <FormField
                control={form.control}
                name="reminderDate"
                render={({ field }) => (
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
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
                    disabled={!watchReminderDate}
                  />
                )}
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => setShowSubtasks(!showSubtasks)} aria-label="Toggle Subtasks">
            <ListChecks className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="More options">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1">
                <Button variant="ghost" className="w-full justify-start text-sm h-8 text-muted-foreground cursor-not-allowed" disabled>
                    <Tag className="mr-2 h-4 w-4"/> Add label
                </Button>
                <Button variant="ghost" className="w-full justify-start text-sm h-8 text-muted-foreground cursor-not-allowed" disabled>
                    <Palette className="mr-2 h-4 w-4"/> Change color
                </Button>
            </PopoverContent>
          </Popover>

        </div>

        {showSubtasks && (
          <div className="space-y-3 pt-2 pb-2">
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
                className="flex-grow h-8 text-sm"
              />
              <Button type="button" onClick={handleAddSubtask} variant="outline" size="icon" aria-label="Add subtask" className="h-8 w-8">
                <PlusCircle className="h-4 w-4" />
              </Button>
            </div>
            {fields.length > 0 && (
              <ScrollArea className="h-32 w-full rounded-md border p-2 bg-muted/30">
                <div className="space-y-1.5">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 p-1.5 bg-background rounded-md shadow-sm">
                       <Checkbox
                          checked={field.isCompleted}
                          onCheckedChange={(checked) => {
                            update(index, { ...field, isCompleted: !!checked });
                          }}
                          id={`subtask-form-${field.id || index}`}
                          aria-label={`Mark subtask ${field.text} as completed`}
                          className="h-4 w-4"
                        />
                      <Input
                        {...form.register(`subtasks.${index}.text`)}
                        defaultValue={field.text}
                        className={cn(
                          "flex-grow h-7 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm",
                          field.isCompleted ? "line-through text-muted-foreground" : ""
                        )}
                        aria-label={`Edit subtask ${field.text}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-destructive hover:text-destructive/80 h-6 w-6 hover:bg-destructive/10"
                        aria-label={`Remove subtask ${field.text}`}
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
        
        <div className={cn("flex items-center justify-between pt-4", (showSubtasks && fields.length > 0) && "mt-2 border-t")}>
          <Popover>
              <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs h-8 px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
                      <FolderOpen className="mr-1.5 h-4 w-4" />
                      {watchCategory || "Category"}
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-1">
                  <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                          <FormItem>
                              <FormControl>
                                  <select
                                      value={field.value}
                                      onChange={field.onChange}
                                      onBlur={field.onBlur}
                                      ref={field.ref}
                                      name={field.name}
                                      className="w-full p-2 text-sm border-0 focus:ring-0 bg-popover text-popover-foreground rounded-md"
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
          <div className="flex space-x-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-sm h-9">
              Cancel
            </Button>
            <Button type="submit" className="min-w-[100px] text-sm h-9" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? "Save" : "Add task"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
