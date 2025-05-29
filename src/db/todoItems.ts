import mysql from 'mysql2/promise';

export class TodoListItem {
    id: string;
    name: string;
    done: boolean;

    constructor(name: string, id: string, done: boolean) {
        this.id = id;
        this.name = name;
        this.done = done;
    }
}

export const fetchTodoItems = async (dbConnection: mysql.Connection): Promise<TodoListItem[]> => {
    try {
        const [rows] = await dbConnection.query('SELECT * FROM todo_items');

        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => new TodoListItem(row.name, row.id, row.done)); // TODO: any
    } catch (error) {
        console.error('Failed to fetch todo items:', error);
        throw error;
    }
};

export const removeTodoItem = async (dbConnection: mysql.Connection, itemId: string): Promise<void> => {
    try {
        await dbConnection.query('DELETE FROM todo_items WHERE id = ?', [itemId]);
        return;
    }
    catch (error) {
        console.error('Failed to remove todo item:', error);
        throw error;
    }
}

export const completeTodoItem = async (dbConnection: mysql.Connection, itemId: string): Promise<void> => {
    try {
        await dbConnection.query('UPDATE todo_items SET done = NOT done WHERE id = ?', [itemId]);
        return;
    } catch (error) {
        console.error('Failed to change complete state of todo item:', error);
        throw error;
    }
};

export const registerTodoItem = async (dbConnection: mysql.Connection, item: TodoListItem): Promise<void> => {
    try {
        await dbConnection.query(
            'INSERT INTO todo_items (id, name, done) VALUES (?, ?, ?)',
            [item.id, item.name, item.done]
        );
        return;
    }
    catch (error) {
        console.error('Failed to register todo item:', error);
        throw error;
    }
};
