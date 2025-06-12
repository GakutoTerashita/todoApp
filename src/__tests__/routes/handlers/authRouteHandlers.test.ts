import { authUtils } from "../../../auth/utils";
import { logoutHandler, registerHandler } from "../../../routes/handlers/authRouteHandlers";

describe('Auth Route Handlers', () => {
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

    describe('registerHandler', () => {
        let req: any;
        let res: any;
        let consoleErrorSpy: jest.SpyInstance;

        beforeEach(() => {
            req = {
                body: {
                    username: 'testuser',
                    password: 'testpass',
                    is_admin_raw: 'false',
                },
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

        it('on create a user success, redirect with success message', async () => {
            jest.spyOn(authUtils, 'createUser').mockResolvedValueOnce({
                id: 'testuser',
                hashed_password: 'hashedpassword',
                created_at: new Date().toISOString(),
                is_admin: false,
            });
            await registerHandler(req, res);
            expect(req.flash).toHaveBeenCalledWith(
                'success',
                'Registration successful. You can now log in.'
            );
            expect(res.redirect).toHaveBeenCalledWith('/auth');
        });

        it('should handle errors during user creation', async () => {
            jest.spyOn(authUtils, 'createUser').mockRejectedValueOnce(new Error('User creation error'));
            await registerHandler(req, res);
            expect(req.flash).toHaveBeenCalledWith(
                'error',
                'An error occurred while creating the user. Please try again.'
            );
            expect(res.redirect).toHaveBeenCalledWith('/auth');
        });
    })
});