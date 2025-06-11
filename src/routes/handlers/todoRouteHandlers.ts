import { Request, Response } from "express";
import { TodoListItem } from "../../db/todoListItem";
import {
    findTodoItemsDone,
    findTodoItemsNotDone,
    removeTodoItem,
    completeTodoItem,
    registerTodoItem,
    findTodoItemById,
    updateTodoItemNameById
} from "../../services/todo-items.service";
import { v4 as uuidV4 } from "uuid";

export const handler_get_root = async (
    req: Request,
    res: Response
) => {
    try {
        const items = await findTodoItemsDone(req.user!);
        const itemsDone = await findTodoItemsNotDone(req.user!);

        res.render('home', {
            items: items,
            itemsDone: itemsDone,
            success: req.flash('success'),
            error: req.flash('error'),
        });
    } catch (error) {
        console.error('Error fetching todo items');
        res.redirect('/error'); // TODO: Create an database fetch error page
    }
};

export const handler_get_error = (req: Request, res: Response) => {
    res.send('error'); // TODO: Create an error page
};

export const handler_post_delete_itemid = async (req: Request, res: Response) => {
    const itemId = req.params.itemId;
    if (!itemId) {
        req.flash('error', 'Item ID is required');
        res.redirect('/');
        return;
    }

    try {
        await removeTodoItem(itemId)
        req.flash('success', 'Removed item successfully');
        res.redirect('/');
    } catch (error) {
        console.error(`Error removing item: ${itemId}`, error);
        req.flash('error', 'Failed to remove item');
        res.redirect('/');
    }
}

export const handler_post_complete_itemid = async (req: Request, res: Response) => {
    const itemId = req.params.itemId;
    if (!itemId) {
        req.flash('error', 'Item ID is required');
        res.redirect('/');
        return;
    }

    try {
        await completeTodoItem(itemId);
        console.log('Item status changed successfully for item ID:', itemId);
        req.flash('success', 'Changed item status successfully');
        res.redirect('/');
    } catch (error) {
        console.error(`Error changing item status: ${itemId}`, error);
        req.flash('error', 'Failed to change item status');
        res.redirect('/');
    }
}

export const handler_post_register_itemid = async (req: Request, res: Response) => {
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

    try {
        await registerTodoItem(newItem);
        req.flash('success', 'Item added successfully');
        res.redirect('/');
    } catch (error) {
        console.error(`Error registering item: ${newItem}`, error);
        req.flash('error', 'Failed to add item');
        res.redirect('/');
    }
}

export const handler_get_modify_itemid = async (req: Request, res: Response) => {
    const itemId = req.params.itemId;
    if (!itemId) {
        req.flash('error', 'Item ID is required');
        res.redirect('/');
        return;
    }

    try {
        const item = await findTodoItemById(itemId);
        if (item === null) {
            req.flash('error', 'Item not found');
            res.redirect('/');
            return;
        }
        res.render('modifyItems', { item });
    } catch (error) {
        req.flash('error', 'Failed to fetch item for modification');
        res.redirect('/');
    }
};

export const handler_post_modify_itemid = async (req: Request, res: Response) => {
    const itemId = req.params.itemId;
    const { name } = req.body;

    if (!itemId || !name) {
        req.flash('error', 'Item ID and name are required');
        res.redirect('/');
        return;
    }

    try {
        await updateTodoItemNameById(itemId, name);
        req.flash('success', 'Item modified successfully');
        res.redirect('/');
    } catch (error) {
        req.flash('error', 'Failed to modify item');
        res.redirect('/');
    }
};
