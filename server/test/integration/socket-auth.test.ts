import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { io as Client } from 'socket.io-client';
import { CONFIG } from '../../src/config.js';
import jwt from 'jsonwebtoken';
import { createTestServer } from './utils/socket-test-utils.js';

describe('Socket.IO Authentication Integration', () => {
    let io: Server;
    let httpServer: HTTPServer;
    let port: number;

    const validUser = { id: 'user-auth-123', username: 'TestUser' };

    beforeAll(async () => {
        const testServerParams = await createTestServer();
        io = testServerParams.io;
        httpServer = testServerParams.httpServer;
        port = testServerParams.port;
    });

    afterAll(() => {
        io.close();
        httpServer.close();
    });

    it("should reject connection when no token is provided", () => {
        return new Promise<void>((resolve, reject) => {
            const clientSocket = Client(`http://localhost:${port}`, {
                reconnection: false,
            });

            clientSocket.on("connect_error", (err) => {
                try {
                    expect(err.message).toBe("Authentication error: No token provided");
                    clientSocket.disconnect();
                    resolve();
                } catch (e) {
                    clientSocket.disconnect();
                    reject(e);
                }
            });

            clientSocket.on("connect", () => {
                clientSocket.disconnect();
                reject(new Error("Should not connect successfully without a token"));
            });
        });
    });

    it("should reject connection when an invalid/tampered token is provided", () => {
        return new Promise<void>((resolve, reject) => {
            const clientSocket = Client(`http://localhost:${port}`, {
                auth: {
                    token: "invalid.tampered.token"
                },
                reconnection: false,
            });

            clientSocket.on("connect_error", (err) => {
                try {
                    expect(err.message).toBe("Authentication error: Invalid token");
                    clientSocket.disconnect();
                    resolve();
                } catch (e) {
                    clientSocket.disconnect();
                    reject(e);
                }
            });

            clientSocket.on("connect", () => {
                clientSocket.disconnect();
                reject(new Error("Should not connect successfully with an invalid token"));
            });
        });
    });

    it("should reject connection when an expired token is provided", () => {
        return new Promise<void>((resolve, reject) => {
            const expiredToken = jwt.sign(
                validUser,
                CONFIG.JWT.SECRET,
                { expiresIn: "-1h" }
            );

            const clientSocket = Client(`http://localhost:${port}`, {
                auth: {
                    token: expiredToken
                },
                reconnection: false,
            });

            clientSocket.on("connect_error", (err) => {
                try {
                    expect(err.message).toBe("Authentication error: Invalid token");
                    clientSocket.disconnect();
                    resolve();
                } catch (e) {
                    clientSocket.disconnect();
                    reject(e);
                }
            });

            clientSocket.on("connect", () => {
                clientSocket.disconnect();
                reject(new Error("Should not connect successfully with an expired token"));
            });
        });
    });

    it("should successfully connect when a valid token is provided", () => {
        return new Promise<void>((resolve, reject) => {
            const validToken = jwt.sign(
                validUser,
                CONFIG.JWT.SECRET,
                { expiresIn: "1h" }
            );

            const clientSocket = Client(`http://localhost:${port}`, {
                auth: {
                    token: validToken
                },
                reconnection: false,
            });

            clientSocket.on("connect", () => {
                clientSocket.disconnect();
                resolve();
            });

            clientSocket.on("connect_error", (err) => {
                clientSocket.disconnect();
                reject(new Error(`Should connect successfully, but got error: ${err.message}`));
            });
        });
    });
});
