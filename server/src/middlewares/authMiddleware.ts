import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-key";

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    console.log("[DEBUG] AuthMiddleware: Request received for", req.originalUrl);
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        console.log("[DEBUG] AuthMiddleware: No token found");
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
            console.log("[DEBUG] AuthMiddleware: Invalid token", err.message);
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        console.log("[DEBUG] AuthMiddleware: Token valid for user", user?.username);
        req.user = user;
        next();
    });
};
