export const CONFIG = {
  // Server settings
  PORT: process.env.PORT || 3000,

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
    },
    SERVER: {
      INIT_STATE: 'INIT_STATE',
      PIXEL_UPDATE: 'PIXEL_UPDATE',
      ERROR: 'ERROR'
    }
  }
};