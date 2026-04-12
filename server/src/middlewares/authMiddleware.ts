import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import { CONFIG } from "../config.js";

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    // console.log("[DEBUG] AuthMiddleware: Request received for", req.originalUrl);
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
        // console.log("[DEBUG] AuthMiddleware: No token found");
        return next(new AppError("Access token required", 401));
    }

    jwt.verify(token, CONFIG.JWT.SECRET, (err: any, user: any) => {
        if (err) {
            // console.log("[DEBUG] AuthMiddleware: Invalid token", err.message);
            return next(new AppError("Invalid or expired token", 401));
        }
        // console.log("[DEBUG] AuthMiddleware: Token valid for user", user?.username);
        req.user = user;
        next();
    });
};