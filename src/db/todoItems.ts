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
    const [rows] = await dbConnection.query('SELECT * FROM todo_items');

    if (!Array.isArray(rows) || rows.length === 0) {
        return [];
    }

    return rows.map((row: any) => new TodoListItem(row.name, row.id, row.done)); // TODO: any
};

export const fetchTodoItemById = async (dbConnection: mysql.Connection, itemId: string): Promise<TodoListItem | null> => {
    const [rows] = await dbConnection.query('SELECT * FROM todo_items WHERE id = ?', [itemId]);
    if (!Array.isArray(rows) || rows.length === 0) {
        return null;
    }
    const row = rows[0] as any;
    return new TodoListItem(row.name, row.id, row.done);
}

export const removeTodoItem = async (dbConnection: mysql.Connection, itemId: string): Promise<void> => {
    await dbConnection.query('DELETE FROM todo_items WHERE id = ?', [itemId]);
}

export const completeTodoItem = async (dbConnection: mysql.Connection, itemId: string): Promise<void> => {
    await dbConnection.query('UPDATE todo_items SET done = NOT done WHERE id = ?', [itemId]);
};

export const registerTodoItem = async (dbConnection: mysql.Connection, item: TodoListItem): Promise<void> => {
    await dbConnection.query(
        'INSERT INTO todo_items (id, name, done) VALUES (?, ?, ?)',
        [item.id, item.name, item.done]
    );
};

export const updateTodoItemNameById = async (dbConnection: mysql.Connection, itemId: string, name: string): Promise<void> => {
    await dbConnection.query(
        'UPDATE todo_items SET name = ? WHERE id = ?',
        [name, itemId]
    );
}