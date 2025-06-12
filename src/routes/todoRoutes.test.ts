import { get_todo_root } from './handlers/todoRouteHandlers';

describe('todoRouteHandlers', () => {
    describe('handler_get_root', () => {
        describe('failure cases', () => {
            let consoleErrorSpy: jest.SpyInstance;
            let consoleLogSpy: jest.SpyInstance;
            beforeEach(() => {
                consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
                consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            })

            afterEach(() => {
                jest.restoreAllMocks();
                consoleErrorSpy.mockRestore();
                consoleLogSpy.mockRestore();
            })

            it('should redirect to /error when finding done todo_items fails', async () => {
                const req = {
                    user: { id: 'user1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                    render: jest.fn(),
                } as any;

                jest.spyOn(
                    require('../services/todo-items.service'),
                    'findTodoItemsDone'
                ).mockRejectedValue(new Error('Database error 0'));

                await get_todo_root(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/error');
            });

            it('should redirect to /error when fetching not done todo_items fails', async () => {
                const req = {
                    user: { id: 'user1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                    render: jest.fn(),
                } as any;

                jest.spyOn(
                    require('../services/todo-items.service'),
                    'findTodoItemsDone'
                )
                    .mockResolvedValue([])
                jest.spyOn(
                    require('../services/todo-items.service'),
                    'findTodoItemsNotDone'
                )
                    .mockRejectedValue(new Error('Database error 1'));

                await get_todo_root(req, res);

                expect(res.redirect).toHaveBeenCalledWith('/error');
            });
        })

        describe('success cases', () => {
            let consoleErrorSpy: jest.SpyInstance;
            let consoleLogSpy: jest.SpyInstance;
            beforeEach(() => {
                consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
                consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
            })

            afterEach(() => {
                jest.restoreAllMocks();
                consoleErrorSpy.mockRestore();
                consoleLogSpy.mockRestore();
            })

            it('should render home with todo items', async () => {
                const req = {
                    user: { id: 'user1' },
                    flash: jest.fn(),
                } as any;
                const res = {
                    redirect: jest.fn(),
                    render: jest.fn(),
                } as any;

                const mockItemsDone = [{ id: '1', title: 'Test Item 1' }];
                const mockItemsNotDone = [{ id: '2', title: 'Test Item 2' }];

                jest.spyOn(
                    require('../services/todo-items.service'),
                    'findTodoItemsDone'
                ).mockResolvedValue(mockItemsDone);
                jest.spyOn(
                    require('../services/todo-items.service'),
                    'findTodoItemsNotDone'
                ).mockResolvedValue(mockItemsNotDone);

                await get_todo_root(req, res);

                expect(res.render).toHaveBeenCalledWith('home', {
                    items: mockItemsNotDone,
                    itemsDone: mockItemsDone,
                    success: req.flash('success'),
                    error: req.flash('error'),
                });
            });
        });
    });
});
