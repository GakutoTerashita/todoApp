import { PrismaClient } from '@prisma/client';
import { TodoListItem, TodoListItemWithUser } from './todoListItem';

class OperationResult {
    readonly message: string;

    constructor(message: string) {
        this.message = message;
    }
}

export class OperationSuccess<T = void> extends OperationResult {
    readonly data?: T;

    constructor(message: string, data?: T) {
        super(message);
        this.data = data;
    }

    hasData(): boolean {
        return this.data !== undefined;
    }
}

export class OperationFailure extends OperationResult {
    readonly error?: Error;

    constructor(message: string, error?: Error) {
        super(message);
        this.error = error;
    }

    logError(prefix: string = ''): void {
        if (this.error) {
            console.error(`${prefix}${this.message}`, this.error);
        }
    }
}

type DbOperationResult<T = void> = OperationSuccess<T> | OperationFailure;


export const fetchTodoItemsDoneNot = async (prisma: PrismaClient, fetchedBy: Express.User): Promise<DbOperationResult<TodoListItem[]>> => {
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
            return new OperationSuccess('No todo items not done found', []);
        }
        return new OperationSuccess('Fetched todo items not done', rows);
    }).catch((error) => {
        return new OperationFailure('Failed to fetch todo items not done', error);
    });
};

export const fetchTodoItemsDone = async (prisma: PrismaClient, fetchedBy: Express.User): Promise<DbOperationResult<TodoListItemWithUser[]>> => {
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
            return new OperationSuccess('No done todo items found', []);
        }
        return new OperationSuccess('Fetched done todo items', rows);
    }).catch((error) => {
        return new OperationFailure('Failed to fetch done todo items', error);
    });
};

export const fetchTodoItemById = async (prisma: PrismaClient, itemId: string): Promise<DbOperationResult<TodoListItem | null>> => {
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
            return new OperationSuccess(`Todo item with ID ${itemId} not found`, null);
        }
        return new OperationSuccess(`Fetched todo item with ID ${itemId}`, row);
    }).catch((error) => {
        return new OperationFailure(`Failed to fetch todo item with ID ${itemId}`, error);
    });
};

export const removeTodoItem = async (prisma: PrismaClient, itemId: string): Promise<DbOperationResult<void>> => {
    return await prisma.todo_items.delete({
        where: { id: itemId },
    }).then(() => {
        return new OperationSuccess(`Todo item with ID ${itemId} deleted successfully`, undefined);
    }).catch((error) => {
        return new OperationFailure(`Failed to delete todo item with ID ${itemId}`, error);
    });
};

export const completeTodoItem = async (prisma: PrismaClient, itemId: string): Promise<DbOperationResult<void>> => {
    const item = await prisma.todo_items.findUnique({
        where: { id: itemId },
        select: { done: true },
    }).then((item) => {
        return new OperationSuccess(`Fetched todo item with ID ${itemId}`, item);
    }).catch((error) => {
        return new OperationFailure(`Failed to fetch todo item with ID ${itemId}`, error);
    });

    if (item instanceof OperationFailure) {
        return new OperationFailure(`Error fetching todo item with ID ${itemId}`, item.error);
    }

    if (!item.data) {
        return new OperationFailure(`Todo item with ID ${itemId} not found`, new Error('Item not found'));
    }

    return await prisma.todo_items.update({
        where: { id: itemId },
        data: { done: !item.data.done },
    }).then((item) => {
        return new OperationSuccess(`Todo item with ID ${itemId} -> ${item.id} marked as ${!item.done ? 'done' : 'not done'}`, undefined);
    }).catch((error) => {
        return new OperationFailure(`Failed to update todo item with ID ${itemId}`, error);
    });
};

export const registerTodoItem = async (prisma: PrismaClient, item: TodoListItem): Promise<DbOperationResult<void>> => {
    return await prisma.todo_items.create({
        data: {
            id: item.id,
            name: item.name,
            done: item.done,
            due_date: item.due_date ? new Date(item.due_date) : null,
            created_by: item.created_by,
        },
    }).then((createdItem) => {
        return new OperationSuccess(`Todo item with name ${createdItem.name} created successfully`, undefined);
    }).catch((error) => {
        return new OperationFailure(`Failed to create todo item with name ${item.name}`, error);
    });
};

export const updateTodoItemNameById = async (prisma: PrismaClient, itemId: string, name: string): Promise<DbOperationResult<void>> => {
    return await prisma.todo_items.update({
        where: { id: itemId },
        data: { name },
    })
        .then(() => new OperationSuccess(`Updated todo item name for ID ${itemId}`, undefined))
        .catch((error) => new OperationFailure(`Failed to update todo item name for ID ${itemId}`, error));
};
