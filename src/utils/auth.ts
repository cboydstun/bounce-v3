import jwt from "jsonwebtoken";

if (!process.env.JWT_SECRET) {
    throw new Error("Please add your JWT_SECRET to .env");
}

export const verifyToken = (token: string): boolean => {
    try {
        // Remove "Bearer " prefix if present
        const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;

        // Verify JWT token
        jwt.verify(actualToken, process.env.JWT_SECRET!);
        return true;
    } catch (error) {
        console.error("Token verification failed:", error);
        return false;
    }
};
