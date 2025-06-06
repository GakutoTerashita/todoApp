import express, { Router } from 'express';
import { TodoListItem } from '../db/todoListItem';
import { v4 as uuidV4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { OperationFailure, TodoControl } from '../db/control';

export const todoRoutes = (prisma: PrismaClient): Router => {
    const router = express.Router();
    const {
        fetchTodoItemsDoneNot,
        fetchTodoItemsDone,
        removeTodoItemById: removeTodoItem,
        completeTodoItem,
        registerTodoItem,
        fetchTodoItemById,
        updateTodoItemNameById
    } = new TodoControl(prisma);

    const is_login = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user) {
            res.redirect('/auth');
        }
        return next();
    };

    router.get('/', is_login, async (req, res) => {
        const items = await fetchTodoItemsDoneNot(req.user!);
        const itemsDone = await fetchTodoItemsDone(req.user!);

        if (items instanceof OperationFailure) {
            console.error('Error fetching todo items');
            items.logError();
            res.redirect('/error'); // TODO: Create an database fetch error page
            return;
        }
        if (itemsDone instanceof OperationFailure) {
            console.error('Error fetching done todo items');
            itemsDone.logError();
            res.redirect('/error'); // TODO: Create an database fetch error page
            return;
        }

        res.render('home', {
            items: items.data,
            itemsDone: itemsDone.data,
            success: req.flash('success'),
            error: req.flash('error'),
        });
    });

    router.get('/error', (req, res) => {
        res.send('error'); // TODO: Create an error page
    });

    router.post('/items/delete/:itemId', is_login, async (req, res) => {
        const itemId = req.params.itemId;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }

        const result = await removeTodoItem(itemId)
        if (result instanceof OperationFailure) {
            console.error('Error removing item:', result.error);
            req.flash('error', 'Failed to remove item');
            res.redirect('/');
            return;
        }
        req.flash('success', 'Removed item successfully');
        res.redirect('/');
    });

    router.post('/items/complete/:itemId', is_login, async (req, res) => {
        const itemId = req.params.itemId;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }

        const result = await completeTodoItem(itemId);
        if (result instanceof OperationFailure) {
            console.error('Error changing item status:', result.error);
            req.flash('error', 'Failed to change item status');
            res.redirect('/');
            return;
        }
        console.log('Item status changed successfully for item ID:', itemId);
        req.flash('success', 'Changed item status successfully');
        res.redirect('/');
    });

    router.post('/items/register', is_login, async (req, res) => {
        const { name, dueDate } = req.body;
        if (!name) {
            req.flash('error', 'Item name is required');
            res.redirect('/');
            return;
        }

        const newItem: TodoListItem = {
            id: uuidV4(),
            name,
            done: false,
            due_date: dueDate || undefined,
            created_by: req.user!.id,
        }
        const result = await registerTodoItem(newItem);
        if (result instanceof OperationFailure) {
            console.error('Error registering item:', result.error);
            req.flash('error', 'Failed to add item');
            res.redirect('/');
            return;
        }
        req.flash('success', 'Item added successfully');
        res.redirect('/');
    });

    router.get('/items/modify/:itemId', is_login, async (req, res) => {
        const itemId = req.params.itemId;
        if (!itemId) {
            req.flash('error', 'Item ID is required');
            res.redirect('/');
            return;
        }

        const item = await fetchTodoItemById(itemId);
        if (item instanceof OperationFailure) {
            req.flash('error', 'Failed to fetch item for modification');
            item.logError();
            res.redirect('/');
            return;
        }

        if (item.data === null) {
            req.flash('error', 'Item not found');
            res.redirect('/');
            return;
        }
        res.render('modifyItems', { item: item.data });
    });

    router.post('/items/modify/:itemId', is_login, async (req, res) => {
        const itemId = req.params.itemId;
        const { name } = req.body;

        if (!itemId || !name) {
            req.flash('error', 'Item ID and name are required');
            res.redirect('/');
            return;
        }

        const resultFetch = await fetchTodoItemById(itemId);
        if (resultFetch instanceof OperationFailure) {
            req.flash('error', 'Failed to fetch item for modification');
            resultFetch.logError();
            res.redirect('/');
            return;
        }
        if (resultFetch.data === null) {
            req.flash('error', 'Item not found');
            res.redirect('/');
            return;
        }

        const resultUpdate = await updateTodoItemNameById(itemId, name);
        if (resultUpdate instanceof OperationFailure) {
            req.flash('error', 'Failed to update item name');
            resultUpdate.logError();
            res.redirect('/');
            return;
        }
        req.flash('success', 'Item modified successfully');
        res.redirect('/');
    });

    return router;
}