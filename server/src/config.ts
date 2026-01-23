export const CONFIG = {
  // Server settings
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/pixie",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  JWT: {
    SECRET: process.env.JWT_SECRET || "dev-key",
    EXPIRES_IN: "7d",
  },

  // Game Logic settings
  CANVAS: {
    WIDTH: parseInt(process.env.CANVAS_WIDTH || '64', 10),
    HEIGHT: parseInt(process.env.CANVAS_HEIGHT || '64', 10),
  },

  // Validation
  MAX_COLOR_ID: 15,

  // Socket Events (Contract between Client and Server)
  EVENTS: {
    CLIENT: {
      JOIN_LOBBY: 'JOIN_LOBBY',
      DRAW: 'DRAW',
      DRAW_BATCH: 'DRAW_BATCH',
    },
    SERVER: {
      INIT_STATE: 'INIT_STATE',
      PIXEL_UPDATE: 'PIXEL_UPDATE',
      PIXEL_UPDATE_BATCH: 'PIXEL_UPDATE_BATCH',
      ERROR: 'ERROR'
    }
  }
};