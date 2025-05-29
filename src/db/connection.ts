import mysql from 'mysql2/promise';

export const connectDb = async (): Promise<mysql.Connection> => {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'todoApp',
        port: parseInt(process.env.DB_PORT || '3306', 10),
    });
};

export const createTables = async (dbConnection: mysql.Connection): Promise<mysql.Connection> => {
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS todo_items (
            id VARCHAR(36) PRIMARY KEY,
            name TEXT NOT NULL,
            done BOOLEAN DEFAULT FALSE
        );
    `);
    return dbConnection;
};
