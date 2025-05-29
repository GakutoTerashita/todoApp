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

export class DbController {
    dbConnection: mysql.Connection;

    constructor(dbConnection: mysql.Connection) {
        this.dbConnection = dbConnection;
    }

    fetchTodoItemsDoneNot = async (): Promise<TodoListItem[]> => {
        const [rows] = await this.dbConnection.query('SELECT * FROM todo_items WHERE done != true');

        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => new TodoListItem(row.name, row.id, row.done)); // TODO: any
    };

    fetchTodoItemsDone = async (): Promise<TodoListItem[]> => {
        const [rows] = await this.dbConnection.query('SELECT * FROM todo_items WHERE done = true');

        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => new TodoListItem(row.name, row.id, row.done)); // TODO: any
    };

    fetchTodoItemById = async (itemId: string): Promise<TodoListItem | null> => {
        const [rows] = await this.dbConnection.query('SELECT * FROM todo_items WHERE id = ?', [itemId]);
        if (!Array.isArray(rows) || rows.length === 0) {
            return null;
        }
        const row = rows[0] as any;
        return new TodoListItem(row.name, row.id, row.done);
    }

    removeTodoItem = async (itemId: string): Promise<void> => {
        await this.dbConnection.query('DELETE FROM todo_items WHERE id = ?', [itemId]);
    }

    completeTodoItem = async (itemId: string): Promise<void> => {
        await this.dbConnection.query('UPDATE todo_items SET done = NOT done WHERE id = ?', [itemId]);
    };

    registerTodoItem = async (item: TodoListItem): Promise<void> => {
        await this.dbConnection.query(
            'INSERT INTO todo_items (id, name, done) VALUES (?, ?, ?)',
            [item.id, item.name, item.done]
        );
    };

    updateTodoItemNameById = async (itemId: string, name: string): Promise<void> => {
        await this.dbConnection.query(
            'UPDATE todo_items SET name = ? WHERE id = ?',
            [name, itemId]
        );
    }
}
