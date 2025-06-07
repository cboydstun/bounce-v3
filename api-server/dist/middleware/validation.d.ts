import { Request, Response, NextFunction } from "express";
import Joi from "joi";
export interface ValidationError {
    field: string;
    message: string;
}
/**
 * Middleware factory to validate request data using Joi schemas
 * @param schema Joi schema to validate against
 * @param property Request property to validate ('body', 'query', 'params')
 */
export declare const validate: (schema: Joi.ObjectSchema, property?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
export declare const registerSchema: Joi.ObjectSchema<any>;
export declare const loginSchema: Joi.ObjectSchema<any>;
export declare const refreshTokenSchema: Joi.ObjectSchema<any>;
export declare const forgotPasswordSchema: Joi.ObjectSchema<any>;
export declare const resetPasswordSchema: Joi.ObjectSchema<any>;
export declare const verifyEmailSchema: Joi.ObjectSchema<any>;
export declare const updateProfileSchema: Joi.ObjectSchema<any>;
export declare const changePasswordSchema: Joi.ObjectSchema<any>;
export declare const w9FormSchema: Joi.ObjectSchema<any>;
export declare const w9UpdateSchema: Joi.ObjectSchema<any>;
export declare const paginationSchema: Joi.ObjectSchema<any>;
export declare const dateRangeSchema: Joi.ObjectSchema<any>;
export declare const validateRegistration: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateLogin: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRefreshToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateForgotPassword: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateResetPassword: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateVerifyEmail: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateUpdateProfile: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateChangePassword: (req: Request, res: Response, next: NextFunction) => void;
export declare const validatePagination: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateDateRange: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateW9Form: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateW9Update: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateRequest: (schema: Joi.ObjectSchema, property?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Sanitize input to prevent XSS attacks
 * @param input Input string to sanitize
 */
export declare const sanitizeInput: (input: string) => string;
/**
 * Middleware to sanitize all string inputs in request body
 */
export declare const sanitizeBody: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validation.d.ts.map