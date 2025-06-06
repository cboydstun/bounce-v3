import Joi from "joi";
import { logger } from "../utils/logger.js";
/**
 * Middleware factory to validate request data using Joi schemas
 * @param schema Joi schema to validate against
 * @param property Request property to validate ('body', 'query', 'params')
 */
export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      logger.warn("Validation error:", {
        path: req.path,
        method: req.method,
        errors: validationErrors,
      });
      res.status(400).json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: validationErrors,
      });
      return;
    }
    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};
// Password validation schema
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters long",
    "string.max": "Password must not exceed 128 characters",
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)",
    "any.required": "Password is required",
  });
// Email validation schema
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .max(254)
  .required()
  .messages({
    "string.email": "Please provide a valid email address",
    "string.max": "Email address is too long",
    "any.required": "Email is required",
  });
// Name validation schema
const nameSchema = Joi.string()
  .trim()
  .min(2)
  .max(100)
  .pattern(/^[a-zA-Z\s'-]+$/)
  .required()
  .messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must not exceed 100 characters",
    "string.pattern.base":
      "Name can only contain letters, spaces, hyphens, and apostrophes",
    "any.required": "Name is required",
  });
// Phone validation schema (optional)
const phoneSchema = Joi.string()
  .trim()
  .pattern(/^\+?[\d\s\-\(\)]+$/)
  .min(10)
  .max(20)
  .optional()
  .messages({
    "string.pattern.base": "Please provide a valid phone number",
    "string.min": "Phone number must be at least 10 characters",
    "string.max": "Phone number must not exceed 20 characters",
  });
// Skills validation schema
const skillsSchema = Joi.array()
  .items(
    Joi.string().trim().min(1).max(50).messages({
      "string.min": "Each skill must be at least 1 character",
      "string.max": "Each skill must not exceed 50 characters",
    }),
  )
  .max(20)
  .optional()
  .messages({
    "array.max": "Maximum 20 skills allowed",
  });
// Token validation schema
const tokenSchema = Joi.string().trim().min(1).required().messages({
  "string.min": "Token cannot be empty",
  "any.required": "Token is required",
});
// Registration validation schema
export const registerSchema = Joi.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  skills: skillsSchema,
});
// Login validation schema
export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().min(1).required().messages({
    "string.min": "Password cannot be empty",
    "any.required": "Password is required",
  }),
});
// Refresh token validation schema
export const refreshTokenSchema = Joi.object({
  refreshToken: tokenSchema,
});
// Forgot password validation schema
export const forgotPasswordSchema = Joi.object({
  email: emailSchema,
});
// Reset password validation schema
export const resetPasswordSchema = Joi.object({
  token: tokenSchema,
  password: passwordSchema,
});
// Email verification validation schema
export const verifyEmailSchema = Joi.object({
  token: tokenSchema,
});
// Update profile validation schema
export const updateProfileSchema = Joi.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  skills: skillsSchema,
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });
// Change password validation schema
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required().messages({
    "string.min": "Current password cannot be empty",
    "any.required": "Current password is required",
  }),
  newPassword: passwordSchema,
});
// Address validation schema
const addressSchema = Joi.object({
  street: Joi.string().trim().min(5).max(200).required().messages({
    "string.min": "Street address must be at least 5 characters",
    "string.max": "Street address must not exceed 200 characters",
    "any.required": "Street address is required",
  }),
  city: Joi.string().trim().min(2).max(100).required().messages({
    "string.min": "City must be at least 2 characters",
    "string.max": "City must not exceed 100 characters",
    "any.required": "City is required",
  }),
  state: Joi.string().trim().length(2).uppercase().required().messages({
    "string.length": "State must be a 2-letter code",
    "any.required": "State is required",
  }),
  zipCode: Joi.string()
    .trim()
    .pattern(/^\d{5}(-\d{4})?$/)
    .required()
    .messages({
      "string.pattern.base": "ZIP code must be in format 12345 or 12345-6789",
      "any.required": "ZIP code is required",
    }),
});
// Tax ID validation schema
const taxIdSchema = Joi.string()
  .trim()
  .pattern(/^\d{9}$/)
  .required()
  .messages({
    "string.pattern.base": "Tax ID must be exactly 9 digits",
    "any.required": "Tax ID is required",
  });
