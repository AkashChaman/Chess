const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Server-side memory store of active game rooms
// roomId -> {
//   chess: Chess(),
//   players: { white: socketId, black: socketId },
//   playerNames: { white: string, black: string },
//   rematchVotes: Set<socketId>,
//   created: timestamp
// }
const rooms = new Map();

// Helper to generate unique 6-character alphanumeric room ID
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous characters like 0, O, 1, I
  let roomId;
  do {
    roomId = '';
    for (let i = 0; i < 6; i++) {
      roomId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms.has(roomId));
  return roomId;
}

// Helper to find a room by socket ID
function findRoomBySocketId(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.white === socketId || room.players.black === socketId) {
      return { roomId, room };
    }
  }
  return null;
}

// Helper to compute captured pieces and material count from FEN
function getCapturedPieces(chessInstance) {
  const initialPieces = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
  };
  const currentPieces = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };

  const board = chessInstance.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type !== 'k') {
        currentPieces[piece.color][piece.type]++;
      }
    }
  }

  const capturedByWhite = []; // Black pieces captured
  const capturedByBlack = []; // White pieces captured

  for (const [type, count] of Object.entries(initialPieces.b)) {
    const diff = count - currentPieces.b[type];
    for (let i = 0; i < diff; i++) {
      capturedByWhite.push('b' + type.toUpperCase());
    }
  }

  for (const [type, count] of Object.entries(initialPieces.w)) {
    const diff = count - currentPieces.w[type];
    for (let i = 0; i < diff; i++) {
      capturedByBlack.push('w' + type.toUpperCase());
    }
  }

  return { capturedByWhite, capturedByBlack };
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 1. createGame: Generate 6-char room ID, initialize chess state, join socket, emit room ID
  socket.on('createGame', (payload = {}) => {
    const roomId = generateRoomId();
    const chess = new Chess();
    const playerName = (payload.playerName || 'Player 1').trim().slice(0, 20);

    const room = {
      chess,
      players: {
        white: socket.id,
        black: null
      },
      playerNames: {
        white: playerName,
        black: null
      },
      rematchVotes: new Set(),
      createdAt: Date.now()
    };

    rooms.set(roomId, room);
    socket.join(roomId);

    console.log(`Room created: ${roomId} by ${socket.id} (${playerName})`);

    // Emit confirmation to creator
    socket.emit('gameCreated', {
      roomId,
      color: 'white',
      fen: chess.fen()
    });
  });

  // 2. joinGame: Accept roomId. If room exists & has 1 player, join socket, assign 'black', emit gameStart
  socket.on('joinGame', (payload = {}) => {
    const rawRoomId = (payload.roomId || '').trim().toUpperCase();
    const playerName = (payload.playerName || 'Player 2').trim().slice(0, 20);

    if (!rooms.has(rawRoomId)) {
      socket.emit('joinError', { message: `Room "${rawRoomId}" not found. Please verify the code.` });
      return;
    }

    const room = rooms.get(rawRoomId);

    // If black slot is already taken
    if (room.players.black !== null && room.players.black !== socket.id) {
      socket.emit('joinError', { message: `Room "${rawRoomId}" is already full.` });
      return;
    }

    // Assign black pieces to this joiner
    room.players.black = socket.id;
    room.playerNames.black = playerName;
    socket.join(rawRoomId);

    console.log(`Socket ${socket.id} (${playerName}) joined room ${rawRoomId} as black`);

    // Inform the joined player about their role
    socket.emit('gameJoined', {
      roomId: rawRoomId,
      color: 'black',
      fen: room.chess.fen()
    });

    // Emit gameStart event to the whole room with initial state
    io.to(rawRoomId).emit('gameStart', {
      roomId: rawRoomId,
      fen: room.chess.fen(),
      turn: room.chess.turn() === 'w' ? 'white' : 'black',
      players: {
        white: { id: room.players.white, name: room.playerNames.white },
        black: { id: room.players.black, name: room.playerNames.black }
      }
    });
  });

  // 3. move: Accept room ID & move object ({ from, to, promotion }). Validate, execute, broadcast moveMade
  socket.on('move', (payload = {}) => {
    const { roomId, from, to, promotion } = payload;
    if (!roomId || !rooms.has(roomId)) {
      socket.emit('invalidMove', { message: 'Invalid or missing room.' });
      return;
    }

    const room = rooms.get(roomId);
    const chess = room.chess;

    // Check if it's the sender's turn
    const currentTurnColor = chess.turn() === 'w' ? 'white' : 'black';
    const isSenderWhite = room.players.white === socket.id;
    const isSenderBlack = room.players.black === socket.id;

    if (
      (currentTurnColor === 'white' && !isSenderWhite) ||
      (currentTurnColor === 'black' && !isSenderBlack)
    ) {
      socket.emit('invalidMove', { message: "It's not your turn!" });
      return;
    }

    // Try executing move on chess.js
    let moveResult = null;
    try {
      moveResult = chess.move({
        from,
        to,
        promotion: promotion || 'q'
      });
    } catch (err) {
      socket.emit('invalidMove', { message: 'Illegal move according to chess rules.' });
      return;
    }

    if (!moveResult) {
      socket.emit('invalidMove', { message: 'Illegal move according to chess rules.' });
      return;
    }

    // Check game outcome
    const isGameOver = chess.isGameOver();
    const isCheckmate = chess.isCheckmate();
    const isDraw = chess.isDraw();
    const isStalemate = chess.isStalemate();
    const isThreefold = chess.isThreefoldRepetition ? chess.isThreefoldRepetition() : false;
    const isInsufficient = chess.isInsufficientMaterial ? chess.isInsufficientMaterial() : false;
    const isCheck = chess.inCheck();

    let winner = null;
    let endReason = null;
    if (isCheckmate) {
      winner = chess.turn() === 'w' ? 'black' : 'white';
      endReason = 'checkmate';
    } else if (isStalemate) {
      endReason = 'stalemate';
    } else if (isThreefold) {
      endReason = 'threefold repetition';
    } else if (isInsufficient) {
      endReason = 'insufficient material';
    } else if (isDraw) {
      endReason = '50-move rule';
    }

    const captures = getCapturedPieces(chess);

    // Broadcast moveMade to everyone in the room
    io.to(roomId).emit('moveMade', {
      move: {
        from: moveResult.from,
        to: moveResult.to,
        piece: moveResult.piece,
        color: moveResult.color,
        san: moveResult.san,
        captured: moveResult.captured || null,
        flags: moveResult.flags,
        promotion: moveResult.promotion || null
      },
      fen: chess.fen(),
      turn: chess.turn() === 'w' ? 'white' : 'black',
      history: chess.history({ verbose: true }),
      captures,
      isCheck,
      isGameOver,
      isCheckmate,
      isDraw,
      isStalemate,
      winner,
      endReason
    });
  });

  // Resign feature
  socket.on('resign', (payload = {}) => {
    const { roomId } = payload;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    let winner = null;
    let resigningPlayer = null;

    if (room.players.white === socket.id) {
      winner = 'black';
      resigningPlayer = 'white';
    } else if (room.players.black === socket.id) {
      winner = 'white';
      resigningPlayer = 'black';
    } else {
      return;
    }

    io.to(roomId).emit('gameResigned', {
      winner,
      resigningPlayer,
      message: `${resigningPlayer.toUpperCase()} resigned. ${winner.toUpperCase()} wins!`
    });
  });

  // Rematch feature
  socket.on('requestRematch', (payload = {}) => {
    const { roomId } = payload;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    room.rematchVotes.add(socket.id);

    if (room.rematchVotes.size >= 2) {
      // Both want rematch! Swap colors and restart
      room.chess.reset();
      const prevWhite = room.players.white;
      const prevBlack = room.players.black;
      const prevWhiteName = room.playerNames.white;
      const prevBlackName = room.playerNames.black;

      room.players.white = prevBlack;
      room.players.black = prevWhite;
      room.playerNames.white = prevBlackName;
      room.playerNames.black = prevWhiteName;
      room.rematchVotes.clear();

      io.to(roomId).emit('rematchStarted', {
        fen: room.chess.fen(),
        turn: 'white',
        players: {
          white: { id: room.players.white, name: room.playerNames.white },
          black: { id: room.players.black, name: room.playerNames.black }
        }
      });
    } else {
      socket.to(roomId).emit('rematchOffered', {
        by: socket.id === room.players.white ? 'White' : 'Black'
      });
    }
  });

  // Chat message within room
  socket.on('chatMessage', (payload = {}) => {
    const { roomId, text } = payload;
    if (!roomId || !rooms.has(roomId)) return;

    const room = rooms.get(roomId);
    const senderColor = room.players.white === socket.id ? 'White' : (room.players.black === socket.id ? 'Black' : 'Spectator');
    const senderName = (senderColor === 'White' ? room.playerNames.white : room.playerNames.black) || senderColor;

    io.to(roomId).emit('chatMessage', {
      sender: senderName,
      color: senderColor.toLowerCase(),
      text: String(text).slice(0, 150),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  });

  // 4. disconnect: Identify active room, notify remaining player, clean up room
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const found = findRoomBySocketId(socket.id);
    if (!found) return;

    const { roomId, room } = found;
    const leavingColor = room.players.white === socket.id ? 'white' : 'black';

    // Notify opponent
    socket.to(roomId).emit('opponentDisconnected', {
      color: leavingColor,
      message: `Opponent (${leavingColor}) disconnected.`
    });

    // Remove room after brief grace period (15 seconds) so momentary refresh can be handled if needed
    setTimeout(() => {
      if (rooms.has(roomId)) {
        const curRoom = rooms.get(roomId);
        if (curRoom.players.white === socket.id || curRoom.players.black === socket.id) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} cleaned up after disconnect.`);
        }
      }
    }, 15000);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(` Chess Master Engine & Server is live!`);
  console.log(` Local URL: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
