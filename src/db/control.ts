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
        });
        return new DbController(connection);
    };

    installTables = async (): Promise<void> => {
        await this.dbConnection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await this.dbConnection.query(`
            CREATE TABLE IF NOT EXISTS todo_items (
                id VARCHAR(36) PRIMARY KEY,
                name TEXT NOT NULL,
                done BOOLEAN DEFAULT FALSE
            );
        `);
    };

    fetchTodoItemsDoneNot = async (): Promise<TodoListItem[]> => {
        const [rows] = await this.dbConnection.query('SELECT * FROM todo_items WHERE done != true');

        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => {
            return {
                id: row.id,
                name: row.name,
                done: row.done
            }
        }); // TODO: any
    };

    fetchTodoItemsDone = async (): Promise<TodoListItem[]> => {
        const [rows] = await this.dbConnection.query('SELECT * FROM todo_items WHERE done = true');

        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => {
            return {
                id: row.id,
                name: row.name,
                done: row.done
            }
        }); // TODO: any
    };

    fetchTodoItemById = async (itemId: string): Promise<TodoListItem | null> => {
        const [rows] = await this.dbConnection.query('SELECT * FROM todo_items WHERE id = ?', [itemId]);
        if (!Array.isArray(rows) || rows.length === 0) {
            return null;
        }
        const row = rows[0] as any;
        return {
            id: row.id,
            name: row.name,
            done: row.done
        };
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