// W-9 form validation schema
export const w9FormSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(200).required().messages({
    "string.min": "Business name must be at least 2 characters",
    "string.max": "Business name must not exceed 200 characters",
    "any.required": "Business name is required",
  }),
  taxClassification: Joi.string()
    .valid(
      "individual",
      "c-corp",
      "s-corp",
      "partnership",
      "trust",
      "llc",
      "other",
    )
    .required()
    .messages({
      "any.only":
        "Tax classification must be one of: individual, c-corp, s-corp, partnership, trust, llc, other",
      "any.required": "Tax classification is required",
    }),
  taxClassificationOther: Joi.string()
    .trim()
    .max(100)
    .when("taxClassification", {
      is: "other",
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.max":
        "Tax classification description must not exceed 100 characters",
      "any.required":
        'Tax classification description is required when "other" is selected',
    }),
  taxId: taxIdSchema,
  address: addressSchema,
  requestorInfo: Joi.object({
    name: Joi.string().trim().max(200).optional(),
    address: addressSchema.optional(),
  }).optional(),
  certifications: Joi.object({
    backupWithholding: Joi.boolean().default(false),
    usPerson: Joi.boolean().default(true),
    correctTin: Joi.boolean().default(true),
    fatcaExempt: Joi.boolean().default(false),
  }).default({}),
  exemptPayeeCodes: Joi.array()
    .items(Joi.string().trim().max(10))
    .max(5)
    .optional()
    .messages({
      "array.max": "Maximum 5 exempt payee codes allowed",
    }),
  fatcaReportingCode: Joi.string().trim().max(10).optional().messages({
    "string.max": "FATCA reporting code must not exceed 10 characters",
  }),
  signature: Joi.string().trim().min(2).max(200).required().messages({
    "string.min": "Signature must be at least 2 characters",
    "string.max": "Signature must not exceed 200 characters",
    "any.required": "Signature is required",
  }),
});
// W-9 form update validation schema (all fields optional except signature if provided)
export const w9UpdateSchema = Joi.object({
  businessName: Joi.string().trim().min(2).max(200).optional().messages({
    "string.min": "Business name must be at least 2 characters",
    "string.max": "Business name must not exceed 200 characters",
  }),
  taxClassification: Joi.string()
    .valid(
      "individual",
      "c-corp",
      "s-corp",
      "partnership",
      "trust",
      "llc",
      "other",
    )
    .optional()
    .messages({
      "any.only":
        "Tax classification must be one of: individual, c-corp, s-corp, partnership, trust, llc, other",
    }),
  taxClassificationOther: Joi.string().trim().max(100).optional().messages({
    "string.max":
      "Tax classification description must not exceed 100 characters",
  }),
  taxId: taxIdSchema.optional(),
  address: addressSchema.optional(),
  requestorInfo: Joi.object({
    name: Joi.string().trim().max(200).optional(),
    address: addressSchema.optional(),
  }).optional(),
  certifications: Joi.object({
    backupWithholding: Joi.boolean().optional(),
    usPerson: Joi.boolean().optional(),
    correctTin: Joi.boolean().optional(),
    fatcaExempt: Joi.boolean().optional(),
  }).optional(),
  exemptPayeeCodes: Joi.array()
    .items(Joi.string().trim().max(10))
    .max(5)
    .optional()
    .messages({
      "array.max": "Maximum 5 exempt payee codes allowed",
    }),
  fatcaReportingCode: Joi.string().trim().max(10).optional().messages({
    "string.max": "FATCA reporting code must not exceed 10 characters",
  }),
  signature: Joi.string().trim().min(2).max(200).optional().messages({
    "string.min": "Signature must be at least 2 characters",
    "string.max": "Signature must not exceed 200 characters",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update",
  });
// Query parameter validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit must not exceed 100",
  }),
});
// Date range validation schema
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    "date.format": "Start date must be in ISO format (YYYY-MM-DD)",
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).optional().messages({
    "date.format": "End date must be in ISO format (YYYY-MM-DD)",
    "date.min": "End date must be after start date",
  }),
});
// Middleware functions for common validations
export const validateRegistration = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateRefreshToken = validate(refreshTokenSchema);
export const validateForgotPassword = validate(forgotPasswordSchema);
export const validateResetPassword = validate(resetPasswordSchema);
export const validateVerifyEmail = validate(verifyEmailSchema);
export const validateUpdateProfile = validate(updateProfileSchema);
export const validateChangePassword = validate(changePasswordSchema);
export const validatePagination = validate(paginationSchema, "query");
export const validateDateRange = validate(dateRangeSchema, "query");
// W-9 form validation middleware
export const validateW9Form = validate(w9FormSchema);
export const validateW9Update = validate(w9UpdateSchema);
// Export validate function for custom usage
export const validateRequest = validate;
/**
 * Sanitize input to prevent XSS attacks
 * @param input Input string to sanitize
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  return input
    .replace(/[<>]/g, "") // Remove < and > characters
    .trim();
};
/**
 * Middleware to sanitize all string inputs in request body
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    const sanitizeObject = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      } else if (obj && typeof obj === "object") {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      } else if (typeof obj === "string") {
        return sanitizeInput(obj);
      }
      return obj;
    };
    req.body = sanitizeObject(req.body);
  }
  next();
};
//# sourceMappingURL=validation.js.map
