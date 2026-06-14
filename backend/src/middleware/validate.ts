import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { BadRequestError } from '../utils/AppError';

/**
 * Middleware to validate request data using Zod schemas
 */
export const validate = (schema: { 
  body?: AnyZodObject | z.ZodOptional<AnyZodObject>; 
  query?: AnyZodObject | z.ZodOptional<AnyZodObject>; 
  params?: AnyZodObject | z.ZodOptional<AnyZodObject>; 
  cookies?: AnyZodObject | z.ZodOptional<AnyZodObject> 
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }
      if (schema.body) {
        req.body = schema.body.parse(req.body) as any;
      }
      if (schema.cookies) {
        req.cookies = schema.cookies.parse(req.cookies) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new BadRequestError(message));
      }
      next(error);
    }
  };
};
