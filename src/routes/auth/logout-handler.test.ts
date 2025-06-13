import { logoutHandler } from "./authRouteHandlers";

describe('logoutHandler', () => {
    let req: any;
    let res: any;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        req = {
            logout: jest.fn((cb) => cb(null)),
            flash: jest.fn(),
        };
        res = {
            redirect: jest.fn(),
        };
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy.mockRestore();
    })

    it('should call req.logout and redirect on success', () => {
        logoutHandler(req, res);
        expect(req.logout).toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('success', 'You have been logged out successfully.');
        expect(res.redirect).toHaveBeenCalledWith('/auth');
    });

    it('should handle errors during logout', () => {
        req.logout.mockImplementation((
            cb: (err: Error | null) => void
        ) => {
            return cb(new Error('Logout error'))
        });
        logoutHandler(req, res);
        expect(req.logout).toHaveBeenCalled();
        expect(req.flash).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/auth');
    });
});