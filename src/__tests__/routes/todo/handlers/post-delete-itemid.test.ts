import { post_delete_itemid } from '../../../../routes/todo/todoRouteHandlers';
import * as todoItemService from '../../../../services/todo-items.service';

describe('post_delete_itemid', () => {
    describe('failure cases', () => {
        let consoleErrorSpy: jest.SpyInstance;
        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        });

        afterEach(() => {
            jest.restoreAllMocks();
            consoleErrorSpy.mockRestore();
        });

        it('should redirect with error if itemId is not provided', async () => {
            const req = {
                params: {},
                flash: jest.fn(),
            } as any;
            const res = {
                redirect: jest.fn(),
            } as any;

            await post_delete_itemid(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Item ID is required');
            expect(res.redirect).toHaveBeenCalledWith('/');
        });

        it('should redirect with error if removing item fails', async () => {
            const req = {
                params: { itemId: '1' },
                flash: jest.fn(),
            } as any;
            const res = {
                redirect: jest.fn(),
            } as any;

            jest.spyOn(
                todoItemService,
                'removeTodoItem'
            ).mockRejectedValue(new Error('Database error 2'));

            await post_delete_itemid(req, res);

            expect(req.flash).toHaveBeenCalledWith('error', 'Failed to remove item');
            expect(res.redirect).toHaveBeenCalledWith('/');
        });
    });

    describe('success cases', () => {
        let consoleErrorSpy: jest.SpyInstance;
        beforeEach(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        });

        afterEach(() => {
            jest.restoreAllMocks();
            consoleErrorSpy.mockRestore();
        });

        it('redirect with success', async () => {
            const req = {
                params: { itemId: '1' },
                flash: jest.fn(),
            } as any;
            const res = {
                redirect: jest.fn(),
            } as any;

            jest.spyOn(
                todoItemService,
                'removeTodoItem'
            ).mockResolvedValue();

            await post_delete_itemid(req, res);

            expect(req.flash).toHaveBeenCalledWith('success', 'Removed item successfully');
            expect(res.redirect).toHaveBeenCalledWith('/');
        });
    });
});