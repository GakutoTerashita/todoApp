import { PrismaClient } from '@prisma/client';
import { TodoListItem } from './todoListItem';

export const fetchTodoItemsDoneNot = async (prisma: PrismaClient, fetchedBy: string): Promise<TodoListItem[]> => {
    const rows = await prisma.todo_items.findMany({
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true,
            users: {
                select: { id: true },
            },
        },
        where: {
            users: { id: fetchedBy },
            done: false,
        },
        orderBy: [
            { due_date: 'asc' },
            { due_date: 'desc' },
        ],
    });

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        done: row.done || false,
        dueDate: row.due_date ? row.due_date.toISOString() : undefined,
    }));
};

export const fetchTodoItemsDone = async (prisma: PrismaClient, fetchedBy: string): Promise<TodoListItem[]> => {
    const rows = await prisma.todo_items.findMany({
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true,
            users: {
                select: { id: true },
            },
        },
        where: {
            users: { id: fetchedBy },
            done: true,
        },
        orderBy: [
            { due_date: 'asc' },
            { due_date: 'desc' },
        ],
    });

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        done: row.done || false,
        dueDate: row.due_date ? row.due_date.toISOString() : undefined,
    }));
};

export const fetchTodoItemById = async (prisma: PrismaClient, itemId: string): Promise<TodoListItem | null> => {
    const row = await prisma.todo_items.findUnique({
        where: { id: itemId },
        select: {
            id: true,
            name: true,
            done: true,
            due_date: true,
        },
    });

    if (!row) {
        return null;
    }

    return {
        id: row.id,
        name: row.name,
        done: row.done || false,
        dueDate: row.due_date ? row.due_date.toISOString() : undefined,
    };
};

export const removeTodoItem = async (prisma: PrismaClient, itemId: string): Promise<void> => {
    await prisma.todo_items.delete({
        where: { id: itemId },
    });
};

export const completeTodoItem = async (prisma: PrismaClient, itemId: string): Promise<void> => {
    const item = await prisma.todo_items.findUnique({
        where: { id: itemId },
        select: { done: true },
    });

    if (!item) {
        throw new Error(`Todo item with ID ${itemId} not found`);
    }

    await prisma.todo_items.update({
        where: { id: itemId },
        data: { done: !item.done },
    });
};

export const registerTodoItem = async (prisma: PrismaClient, item: TodoListItem, createdBy: string): Promise<void> => {
    await prisma.todo_items.create({
        data: {
            id: item.id,
            name: item.name,
            done: item.done,
            due_date: item.dueDate ? new Date(item.dueDate) : null,
            created_by: createdBy,
        },
    });
};

export const updateTodoItemNameById = async (prisma: PrismaClient, itemId: string, name: string): Promise<void> => {
    await prisma.todo_items.update({
        where: { id: itemId },
        data: { name },
    });
};
