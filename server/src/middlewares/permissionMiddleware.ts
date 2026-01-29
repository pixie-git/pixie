import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
import { Lobby } from "../models/Lobby.js";
import { Types } from "mongoose";
import { LobbyService } from "../services/lobby.service.js";

/**
 * Middleware to check if the user is a System Administrator.
 */
export const requireSysAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: "Access denied. System Administrator privileges required." });
    }
    next();
};

/**
 * Middleware to check if the user is the Owner of the Lobby.
 * Assumes req.params.id is the lobby ID.
 */
export const requireLobbyOwner = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const lobbyId = req.params.id;
        const userId = req.user?.id;

        if (!lobbyId || !userId) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        const lobby = await Lobby.findById(lobbyId);
        if (!lobby) {
            return res.status(404).json({ error: "Lobby not found" });
        }

        // Check if user is owner OR sysadmin (SysAdmins can manage everything)
        if (lobby.owner?.toString() !== userId && !req.user.isAdmin) {
            return res.status(403).json({ error: "Access denied. You are not the owner of this lobby." });
        }

        next();
    } catch (error) {
        console.error("[PermissionMiddleware] requireLobbyOwner Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * Middleware to check if the user has access to the Lobby (not banned).
 * Assumes req.params.id is the lobby ID.
 */
export const requireLobbyAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const lobbyId = req.params.id;
        const userId = req.user?.id;

        if (!lobbyId || !userId) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        const lobby = await Lobby.findById(lobbyId);
        if (!lobby) {
            return res.status(404).json({ error: "Lobby not found" });
        }

        // reused logic from Service
        try {
            LobbyService.validateJoinAccess(lobby, userId);
        } catch (e: any) {
            return res.status(403).json({ error: e.message });
        }

        // If we implement private lobbies in the future, check allowedUsers here
        // For now, just check ban status

        next();
    } catch (error) {
        console.error("[PermissionMiddleware] requireLobbyAccess Error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
