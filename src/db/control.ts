import { prisma } from '../prisma-client';
import { TodoListItem, TodoListItemWithUser } from './todoListItem';

export const fetchDbTodoItemsDoneNot = async (fetchedBy: Express.User): Promise<TodoListItem[]> => {
    return await prisma.todo_items.findMany({
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true,
            created_by: true,
            users: {
                select: { id: true },
            },
        },
        where: {
            users: fetchedBy.is_admin ? undefined : { id: fetchedBy.id },
            done: false,
        },
        orderBy: [
            { due_date: 'asc' },
            { due_date: 'desc' },
        ],
    }).catch((error) => {
        throw new Error(`Failed to fetch todo items not done for user ${fetchedBy.id}: ${error}`);
    });
}

export const fetchDbTodoItemsDone = async (fetchedBy: Express.User): Promise<TodoListItemWithUser[]> => {
    return await prisma.todo_items.findMany({
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true,
            created_by: true,
            users: {
                select: { id: true },
            },
        },
        where: {
            users: fetchedBy.is_admin ? undefined : { id: fetchedBy.id },
            done: true,
        },
        orderBy: [
            { due_date: 'asc' },
            { due_date: 'desc' },
        ],
    }).catch((error) => {
        throw new Error(`Failed to fetch done todo items for user ${fetchedBy.id}: ${error}`);
    });
}

export const fetchDbTodoItemById = async (itemId: string): Promise<TodoListItem | null> => {
    return await prisma.todo_items.findUnique({
        where: { id: itemId },
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true,
            created_by: true,
        },
    }).catch((error) => {
        throw new Error(`Failed to fetch todo item by ID ${itemId}: ${error}`);
    });
}

export const removeDbTodoItemById = async (itemId: string): Promise<void> => {
    await prisma.todo_items.delete({
        where: { id: itemId },
    }).catch((error) => {
        throw new Error(`Failed to delete todo item by ID ${itemId}: ${error}`);
    });
}

export const updateDbTodoItemCompletion = async (itemId: string): Promise<void> => {
    const itemToComplete = await prisma.todo_items.findUnique({
        where: { id: itemId },
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true,
            created_by: true,
        },
    });
    if (!itemToComplete) {
        throw new Error(`Todo item with ID ${itemId} not found`);
    }

    await prisma.todo_items.update({
        where: { id: itemId },
        data: { done: itemToComplete.done ? false : true },
    }).catch((error) => {
        throw new Error(`Failed to complete todo item with ID ${itemId}: ${error}`);
    });
}

export const insertDbTodoItem = async (item: TodoListItem): Promise<TodoListItem> => {
    const result = await prisma.todo_items.create({
        data: {
            id: item.id,
            name: item.name,
            done: item.done,
            due_date: item.due_date ? new Date(item.due_date) : null,
            created_by: item.created_by,
        },
    }).catch((error) => {
        throw new Error(`Failed to create todo item with name ${item.name}: ${error}`);
    });

    return result;
}

export const updateDbTodoItemNameById = async (itemId: string, name: string): Promise<void> => {
    await prisma.todo_items.update({
        where: { id: itemId },
        data: { name },
    }).catch((error) => {
        throw new Error(`Failed to update todo item name for ID ${itemId} :${error}`);
    });
}

export const fetchUserByUsername = async (username: string): Promise<Express.User | null> => {
    const userFetched = await prisma.users.findUnique({
        where: { id: username },
    }).catch((error) => {
        throw new Error(`Failed to fetch user by username ${username}: ${error}`);
    });

    return {
        id: userFetched?.id || '',
        hashed_password: userFetched?.hashed_password || '',
        created_at: userFetched?.created_at ? userFetched.created_at.toISOString() : '',
        is_admin: userFetched?.is_admin || false,
    }
};