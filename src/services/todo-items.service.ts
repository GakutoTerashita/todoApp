import { fetchDbTodoItemById, fetchDbTodoItemsDone, fetchDbTodoItemsDoneNot, insertDbTodoItem, removeDbTodoItemById, updateDbTodoItemCompletion, updateDbTodoItemNameById } from "../db/control";
import { TodoListItem } from "../db/todoListItem";

export const findTodoItemsNotDone = async (fetchedBy: Express.User): Promise<TodoListItem[]> => {
    console.log('Fetching todo items for user:', fetchedBy);
    try {
        const itemsNotDone = await fetchDbTodoItemsDoneNot(fetchedBy);
        console.log('Fetched todo items not done:', itemsNotDone);
        return itemsNotDone;
    } catch (error) {
        console.error('Error fetching todo items not done:', error);
        throw new Error(`Failed to fetch todo items not done for user ${fetchedBy.id}: ${error}`);
    }
}

export const findTodoItemsDone = async (fetchedBy: Express.User): Promise<TodoListItem[]> => {
    console.log('Fetching done todo items for user:', fetchedBy);
    try {
        const itemsDone = await fetchDbTodoItemsDone(fetchedBy);
        console.log('Fetched done todo items:', itemsDone);
        return itemsDone;
    } catch (error) {
        console.error('Error fetching done todo items:', error);
        throw new Error(`Failed to fetch done todo items for user ${fetchedBy.id}: ${error}`);
    }
}

export const findTodoItemById = async (itemId: string): Promise<TodoListItem | null> => {
    console.log('Fetching todo item by ID:', itemId);
    try {
        const item = await fetchDbTodoItemById(itemId);
        console.log('Fetched todo item:', item);
        return item;
    } catch (error) {
        console.error('Error fetching todo item by ID:', error);
        throw new Error(`Failed to fetch todo item by ID ${itemId}: ${error}`);
    }
}

export const removeTodoItem = async (itemId: string): Promise<void> => {
    console.log('Removing todo item by ID:', itemId);
    try {
        await removeDbTodoItemById(itemId);
        console.log('Removed todo item successfully:', itemId);
    } catch (error) {
        console.error('Error removing todo item:', error);
        throw new Error(`Failed to remove todo item by ID ${itemId}: ${error}`);
    }
}

export const completeTodoItem = async (itemId: string): Promise<void> => {
    console.log('Completing todo item by ID:', itemId);
    try {
        await updateDbTodoItemCompletion(itemId);
        console.log('Completed todo item successfully:', itemId);
    } catch (error) {
        console.error('Error completing todo item:', error);
        throw new Error(`Failed to complete todo item by ID ${itemId}: ${error}`);
    }
}

export const registerTodoItem = async (item: TodoListItem): Promise<TodoListItem> => {
    console.log('Registering new todo item:', item);
    try {
        const newItem = await insertDbTodoItem(item);
        console.log('Registered new todo item successfully:', newItem);
        return newItem;
    } catch (error) {
        console.error('Error registering new todo item:', error);
        throw new Error(`Failed to register new todo item: ${error}`);
    }
}

export const updateTodoItemNameById = async (itemId: string, name: string): Promise<void> => {
    console.log('Updating todo item name by ID:', itemId, 'to name:', name);
    try {
        const itemToUpdate = await fetchDbTodoItemById(itemId);
        if (!itemToUpdate) {
            throw new Error(`Todo item with ID ${itemId} not found`);
        }

        await updateDbTodoItemNameById(itemId, name);
        console.log(`Updated todo item ${itemId} successfully`);
        return;
    } catch (error) {
        console.error('Error updating todo item name:', error);
        throw new Error(`Failed to update todo item name by ID ${itemId}: ${error}`);
    }
}