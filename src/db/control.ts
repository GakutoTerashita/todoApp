import { PrismaClient } from '@prisma/client';
import { TodoListItem, TodoListItemWithUser } from './todoListItem';

/**
 * Base class for operation results.  
 * Contains a message that describes the result of the operation.  
 * This class is extended by both success and failure results.
 */
class OperationResultBase {
    readonly message: string;

    constructor(message: string) {
        this.message = message;
    }
}

/**
 * Represents a successful operation.  
 * Contains a message and optional data.
 */
export class OperationSuccess<T = void> extends OperationResultBase {
    readonly data?: T;

    constructor(message: string, data?: T) {
        super(message);
        this.data = data;
    }
}

/**
 * Represents a failure in an operation.  
 * Contains an error message and an optional error object.  
 * Provides a method to log the error with an optional prefix.
 */
export class OperationFailure extends OperationResultBase {
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

/**
 * Type alias for operation results.  
 * **Success** or **Failure**.  
 * T is the type of data returned in case of success, defaults to void.
 */
type OperationResult<T = void> = OperationSuccess<T> | OperationFailure;

export class TodoControl {
    private _prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this._prisma = prisma;
    }

    fetchTodoItemsDoneNot = async (fetchedBy: Express.User): Promise<OperationResult<TodoListItem[]>> => {
        console.log('Fetching todo items not done for user:', fetchedBy);
        return await this._prisma.todo_items.findMany({
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
                return new OperationSuccess(`No todo items not done found for user: ${fetchedBy.id}`, []);
            }
            return new OperationSuccess(`Fetched todo items not done for user: ${fetchedBy.id}`, rows);
        }).catch((error) => {
            return new OperationFailure(`Failed to fetch todo items not done for user: ${fetchedBy.id}`, error);
        });
    }

    fetchTodoItemsDone = async (fetchedBy: Express.User): Promise<OperationResult<TodoListItemWithUser[]>> => {
        console.log('Fetching done todo items for user:', fetchedBy);
        return await this._prisma.todo_items.findMany({
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
                return new OperationSuccess(`No done todo items found for user: ${fetchedBy.id}`, []);
            }
            return new OperationSuccess(`Fetched done todo items for user: ${fetchedBy.id}`, rows);
        }).catch((error) => {
            return new OperationFailure(`Failed to fetch done todo items for user: ${fetchedBy.id}`, error);
        });
    }

    fetchTodoItemById = async (itemId: string): Promise<OperationResult<TodoListItem | null>> => {
        console.log('Fetching todo item by ID:', itemId);
        return await this._prisma.todo_items.findUnique({
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
            return new OperationSuccess(`Fetched todo item by ID ${itemId}`, row);
        }).catch((error) => {
            return new OperationFailure(`Failed to fetch todo by ID ${itemId}`, error);
        });
    }

    removeTodoItemById = async (itemId: string): Promise<OperationResult<void>> => {
        console.log('Removing todo item with ID:', itemId);
        return await this._prisma.todo_items.delete({
            where: { id: itemId },
        }).then(() => {
            return new OperationSuccess(`Todo item with ID ${itemId} deleted successfully`, undefined);
        }).catch((error) => {
            return new OperationFailure(`Failed to delete todo item by ID ${itemId}`, error);
        });
    }

    completeTodoItem = async (itemId: string): Promise<OperationResult<void>> => {
        console.log('Completing todo item with ID:', itemId);
        return await this._prisma.todo_items.update({
            where: { id: itemId },
            data: { done: true },
        }).then((item) => {
            return new OperationSuccess(`Todo item with ID ${itemId} marked as done`, undefined);
        }).catch((error) => {
            return new OperationFailure(`Failed to complete todo item with ID ${itemId}`, error);
        });
    }

    registerTodoItem = async (item: TodoListItem): Promise<OperationResult<void>> => {
        console.log('Registering new todo item:', item);
        return await this._prisma.todo_items.create({
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
    }

    updateTodoItemNameById = async (itemId: string, name: string): Promise<OperationResult<void>> => {
        console.log('Updating todo item name for ID:', itemId, 'to:', name);
        return await this._prisma.todo_items.update({
            where: { id: itemId },
            data: { name },
        }).then(() => {
            return new OperationSuccess(`Updated todo item name for ID ${itemId}`, undefined);
        }).catch((error) => {
            return new OperationFailure(`Failed to update todo item name for ID ${itemId}`, error);
        });
    }
}