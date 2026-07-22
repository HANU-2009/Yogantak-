import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { UnprocessableError } from '../errors/AppError';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = (result.error.issues || (result.error as any).errors).map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
        received: e.code === 'invalid_type' ? (e as any).received : undefined,
        expected: e.code === 'invalid_type' ? (e as any).expected : undefined,
      }));
      next(new UnprocessableError('Validation failed', errors));
      return;
    }

    // Replace request data with parsed/coerced data
    req[target] = result.data;
    next();
  };
}

export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}
