import { Prisma, PrismaClient } from '@prisma/client';
import { TodoListItem, TodoListItemWithUser } from './todoListItem';

export class OperationResult<T = void> {
    readonly success: boolean;
    readonly message: string;
    readonly data?: T;
    readonly error?: Error;

    private constructor(success: boolean, message: string, data?: T, error?: Error) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.error = error;
    }

    static success<T>(message: string, data?: T): OperationResult<T> {
        return new OperationResult<T>(true, message, data);
    }

    static failure<T>(message: string, error?: Error): OperationResult<T> {
        return new OperationResult<T>(false, message, undefined, error);
    }

    hasData(): boolean {
        return this.data !== undefined;
    }

    logError(prefix: string = ''): void {
        if (!this.success && this.error) {
            console.error(`${prefix}${this.message}`, this.error);
        }
    }
}

export const fetchTodoItemsDoneNot = async (prisma: PrismaClient, fetchedBy: Express.User): Promise<OperationResult<TodoListItem[]>> => {
    console.log('Fetching todo items not done for user:', fetchedBy);
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
    }).then((rows) => {
        if (rows.length === 0) {
            return OperationResult.success('No todo items not done found', []);
        }
        return OperationResult.success('Fetched todo items not done', rows);
    }).catch((error) => {
        return OperationResult.failure('Failed to fetch todo items not done', error);
    });
};

export const fetchTodoItemsDone = async (prisma: PrismaClient, fetchedBy: Express.User): Promise<OperationResult<TodoListItemWithUser[]>> => {
    console.log('Fetching done todo items for user:', fetchedBy);
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
    }).then((rows) => {
        if (rows.length === 0) {
            return OperationResult.success('No done todo items found', []);
        }
        return OperationResult.success('Fetched done todo items', rows);
    }).catch((error) => {
        return OperationResult.failure('Failed to fetch done todo items', error);
    });
};

export const fetchTodoItemById = async (prisma: PrismaClient, itemId: string): Promise<OperationResult<TodoListItem | null>> => {
    return await prisma.todo_items.findUnique({
        where: { id: itemId },
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true,
            created_by: true,
        },
    }).then((row) => {
        if (!row) {
            return OperationResult.success(`Todo item with ID ${itemId} not found`, null);
        }
        return OperationResult.success(`Fetched todo item with ID ${itemId}`, row);
    }).catch((error) => {
        return OperationResult.failure(`Failed to fetch todo item with ID ${itemId}`, error);
    });
};

export const removeTodoItem = async (prisma: PrismaClient, itemId: string): Promise<void> => {
    await prisma.todo_items.delete({
        where: { id: itemId },
    });
};

export const completeTodoItem = async (prisma: PrismaClient, itemId: string): Promise<void> => {
    const item = await prisma.todo_items.findUnique({
        where: { id: itemId },
        select: { done: true },
    });

    if (!item) {
        throw new Error(`Todo item with ID ${itemId} not found`);
    }

    await prisma.todo_items.update({
        where: { id: itemId },
        data: { done: !item.done },
    });
};

export const registerTodoItem = async (prisma: PrismaClient, item: TodoListItem): Promise<void> => {
    await prisma.todo_items.create({
        data: {
            id: item.id,
            name: item.name,
            done: item.done,
            due_date: item.due_date ? new Date(item.due_date) : null,
            created_by: item.created_by,
        },
    });
};

export const updateTodoItemNameById = async (prisma: PrismaClient, itemId: string, name: string): Promise<OperationResult<void>> => {
    const error = await prisma.todo_items.update({
        where: { id: itemId },
        data: { name },
    }).catch((error) => {
        return error;
    });

    if (error) {
        return OperationResult.failure(`Failed to update todo item name for ID ${itemId}`, error);
    }
    return OperationResult.success(`Updated todo item name for ID ${itemId}`);
};
