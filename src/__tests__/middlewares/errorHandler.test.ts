import { Request, Response } from 'express';
import errorHandler from '../../middlewares/errorHandler';

describe('errorHandler middleware catches errors', () => {
    let req: Request;
    let res: Response;
    let next: jest.Mock;
    let consoleErrorSpy: jest.SpyInstance;

    beforeAll(() => {
        next = jest.fn();
        req = {} as Request;
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        } as unknown as Response;
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should return 500 status code and error message', () => {
        const error = new Error('Test error');
        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal Server Error',
            message: 'Test error',
        });
    });
});