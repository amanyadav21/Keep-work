
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { CalendarIcon, Save, PlusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import type { Task, TaskCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { suggestTaskCategory } from "@/ai/flows/suggest-category-flow";

const taskCategories: [TaskCategory, ...TaskCategory[]] = ["Assignment", "Class", "Personal"];

const taskFormSchema = z.object({
  description: z.string().min(3, "Description must be at least 3 characters").max(500, "Description must be at most 500 characters"), // Increased max length
  dueDate: z.date({ required_error: "Due date is required." }),
  category: z.enum(taskCategories, { required_error: "Category is required." }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

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
          dueDate: editingTask.dueDate ? parseISO(editingTask.dueDate) : new Date(),
          category: editingTask.category,
        }
      : {
          description: "",
          dueDate: new Date(new Date().setHours(23, 59, 59, 999)), 
          category: undefined,
        },
  });

  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const descriptionValue = form.watch('description');

  useEffect(() => {
    // Only suggest if not editing, description is long enough, and no category is manually set
    if (!editingTask && descriptionValue && descriptionValue.length > 10 && !form.getValues('category')) {
      const handler = setTimeout(async () => {
        setIsSuggestingCategory(true);
        try {
          const result = await suggestTaskCategory({ description: descriptionValue });
          if (result && result.category) {
            form.setValue('category', result.category, { shouldValidate: true });
            toast({
              title: "AI Suggestion",
              description: `We've suggested category: "${result.category}".`,
            });
          }
        } catch (error) {
          console.error("AI category suggestion error:", error);
          // Optionally, inform the user about the error with a toast
          // toast({
          //   title: "AI Suggestion Failed",
          //   description: "Could not suggest a category at this time.",
          //   variant: "destructive",
          // });
        } finally {
          setIsSuggestingCategory(false);
        }
      }, 1200); // Debounce for 1.2 seconds

      return () => {
        clearTimeout(handler);
      };
    }
  }, [descriptionValue, editingTask, form, toast]);


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
                  {isSuggestingCategory && <Loader2 className="ml-2 h-4 w-4 animate-spin text-primary" />}
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
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="min-w-[120px]">
            {editingTask ? <Save className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {editingTask ? "Save Changes" : "Add Task"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
