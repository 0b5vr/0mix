export const MUSIC_BPM = 140.0;

export const BEAT = 60.0 / MUSIC_BPM;
export const BAR = 240.0 / MUSIC_BPM;
export const SIXTEEN_BAR = 3840.0 / MUSIC_BPM;

export const BLOCK_SIZE = 128;

// == variables for offline ========================================================================
export const MUSIC_LENGTH = 441;

// == variables for realtime =======================================================================
export const BLOCKS_PER_RENDER = 32;
export const FRAMES_PER_RENDER = BLOCK_SIZE * BLOCKS_PER_RENDER;
export const LATENCY_BLOCKS = 64;
