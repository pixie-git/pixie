import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
import { Lobby } from "../models/Lobby.js";
import { LobbyService } from "../services/lobby.service.js";
import { AppError } from "../utils/AppError.js";

/**
 * Middleware to check if the user is a System Administrator.
 */
export const requireSysAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return next(new AppError("Access denied. System Administrator privileges required.", 403));
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
      throw new AppError("Invalid request data", 400);
    }

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      throw new AppError("Lobby not found", 404);
    }

    // Check if user is owner OR sysadmin (SysAdmins can manage everything)
    if (lobby.owner?.toString() !== userId && !req.user.isAdmin) {
      throw new AppError("Access denied. You are not the owner of this lobby.", 403);
    }

    next();
  } catch (error) {
    next(error);
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
      throw new AppError("Invalid request data", 400);
    }

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) {
      throw new AppError("Lobby not found", 404);
    }

    // reused logic from Service
    try {
      LobbyService.validateJoinAccess(lobby, userId);
    } catch (e: any) {
      throw new AppError(e.message, 403);
    }

    // If we implement private lobbies in the future, check allowedUsers here
    // For now, just check ban status

    next();
  } catch (error) {
    next(error);
  }
};
