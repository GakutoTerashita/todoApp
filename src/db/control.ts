import { PrismaClient } from '@prisma/client';
import { TodoListItem } from './todoListItem';

// 参考用 SQLクエリ 移行が終わったら消す
const BASE_QUERY_FETCH_TODO_ITEMS = `
    SELECT 
        ti.id AS item_id,
        ti.name, 
        ti.done, 
        ti.due_date, 
        u.id AS user_id
    FROM todo_items AS ti
    LEFT JOIN users AS u ON ti.created_by = u.id
`;

export const fetchTodoItemsDoneNot = async (prisma: PrismaClient, fetchedBy: string): Promise<TodoListItem[]> => {
    const rows = await prisma.todo_items.findMany({
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true, // Optional field for due date
            users: {
                select: {
                    id: true // Fetching the user ID who created the item
                }
            }
        },
        where: {
            users: {
                id: fetchedBy
            },
            done: false // Fetching only items that are not done
        },
        orderBy: [
            { due_date: 'asc' }, // Order by due date ascending
            { due_date: 'desc' } // If due date is null, it will be at the end
        ]
    })

    if (!Array.isArray(rows) || rows.length === 0) {
        return [];
    }

    return rows.map((row) => {
        return {
            id: row.id,
            name: row.name,
            done: row.done || false,
            dueDate: row.due_date ? row.due_date.toISOString() : undefined // Optional field for due date
        }
    }); // TODO: any
};

export const fetchTodoItemsDone = async (fetchedBy: string): Promise<TodoListItem[]> => {
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

export const fetchTodoItemById = async (itemId: string): Promise<TodoListItem | null> => {
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

export const removeTodoItem = async (itemId: string): Promise<void> => {
    await this.dbConnection.query(`
            DELETE FROM todo_items WHERE id = ?
        `, [itemId]);
}

export const completeTodoItem = async (itemId: string): Promise<void> => {
    await this.dbConnection.query(`
            UPDATE todo_items SET done = NOT done WHERE id = ?
        `, [itemId]);
};

export const registerTodoItem = async (item: TodoListItem, createdBy: string): Promise<void> => {
    await this.dbConnection.query(
        'INSERT INTO todo_items (id, name, done, due_date, created_by) VALUES (?, ?, ?, ?, ?)',
        [item.id, item.name, item.done, item.dueDate || null, createdBy]
    );
};

export const updateTodoItemNameById = async (itemId: string, name: string): Promise<void> => {
    await this.dbConnection.query(
        `UPDATE todo_items SET name = ? WHERE id = ?`,
        [name, itemId]
    );
}
