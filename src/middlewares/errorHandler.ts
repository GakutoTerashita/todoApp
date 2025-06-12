import { NextFunction, Request, Response } from 'express';

const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    console.error('Error occurred:', err.message);
    console.error('Stack trace:', err.stack);

    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
    });
}

export default errorHandler;