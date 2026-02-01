
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
// Removed duplicate popover import
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Save, PlusCircle, Loader2, Trash2, ListChecks, Flag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { Task, TaskCategory, Subtask, TaskPriority } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// Removed useAuth import


const taskCategories: [TaskCategory, ...TaskCategory[]] = ["Assignment", "Class", "Personal"];
const taskPriorities: [TaskPriority, ...TaskPriority[]] = ["None", "Low", "Medium", "High"];


const subtaskSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Subtask description cannot be empty.").max(200, "Subtask too long"),
  isCompleted: z.boolean().default(false),
});

const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required.").max(150, "Title must be at most 150 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"), // Removed .max(500, ...)
  summary: z.string().max(300, "Summary must be at most 300 characters").optional(),
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

  const initialDueDate = editingTask?.dueDate ? parseISO(editingTask.dueDate) : new Date(new Date().setHours(23, 59, 59, 999));
  const initialReminderDate = editingTask?.reminderAt ? parseISO(editingTask.reminderAt) : null;
  const initialReminderTime = editingTask?.reminderAt ? format(parseISO(editingTask.reminderAt), "HH:mm") : "09:00";

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: editingTask
      ? {
          title: editingTask.title || "",
          description: editingTask.description || "",
          dueDate: initialDueDate,
          category: editingTask.category,
          priority: editingTask.priority || "None",
          summary: editingTask.summary || "",
          subtasks: editingTask.subtasks?.map(st => ({...st})) || [],
          reminderDate: initialReminderDate,
          reminderTime: initialReminderTime,
          labelId: editingTask.labelId || null,
        }
      : {
          title: "",
          description: "",
          summary: "",
          dueDate: new Date(new Date().setHours(23, 59, 59, 999)), 
          category: undefined,
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
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [aiError, setAiError] = useState("");
  const [hasAutoSuggested, setHasAutoSuggested] = useState(false);

  const watchedTitle = form.watch('title');
  const watchedDescription = form.watch('description');
  const watchedCategory = form.watch('category');
  const watchedPriority = form.watch('priority');

  const runAISuggestions = async () => {
    if (!watchedTitle || !watchedDescription) return;
    setIsAISuggesting(true);
    setAiError("");
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: watchedTitle,
          description: watchedDescription,
          dueDate: form.getValues('dueDate')?.toISOString?.() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get AI suggestions');
      }

      const data = await res.json();
      if (data?.category) {
        form.setValue('category', data.category, { shouldValidate: true });
      }
      if (data?.priority) {
        form.setValue('priority', data.priority, { shouldValidate: true });
      }
      if (data?.summary) {
        form.setValue('summary', data.summary);
      }
      setHasAutoSuggested(true);
    } catch (err) {
      console.error(err);
      setAiError('AI suggestions failed. You can still fill manually.');
    } finally {
      setIsAISuggesting(false);
    }
  };

  useEffect(() => {
    if (editingTask) return;
    if (hasAutoSuggested) return;
    if (!watchedTitle || watchedTitle.trim().length < 4) return;
    if (!watchedDescription || watchedDescription.trim().length < 12) return;
    if (watchedCategory || watchedPriority !== 'None') return;

    const timeoutId = setTimeout(() => {
      runAISuggestions();
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [editingTask, hasAutoSuggested, watchedTitle, watchedDescription, watchedCategory, watchedPriority]);


  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      append({ id: crypto.randomUUID(), text: newSubtaskText.trim(), isCompleted: false });
      setNewSubtaskText("");
      newSubtaskInputRef.current?.focus();
    }
  };

  const handleFormSubmit = (data: TaskFormValues) => {
    onSubmit(data, editingTask?.id);
    toast({
      title: editingTask ? "Task Updated" : "Task Added",
      description: `"${data.title.substring(0, 30)}${data.title.length > 30 ? "..." : ""}" ${editingTask ? 'updated' : 'added'}.`,
    });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="E.g., History Midterm Essay"
                  {...field}
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
              <FormLabel>Task Description</FormLabel>
              <FormControl>
                <Textarea
                  ref={descriptionTextareaRef}
                  placeholder="Add a description..."
                  {...field}
                  className="min-h-[100px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runAISuggestions}
            disabled={isAISuggesting || !watchedTitle || !watchedDescription}
            className="gap-2"
          >
            {isAISuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isAISuggesting ? 'Thinking...' : 'AI Suggest'}
          </Button>
          {aiError && <p className="text-xs text-destructive">{aiError}</p>}
        </div>
        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary (AI)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="AI summary will appear here..."
                  {...field}
                  className="min-h-[70px] resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Category
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taskCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Flag className="mr-2 h-4 w-4 text-muted-foreground" /> Priority
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value || "None"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {taskPriorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority === "None" ? "No Priority" : priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
             <ListChecks className="h-5 w-5 text-primary" />
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
              className="flex-grow"
            />
            <Button type="button" onClick={handleAddSubtask} variant="outline" size="icon" aria-label="Add subtask">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          {fields.length > 0 && (
            <ScrollArea className="h-40 w-full rounded-md border p-3 bg-muted/30">
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 p-2 bg-background rounded-md shadow-sm">
                     <Checkbox
                        checked={field.isCompleted}
                        onCheckedChange={(checked) => {
                          update(index, { ...field, isCompleted: !!checked });
                        }}
                        id={`subtask-form-${field.id || index}`}
                        aria-label={`Mark subtask ${field.text} as completed`}
                      />
                    <Input
                      {...form.register(`subtasks.${index}.text`)}
                      defaultValue={field.text}
                      className={cn(
                        "flex-grow h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        field.isCompleted ? "line-through text-muted-foreground" : ""
                      )}
                      aria-label={`Edit subtask ${field.text}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive/80 h-7 w-7"
                      aria-label={`Remove subtask ${field.text}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <Separator />
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="min-w-[120px]" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingTask ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {editingTask ? "Save Changes" : "Add Task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
