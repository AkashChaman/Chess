# Chess Master ♟️

A real-time online multiplayer and local turn-based Chess website built with **HTML5, CSS3, Vanilla JavaScript**, and a **Node.js Express + Socket.io** backend validated with `chess.js`.

---

## ✨ Features

- **🎮 Three Game Modes**:
  - **Online Multiplayer**: Real-time room matchmaking with 6-character room codes, 1-click shareable URLs, and live synchronized boards.
  - **Pass & Play**: Local 2-player chess on the same device.
  - **Vs Computer (AI)**: Practice solo with a Minimax AI engine with Alpha-Beta pruning (Casual, Club, and Master difficulties).
- **♟️ Complete FIDE Chess Rules**:
  - Full movement rules for all pieces.
  - Castling (Kingside $O-O$ and Queenside $O-O-O$).
  - En Passant pawn captures.
  - Pawn Promotion modal (Queen, Rook, Bishop, Knight).
  - Check, Checkmate, and Stalemate detection.
- **🎨 Modern Visuals & Aesthetics**:
  - Classic Chess.com theme (`#eeeed2` / `#769656`), Tournament Wood, Midnight Slate, and Neon Cyber themes.
  - High-res Staunton vector SVG pieces.
  - Selected square highlight, subtle legal destination dots, and enemy capture rings.
  - Last-move indicator squares and pulsing King check aura.
- **🔊 Realistic Audio (Zero-Dependency)**:
  - Synthetic Web Audio API sounds for moves, captures, castling, check, and game over.
- **📜 Live Move History & Tracking**:
  - Standard Algebraic Notation (SAN) table with auto-scroll.
  - Captured pieces trays with live material advantage count (+1, +3, etc.).
  - Board flip and resign functionality.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AkashChaman/chess.git
   cd chess
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), Vanilla JavaScript (ES6+).
- **Backend**: Node.js, Express.js.
- **Real-Time Communication**: Socket.io.
- **Validation**: chess.js (server-side rule enforcement).
- **Audio**: Web Audio API (native browser synthesis).

---

## 📂 Project Structure

```
chess/
├── public/
│   ├── index.html       # Application markup & UI layout
│   ├── style.css        # Responsive styling & themes
│   ├── pieces.js        # Staunton SVG chess piece vectors
│   ├── chess-core.js    # FIDE rules engine
│   ├── audio.js         # Web Audio API sound effects
│   ├── ai.js            # Minimax & Alpha-Beta AI engine
│   └── app.js           # Client controller & Socket.io integration
├── server.js            # Express server & Socket.io room logic
├── package.json         # Project metadata & scripts
└── README.md            # Documentation
```

---

## 📄 License

ISC License.
