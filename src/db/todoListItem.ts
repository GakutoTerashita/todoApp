export interface TodoListItem {
    id: string;
    name: string;
    done: boolean;
    dueDate?: string; // Optional field for due date
}