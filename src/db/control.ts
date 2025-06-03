import mysql from 'mysql2/promise';
import { TodoListItem } from './todoListItem';

export class DbController {
    dbConnection: mysql.Connection;

    constructor(dbConnection: mysql.Connection) {
        this.dbConnection = dbConnection;
    }

    static connect = async (): Promise<DbController> => {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'todoApp',
            port: parseInt(process.env.DB_PORT || '3306', 10),
            dateStrings: true,
        });
        return new DbController(connection);
    };

    static BASE_QUERY_FETCH_TODO_ITEMS = `
        SELECT 
            ti.id AS item_id,
            ti.name, 
            ti.done, 
            ti.due_date, 
            u.id AS user_id
        FROM todo_items AS ti
        LEFT JOIN users AS u ON ti.created_by = u.id
    `;
    fetchTodoItemsDoneNot = async (fetchedBy: string): Promise<TodoListItem[]> => {
        const [rows] = await this.dbConnection.query(`
            ${DbController.BASE_QUERY_FETCH_TODO_ITEMS}
            WHERE u.id = ? AND ti.done != true ORDER BY ti.due_date IS NULL ASC, ti.due_date ASC
        `, [fetchedBy]);

        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => {
            return {
                id: row.item_id,
                name: row.name,
                done: row.done,
                dueDate: row.due_date || undefined // Optional field for due date
            }
        }); // TODO: any
    };

    fetchTodoItemsDone = async (fetchedBy: string): Promise<TodoListItem[]> => {
        const [rows] = await this.dbConnection.query(`
            ${DbController.BASE_QUERY_FETCH_TODO_ITEMS}
            WHERE u.id = ? AND ti.done = true
        `, [fetchedBy]);
        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => {
            return {
                id: row.item_id,
                name: row.name,
                done: row.done,
                dueDate: row.due_date || undefined // Optional field for due date
            }
        }); // TODO: any
    };

    fetchTodoItemById = async (itemId: string): Promise<TodoListItem | null> => {
        const [rows] = await this.dbConnection.query(`
            SELECT * FROM todo_items WHERE id = ?
            `, [itemId])
        if (!Array.isArray(rows) || rows.length === 0) {
            return null;
        }
        const row = rows[0] as any;
        return {
            id: row.id,
            name: row.name,
            done: row.done,
            dueDate: row.due_date || undefined // Optional field for due date
        };
    }

    removeTodoItem = async (itemId: string): Promise<void> => {
        await this.dbConnection.query(`
            DELETE FROM todo_items WHERE id = ?
        `, [itemId]);
    }

    completeTodoItem = async (itemId: string): Promise<void> => {
        await this.dbConnection.query(`
            UPDATE todo_items SET done = NOT done WHERE id = ?
        `, [itemId]);
    };

    registerTodoItem = async (item: TodoListItem, createdBy: string): Promise<void> => {
        await this.dbConnection.query(
            'INSERT INTO todo_items (id, name, done, due_date, created_by) VALUES (?, ?, ?, ?, ?)',
            [item.id, item.name, item.done, item.dueDate || null, createdBy]
        );
    };

    updateTodoItemNameById = async (itemId: string, name: string): Promise<void> => {
        await this.dbConnection.query(
            `UPDATE todo_items SET name = ? WHERE id = ?`,
            [name, itemId]
        );
    }
}
