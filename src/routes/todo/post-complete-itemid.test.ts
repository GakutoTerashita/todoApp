import { post_complete_itemid } from './todoRouteHandlers';
import * as todoItemService from '../../services/todo-items.service';

describe('post_complete_itemid', () => {
    describe('failure cases', () => {
        describe('failure cases', () => {
            let consoleLogSpy: jest.SpyInstance;
            let consoleErrorSpy: jest.SpyInstance;

            beforeEach(() => {
                consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
                consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            });

            afterEach(() => {
                jest.restoreAllMocks();
                consoleLogSpy.mockRestore();
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

                await post_complete_itemid(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', 'Item ID is required');
                expect(res.redirect).toHaveBeenCalledWith('/');
            });

            it('should redirect with error if changing item status fails', async () => {
                const req = {
                    params: { itemId: '1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                } as any;

                jest.spyOn(
                    todoItemService,
                    'completeTodoItem'
                ).mockRejectedValue(new Error('Database error 3'));

                await post_complete_itemid(req, res);

                expect(req.flash).toHaveBeenCalledWith('error', 'Failed to change item status');
                expect(res.redirect).toHaveBeenCalledWith('/');
            });
        });

        describe('success cases', () => {
            let consoleLogSpy: jest.SpyInstance;
            let consoleErrorSpy: jest.SpyInstance;

            beforeEach(() => {
                consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
                consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            });

            afterEach(() => {
                jest.restoreAllMocks();
                consoleErrorSpy.mockRestore();
            });

            it('should redirect with success when item status is changed', async () => {
                const req = {
                    params: { itemId: '1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                } as any;

                jest.spyOn(
                    todoItemService,
                    'completeTodoItem'
                ).mockResolvedValue();

                await post_complete_itemid(req, res);

                expect(req.flash).toHaveBeenCalledWith('success', 'Changed item status successfully');
                expect(res.redirect).toHaveBeenCalledWith('/');
            });
        });
    });
});