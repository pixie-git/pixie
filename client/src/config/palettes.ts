// Generated 256 color palette (8-bit generic)
const largePalette = Array.from({ length: 256 }, (_, i) => {
    if (i === 0) return '#FFFFFF';
    if (i === 1) return '#000000';
    const r = Math.floor((i * 137.5) % 255);
    const g = Math.floor((i * 50) % 255);
    const b = Math.floor((i * 200) % 255);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
});

export const PALETTES: Record<string, string[]> = {
    default: [
        '#FFFFFF', '#000000', '#1D2B53', '#7E2553',
        '#008751', '#AB5236', '#5F574F', '#C2C3C7',
        '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27',
        '#00E436', '#29ADFF', '#83769C', '#FF77A8'
    ],
    retro: [
        '#FFFFFF', '#0f380f', '#306230', '#8bac0f', '#9bbc0f', // 0: White, then Gameboy
        '#0f380f', '#306230', '#8bac0f', '#9bbc0f',
        '#0f380f', '#306230', '#8bac0f', '#9bbc0f',
        '#0f380f', '#306230'
    ],
    neon: [
        '#FFFFFF', '#000000', '#FF00FF', '#00FFFF', // 0: White (Swapped)
        '#00FF00', '#FFFF00', '#FF0000', '#7B00FF',
        '#FF1493', '#00CED1', '#32CD32', '#FFD700',
        '#FF4500', '#9400D3', '#1E90FF', '#FF69B4'
    ],
    large: largePalette
};

export const getPalette = (name: string): string[] => {
    return PALETTES[name] || PALETTES['default'];
};
