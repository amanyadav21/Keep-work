
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
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Save, PlusCircle, Loader2, Trash2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { Task, TaskCategory, Subtask } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
// import { suggestTaskCategory } from "@/ai/flows/suggest-category-flow"; // AI feature removed
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";


const taskCategories: [TaskCategory, ...TaskCategory[]] = ["Assignment", "Class", "Personal"];

const subtaskSchema = z.object({
  id: z.string().optional(), // Optional for new subtasks, present for existing
  text: z.string().min(1, "Subtask description cannot be empty.").max(200, "Subtask too long"),
  isCompleted: z.boolean().default(false),
});

const taskFormSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters").max(500, "Description must be at most 500 characters"),
  dueDate: z.date({ required_error: "Due date is required." }),
  category: z.enum(taskCategories, { required_error: "Category is required." }),
  subtasks: z.array(subtaskSchema).optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmit: (data: TaskFormValues, existingTaskId?: string) => void;
  editingTask?: Task | null;
  onClose: () => void;
}

export function TaskForm({ onSubmit, editingTask, onClose }: TaskFormProps) {
  const { toast } = useToast();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: editingTask
      ? {
          description: editingTask.description,
          dueDate: editingTask.dueDate ? parseISO(editingTask.dueDate) : new Date(new Date().setHours(23, 59, 59, 999)),
          category: editingTask.category,
          subtasks: editingTask.subtasks?.map(st => ({...st})) || [],
        }
      : {
          description: "",
          dueDate: new Date(new Date().setHours(23, 59, 59, 999)), // Default to end of current day
          category: undefined,
          subtasks: [],
        },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "subtasks",
  });

  const [newSubtaskText, setNewSubtaskText] = useState("");
  // const [isSuggestingCategory, setIsSuggestingCategory] = useState(false); // AI feature removed
  const descriptionValue = form.watch('description');
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);

  // useEffect(() => { // AI Category Suggestion Logic Removed
  //   if (!editingTask && descriptionValue && descriptionValue.length > 10 && !form.getValues('category')) {
  //     const handler = setTimeout(async () => {
  //       setIsSuggestingCategory(true);
  //       try {
  //         // const result = await suggestTaskCategory({ description: descriptionValue });
  //         // if (result && result.category) {
  //         //   form.setValue('category', result.category, { shouldValidate: true });
  //         //   toast({
  //         //     title: "AI Suggestion",
  //         //     description: `We've suggested category: "${result.category}".`,
  //         //   });
  //         // }
  //         toast({
  //           title: "AI Feature Note",
  //           description: "AI category suggestion is currently unavailable.",
  //           variant: "default"
  //         });
  //       } catch (error) {
  //         console.error("AI category suggestion error:", error);
  //         // toast({ title: "AI Error", description: "Could not get category suggestion.", variant: "destructive"});
  //       } finally {
  //         setIsSuggestingCategory(false);
  //       }
  //     }, 1200);

  //     return () => {
  //       clearTimeout(handler);
  //     };
  //   }
  // }, [descriptionValue, editingTask, form, toast]);

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
      description: `"${data.description.substring(0, 30)}${data.description.length > 30 ? "..." : ""}" ${editingTask ? 'updated' : 'added'}.`,
    });
    onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 p-1">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="E.g., Finish reading Chapter 3 for History class..."
                  {...field}
                  className="min-h-[100px] resize-none"
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
                  {/* {isSuggestingCategory && <Loader2 className="ml-2 h-4 w-4 animate-spin text-primary" />} AI feature removed */}
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

        {/* Subtasks Section */}
        <div className="space-y-3">
          <FormLabel className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" /> Subtasks / Checklist</FormLabel>
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
