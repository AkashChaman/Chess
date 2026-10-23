// Standard high-fidelity Staunton Chess Vector SVG Definitions
// Optimized inline SVG strings for crystal-clear rendering at any DPR

const PIECE_SVGS = {
  // WHITE PIECES
  'wP': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      fill="#ffffff" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'wR': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
      <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
      <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
      <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
      <path d="M 11,14 L 34,14" stroke-width="1" />
    </g>
  </svg>`,

  'wN': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.07,8.07 19.5,8 C 21,8 21.5,9.5 22,10 z" />
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#1c1c1c" />
      <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#1c1c1c" />
    </g>
  </svg>`,

  'wB': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
      <path d="M 12,36 C 12.27,34.01 12.5,33 13.5,31.5 C 14.5,30 16.5,27 16.5,27 C 16.5,27 15.5,25 15.5,23 C 15.5,19 18,17 19.5,15 C 19.5,15 20,9 22.5,8 C 25,9 25.5,15 25.5,15 C 27,17 29.5,19 29.5,23 C 29.5,25 28.5,27 28.5,27 C 28.5,27 30.5,30 31.5,31.5 C 32.5,33 32.73,34.01 33,36" />
      <path d="M 22.5,10 L 22.5,13" />
      <path d="M 21,11.5 L 24,11.5" />
      <circle cx="22.5" cy="5.5" r="2.5" />
      <path d="m 17.5,26 h 10 C 27.5,26 27,24 26,23.5 C 25,23 23,24 22.5,24 C 22,24 20,23 19,23.5 C 18,24 17.5,26 17.5,26 z" />
    </g>
  </svg>`,

  'wQ': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9 13 A 2 2 0 1 1 5,13 A 2 2 0 1 1 9 13 z" />
      <path d="M 24.5 9 A 2 2 0 1 1 20.5,9 A 2 2 0 1 1 24.5 9 z" />
      <path d="M 40 13 A 2 2 0 1 1 36,13 A 2 2 0 1 1 40 13 z" />
      <path d="M 17 10.5 A 2 2 0 1 1 13,10.5 A 2 2 0 1 1 17 10.5 z" />
      <path d="M 32 10.5 A 2 2 0 1 1 28,10.5 A 2 2 0 1 1 32 10.5 z" />
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z" />
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
      <path d="M 11.5,30 C 15,29 30,29 33.5,30" />
      <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" />
    </g>
  </svg>`,

  'wK': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#ffffff" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22.5,11.63 L 22.5,6" />
      <path d="M 20,8 L 25,8" />
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,34 38,30 38,26.5 C 38,20 33,16 28.5,17 C 27.5,17.2 25.5,18.5 25.5,18.5 C 25.5,18.5 23.5,17.2 22.5,17 C 18,16 13,20 13,26.5 C 13,30 14.5,34 11.5,37 z" />
      <path d="M 11.5,30 C 17,27 28,27 33.5,30" />
      <path d="M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5" />
      <path d="M 11.5,37 C 17,34 28,34 33.5,37" />
    </g>
  </svg>`,

  // BLACK PIECES
  'bP': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
      fill="#282828" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="m 12,36 c 5,-1.5 16,-1.5 21,0" stroke="#f0f0f0" stroke-width="1.2" fill="none"/>
  </svg>`,

  'bR': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#282828" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
      <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
      <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
      <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
    </g>
    <path d="M 14,17 L 31,17 M 13,31.5 L 32,31.5 M 12,36 L 33,36" stroke="#f0f0f0" stroke-width="1.2" fill="none" />
  </svg>`,

  'bN': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#282828" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
      <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.07,8.07 19.5,8 C 21,8 21.5,9.5 22,10 z" />
      <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" fill="#f0f0f0" />
      <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" fill="#f0f0f0" />
    </g>
  </svg>`,

  'bB': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#282828" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
      <path d="M 12,36 C 12.27,34.01 12.5,33 13.5,31.5 C 14.5,30 16.5,27 16.5,27 C 16.5,27 15.5,25 15.5,23 C 15.5,19 18,17 19.5,15 C 19.5,15 20,9 22.5,8 C 25,9 25.5,15 25.5,15 C 27,17 29.5,19 29.5,23 C 29.5,25 28.5,27 28.5,27 C 28.5,27 30.5,30 31.5,31.5 C 32.5,33 32.73,34.01 33,36" />
      <circle cx="22.5" cy="5.5" r="2.5" />
    </g>
    <path d="M 17.5,26 L 27.5,26" stroke="#f0f0f0" stroke-width="1.2" />
    <path d="M 22.5,10 L 22.5,13 M 21,11.5 L 24,11.5" stroke="#f0f0f0" stroke-width="1.2" />
  </svg>`,

  'bQ': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#282828" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 9 13 A 2 2 0 1 1 5,13 A 2 2 0 1 1 9 13 z" />
      <path d="M 24.5 9 A 2 2 0 1 1 20.5,9 A 2 2 0 1 1 24.5 9 z" />
      <path d="M 40 13 A 2 2 0 1 1 36,13 A 2 2 0 1 1 40 13 z" />
      <path d="M 17 10.5 A 2 2 0 1 1 13,10.5 A 2 2 0 1 1 17 10.5 z" />
      <path d="M 32 10.5 A 2 2 0 1 1 28,10.5 A 2 2 0 1 1 32 10.5 z" />
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 L 9,26 z" />
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" />
    </g>
    <path d="M 11.5,30 C 15,29 30,29 33.5,30 M 12,33.5 C 18,32.5 27,32.5 33,33.5" stroke="#f0f0f0" stroke-width="1.2" fill="none" />
  </svg>`,

  'bK': `<svg viewBox="0 0 45 45" class="chess-piece-svg" xmlns="http://www.w3.org/2000/svg">
    <g fill="#282828" stroke="#1c1c1c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 22.5,11.63 L 22.5,6" />
      <path d="M 20,8 L 25,8" />
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" />
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,34 38,30 38,26.5 C 38,20 33,16 28.5,17 C 27.5,17.2 25.5,18.5 25.5,18.5 C 25.5,18.5 23.5,17.2 22.5,17 C 18,16 13,20 13,26.5 C 13,30 14.5,34 11.5,37 z" />
    </g>
    <path d="M 11.5,30 C 17,27 28,27 33.5,30 M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5 M 11.5,37 C 17,34 28,34 33.5,37" stroke="#f0f0f0" stroke-width="1.2" fill="none" />
    <path d="M 20,8 L 25,8 M 22.5,6 L 22.5,11" stroke="#f0f0f0" stroke-width="1.2" />
  </svg>`
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PIECE_SVGS };
}
