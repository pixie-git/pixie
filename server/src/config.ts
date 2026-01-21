export const CONFIG = {
  // Server settings
  PORT: process.env.PORT || 3000,

  // Game Logic settings
  CANVAS: {
    WIDTH: 64,
    HEIGHT: 64,
  },

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