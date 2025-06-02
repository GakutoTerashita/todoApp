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

    installTables = async (): Promise<void> => {
        await this.dbConnection.query(`
            CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY UNIQUE,
            hashed_password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Ensure all columns exist (add missing columns if needed)
        const [userColumns]: any = await this.dbConnection.query(`
            SHOW COLUMNS FROM users
        `);
        const userColumnNames = userColumns.map((col: any) => col.Field);

        if (!userColumnNames.includes('id')) {
            await this.dbConnection.query(`
            ALTER TABLE users ADD COLUMN id VARCHAR(36) PRIMARY KEY UNIQUE
            `);
        }
        if (!userColumnNames.includes('hashed_password')) {
            await this.dbConnection.query(`
            ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255) NOT NULL
            `);
        }
        if (!userColumnNames.includes('created_at')) {
            await this.dbConnection.query(`
            ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            `);
        }

        await this.dbConnection.query(`
            CREATE TABLE IF NOT EXISTS todo_items (
            id VARCHAR(36) PRIMARY KEY,
            name TEXT NOT NULL,
            done BOOLEAN DEFAULT FALSE,
            due_date DATETIME DEFAULT NULL,
            created_by VARCHAR(36) NOT NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        // Ensure all columns exist (add missing columns if needed)
        const [todoItemColumns]: any = await this.dbConnection.query(`
            SHOW COLUMNS FROM todo_items
        `);
        const todoItemColumnNames = todoItemColumns.map((col: any) => col.Field);

        if (!todoItemColumnNames.includes('due_date')) {
            await this.dbConnection.query(`
            ALTER TABLE todo_items ADD COLUMN due_date DATETIME DEFAULT NULL
            `);
        }
        if (!todoItemColumnNames.includes('done')) {
            await this.dbConnection.query(`
            ALTER TABLE todo_items ADD COLUMN done BOOLEAN DEFAULT FALSE
            `);
        }
        if (!todoItemColumnNames.includes('name')) {
            await this.dbConnection.query(`
            ALTER TABLE todo_items ADD COLUMN name TEXT NOT NULL
            `);
        }
        if (!todoItemColumnNames.includes('id')) {
            await this.dbConnection.query(`
            ALTER TABLE todo_items ADD COLUMN id VARCHAR(36) PRIMARY KEY
            `);
        }
        if (!todoItemColumnNames.includes('created_by')) {
            await this.dbConnection.query(`
            ALTER TABLE todo_items ADD COLUMN created_by VARCHAR(36) NOT NULL,
            ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
            `);
        }
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
        console.log('fetchTodoItemsDoneNot called with fetchedBy:', fetchedBy);
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
        console.log('completeTodoItem called with itemId:', itemId);
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
