import { get_todo_root, post_complete_itemid, post_delete_itemid } from '../../../routes/todo/todoRouteHandlers';
import * as todoItemService from '../../../services/todo-items.service';
import { TodoListItem } from '../../../db/todoListItem';

describe('todoRouteHandlers', () => {
    describe('get_todo_root', () => {
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
                    todoItemService,
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
                    todoItemService,
                    'findTodoItemsDone'
                )
                    .mockResolvedValue([])
                jest.spyOn(
                    todoItemService,
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

                const mockItemsDone: TodoListItem[] = [{
                    id: '1',
                    name: 'Test Item 1',
                    done: true,
                    created_by: 'user1',
                    due_date: new Date(),
                }];
                const mockItemsNotDone: TodoListItem[] = [{
                    id: '2',
                    name: 'Test Item 2',
                    done: false,
                    created_by: 'user2',
                    due_date: new Date(),
                }];

                jest.spyOn(
                    todoItemService,
                    'findTodoItemsDone'
                ).mockResolvedValue(mockItemsDone);
                jest.spyOn(
                    todoItemService,
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

    describe('post_complete_itemid', () => {
        describe('failure cases', () => {
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
                let consoleErrorSpy: jest.SpyInstance;
                beforeEach(() => {
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
});
