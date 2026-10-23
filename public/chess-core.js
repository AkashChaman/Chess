/**
 * Complete, self-contained FIDE Chess Rule Engine
 * Handles:
 * - 8x8 Board representation
 * - Strict turn-based alternation (White first, then Black)
 * - Piece movement rules (P, N, B, R, Q, K)
 * - Advanced mechanics:
 *    - Castling (Kingside & Queenside, path clear, no check, king & rook haven't moved)
 *    - En Passant (strictly within 1 ply after 2-square pawn jump)
 *    - Pawn Promotion (Queen, Rook, Bishop, Knight)
 * - Check detection, Checkmate, Stalemate, Insufficient Material, 50-Move rule
 * - Standard Algebraic Notation (SAN) generation (e.g., e4, Nf3, O-O, exd5, Qh5#)
 * - FEN string export & import
 */

class ChessEngine {
  constructor() {
    this.reset();
  }

  reset() {
    // 8x8 board, index [row][col] where row 0 = rank 8 (black side), row 7 = rank 1 (white side)
    // Pieces represented as { color: 'w'|'b', type: 'p'|'n'|'b'|'r'|'q'|'k' }
    this.board = Array(8).fill(null).map(() => Array(8).fill(null));
    this.turn = 'w'; // 'w' | 'b'
    this.castling = {
      w: { k: true, q: true },
      b: { k: true, q: true }
    };
    this.enPassantSquare = null; // { row, col } or null
    this.halfmoveClock = 0; // 50-move rule counter
    this.fullmoveNumber = 1;
    this.moveHistory = []; // list of executed moves with SAN, captures, etc.
    this.positionCounts = new Map(); // for threefold repetition

    this.setupInitialPosition();
  }

  setupInitialPosition() {
    const backRank = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
    for (let c = 0; c < 8; c++) {
      this.board[0][c] = { color: 'b', type: backRank[c] };
      this.board[1][c] = { color: 'b', type: 'p' };
      this.board[6][c] = { color: 'w', type: 'p' };
      this.board[7][c] = { color: 'w', type: backRank[c] };
    }
  }

  static squareToCoords(sq) {
    if (!sq || sq.length < 2) return null;
    const col = sq.charCodeAt(0) - 97;
    const row = 8 - parseInt(sq[1], 10);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return { row, col };
  }

  static coordsToSquare(row, col) {
    return String.fromCharCode(97 + col) + (8 - row);
  }

  getPiece(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return this.board[row][col];
  }

  cloneState() {
    const next = new ChessEngine();
    next.board = this.board.map(r => r.map(p => p ? { ...p } : null));
    next.turn = this.turn;
    next.castling = {
      w: { ...this.castling.w },
      b: { ...this.castling.b }
    };
    next.enPassantSquare = this.enPassantSquare ? { ...this.enPassantSquare } : null;
    next.halfmoveClock = this.halfmoveClock;
    next.fullmoveNumber = this.fullmoveNumber;
    return next;
  }

  // Find King coordinates for a specific color
  findKing(color) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.color === color && p.type === 'k') {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  // Determine if a square is attacked by opponent
  isSquareAttacked(targetRow, targetCol, attackingColor) {
    // 1. Pawn attacks
    const pawnRowOffset = attackingColor === 'w' ? 1 : -1;
    const pawnRow = targetRow + pawnRowOffset;
    for (const cOffset of [-1, 1]) {
      const pCol = targetCol + cOffset;
      if (pCol >= 0 && pCol < 8 && pawnRow >= 0 && pawnRow < 8) {
        const p = this.board[pawnRow][pCol];
        if (p && p.color === attackingColor && p.type === 'p') {
          return true;
        }
      }
    }

    // 2. Knight attacks
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (const [dr, dc] of knightMoves) {
      const nr = targetRow + dr;
      const nc = targetCol + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = this.board[nr][nc];
        if (p && p.color === attackingColor && p.type === 'n') {
          return true;
        }
      }
    }

    // 3. Bishop / Queen diagonal rays
    const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of diagDirs) {
      let nr = targetRow + dr;
      let nc = targetCol + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = this.board[nr][nc];
        if (p) {
          if (p.color === attackingColor && (p.type === 'b' || p.type === 'q')) {
            return true;
          }
          break; // ray blocked
        }
        nr += dr;
        nc += dc;
      }
    }

    // 4. Rook / Queen orthogonal rays
    const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of orthoDirs) {
      let nr = targetRow + dr;
      let nc = targetCol + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = this.board[nr][nc];
        if (p) {
          if (p.color === attackingColor && (p.type === 'r' || p.type === 'q')) {
            return true;
          }
          break; // ray blocked
        }
        nr += dr;
        nc += dc;
      }
    }

    // 5. King attacks (adjacent 1-step)
    const kingDirs = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    for (const [dr, dc] of kingDirs) {
      const nr = targetRow + dr;
      const nc = targetCol + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = this.board[nr][nc];
        if (p && p.color === attackingColor && p.type === 'k') {
          return true;
        }
      }
    }

    return false;
  }

  isInCheck(color = this.turn) {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;
    const opponent = color === 'w' ? 'b' : 'w';
    return this.isSquareAttacked(kingPos.row, kingPos.col, opponent);
  }

  // Generate pseudo-legal moves for a piece at (r, c)
  getPseudoLegalMoves(r, c) {
    const piece = this.board[r][c];
    if (!piece) return [];

    const moves = [];
    const color = piece.color;
    const opp = color === 'w' ? 'b' : 'w';

    const addMove = (toR, toC, flags = {}) => {
      moves.push({
        from: { row: r, col: c },
        to: { row: toR, col: toC },
        piece: piece.type,
        color,
        captured: this.board[toR][toC],
        flags
      });
    };

    if (piece.type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      const promoRow = color === 'w' ? 0 : 7;

      // 1-step forward
      const f1R = r + dir;
      if (f1R >= 0 && f1R < 8 && !this.board[f1R][c]) {
        if (f1R === promoRow) {
          ['q', 'r', 'b', 'n'].forEach(promo => {
            addMove(f1R, c, { promotion: promo });
          });
        } else {
          addMove(f1R, c, {});
        }

        // 2-step forward
        const f2R = r + dir * 2;
        if (r === startRow && !this.board[f2R][c]) {
          addMove(f2R, c, { doublePush: true });
        }
      }

      // Diagonal captures
      for (const dc of [-1, 1]) {
        const capC = c + dc;
        if (capC >= 0 && capC < 8) {
          const capTarget = this.board[f1R][capC];
          if (capTarget && capTarget.color === opp) {
            if (f1R === promoRow) {
              ['q', 'r', 'b', 'n'].forEach(promo => {
                addMove(f1R, capC, { promotion: promo });
              });
            } else {
              addMove(f1R, capC, {});
            }
          } else if (
            this.enPassantSquare &&
            this.enPassantSquare.row === f1R &&
            this.enPassantSquare.col === capC
          ) {
            // En passant capture!
            moves.push({
              from: { row: r, col: c },
              to: { row: f1R, col: capC },
              piece: 'p',
              color,
              captured: { color: opp, type: 'p' },
              flags: { enPassant: true }
            });
          }
        }
      }
    } else if (piece.type === 'n') {
      const knightDeltas = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      for (const [dr, dc] of knightDeltas) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = this.board[nr][nc];
          if (!target || target.color === opp) {
            addMove(nr, nc, {});
          }
        }
      }
    } else if (piece.type === 'b' || piece.type === 'r' || piece.type === 'q') {
      const dirs = [];
      if (piece.type === 'b' || piece.type === 'q') {
        dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (piece.type === 'r' || piece.type === 'q') {
        dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }

      for (const [dr, dc] of dirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = this.board[nr][nc];
          if (!target) {
            addMove(nr, nc, {});
          } else {
            if (target.color === opp) {
              addMove(nr, nc, {});
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }
    } else if (piece.type === 'k') {
      const dirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = this.board[nr][nc];
          if (!target || target.color === opp) {
            addMove(nr, nc, {});
          }
        }
      }

      // Castling logic
      // King cannot castle if in check, or if squares traversed are attacked
      const baseRow = color === 'w' ? 7 : 0;
      if (r === baseRow && c === 4 && !this.isInCheck(color)) {
        // Kingside castling
        if (this.castling[color].k) {
          const f1 = this.board[baseRow][5];
          const g1 = this.board[baseRow][6];
          const rook = this.board[baseRow][7];
          if (
            !f1 && !g1 &&
            rook && rook.type === 'r' && rook.color === color &&
            !this.isSquareAttacked(baseRow, 5, opp) &&
            !this.isSquareAttacked(baseRow, 6, opp)
          ) {
            moves.push({
              from: { row: r, col: 4 },
              to: { row: baseRow, col: 6 },
              piece: 'k',
              color,
              captured: null,
              flags: { castling: 'k' }
            });
          }
        }

        // Queenside castling
        if (this.castling[color].q) {
          const d1 = this.board[baseRow][3];
          const c1 = this.board[baseRow][2];
          const b1 = this.board[baseRow][1];
          const rook = this.board[baseRow][0];
          if (
            !d1 && !c1 && !b1 &&
            rook && rook.type === 'r' && rook.color === color &&
            !this.isSquareAttacked(baseRow, 3, opp) &&
            !this.isSquareAttacked(baseRow, 2, opp)
          ) {
            moves.push({
              from: { row: r, col: 4 },
              to: { row: baseRow, col: 2 },
              piece: 'k',
              color,
              captured: null,
              flags: { castling: 'q' }
            });
          }
        }
      }
    }

    return moves;
  }

  // Get all strictly legal moves for the piece at (r, c)
  getLegalMovesForSquare(r, c) {
    const piece = this.board[r][c];
    if (!piece || piece.color !== this.turn) return [];

    const pseudoMoves = this.getPseudoLegalMoves(r, c);
    return pseudoMoves.filter(move => {
      // Simulate move and verify king is NOT in check
      return this.isMoveLegal(move);
    });
  }

  // Get all legal moves for current player
  getAllLegalMoves(color = this.turn) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = this.board[r][c];
        if (piece && piece.color === color) {
          const pieceMoves = this.getLegalMovesForSquare(r, c);
          moves.push(...pieceMoves);
        }
      }
    }
    return moves;
  }

  isMoveLegal(move) {
    const sim = this.cloneState();
    sim.applyMoveSim(move);
    return !sim.isInCheck(move.color);
  }

  applyMoveSim(move) {
    const { from, to, flags } = move;
    const piece = this.board[from.row][from.col];

    // Standard piece placement
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;

    // En passant capture removal
    if (flags.enPassant) {
      const oppPawnRow = from.row; // same row as moving pawn
      this.board[oppPawnRow][to.col] = null;
    }

    // Castling rook move
    if (flags.castling === 'k') {
      const rook = this.board[from.row][7];
      this.board[from.row][5] = rook;
      this.board[from.row][7] = null;
    } else if (flags.castling === 'q') {
      const rook = this.board[from.row][0];
      this.board[from.row][3] = rook;
      this.board[from.row][0] = null;
    }

    // Pawn promotion
    if (flags.promotion) {
      this.board[to.row][to.col] = {
        color: piece.color,
        type: flags.promotion
      };
    }
  }

  // Execute a fully legal move on the board
  makeMove(moveObj) {
    // moveObj can be { from: {row, col}, to: {row, col}, promotion: 'q' }
    // or { from: 'e2', to: 'e4', promotion: 'q' }
    let from = moveObj.from;
    let to = moveObj.to;
    if (typeof from === 'string') from = ChessEngine.squareToCoords(from);
    if (typeof to === 'string') to = ChessEngine.squareToCoords(to);

    const legalMoves = this.getLegalMovesForSquare(from.row, from.col);
    const matched = legalMoves.find(m => {
      if (m.to.row !== to.row || m.to.col !== to.col) return false;
      if (m.flags.promotion) {
        const targetPromo = moveObj.promotion ? moveObj.promotion.toLowerCase() : 'q';
        return m.flags.promotion === targetPromo;
      }
      return true;
    });

    if (!matched) {
      return null; // Illegal move
    }

    // Generate SAN notation before state mutation
    const san = this.generateSAN(matched);

    // Apply the move
    const movingPiece = this.board[from.row][from.col];
    const targetPiece = this.board[to.row][to.col];
    const isPawnMove = movingPiece.type === 'p';
    const isCapture = !!targetPiece || !!matched.flags.enPassant;

    this.applyMoveSim(matched);

    // Update Castling rights if King or Rook moved or was captured
    if (movingPiece.type === 'k') {
      this.castling[movingPiece.color].k = false;
      this.castling[movingPiece.color].q = false;
    } else if (movingPiece.type === 'r') {
      if (from.row === 7 && from.col === 7) this.castling.w.k = false;
      if (from.row === 7 && from.col === 0) this.castling.w.q = false;
      if (from.row === 0 && from.col === 7) this.castling.b.k = false;
      if (from.row === 0 && from.col === 0) this.castling.b.q = false;
    }

    // If opponent rook captured on original square
    if (to.row === 7 && to.col === 7) this.castling.w.k = false;
    if (to.row === 7 && to.col === 0) this.castling.w.q = false;
    if (to.row === 0 && to.col === 7) this.castling.b.k = false;
    if (to.row === 0 && to.col === 0) this.castling.b.q = false;

    // En Passant target square
    if (matched.flags.doublePush) {
      const epRow = (from.row + to.row) / 2;
      this.enPassantSquare = { row: epRow, col: from.col };
    } else {
      this.enPassantSquare = null;
    }

    // 50-move halfmove clock
    if (isPawnMove || isCapture) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock++;
    }

    if (this.turn === 'b') {
      this.fullmoveNumber++;
    }

    // Switch turn
    this.turn = this.turn === 'w' ? 'b' : 'w';

    // Checkmate / check annotation for SAN
    let finalSAN = san;
    const opponentInCheck = this.isInCheck(this.turn);
    const opponentLegalMoves = this.getAllLegalMoves(this.turn);

    if (opponentLegalMoves.length === 0) {
      if (opponentInCheck) {
        finalSAN += '#';
      }
    } else if (opponentInCheck) {
      finalSAN += '+';
    }

    const executedRecord = {
      fromSquare: ChessEngine.coordsToSquare(from.row, from.col),
      toSquare: ChessEngine.coordsToSquare(to.row, to.col),
      from: { ...from },
      to: { ...to },
      piece: movingPiece.type,
      color: movingPiece.color,
      captured: matched.flags.enPassant ? { color: this.turn, type: 'p' } : targetPiece,
      san: finalSAN,
      flags: matched.flags,
      fen: this.getFEN()
    };

    this.moveHistory.push(executedRecord);
    return executedRecord;
  }

  generateSAN(move) {
    if (move.flags.castling === 'k') return 'O-O';
    if (move.flags.castling === 'q') return 'O-O-O';

    const piece = this.board[move.from.row][move.from.col];
    const isCapture = !!this.board[move.to.row][move.to.col] || !!move.flags.enPassant;
    const toSq = ChessEngine.coordsToSquare(move.to.row, move.to.col);

    if (piece.type === 'p') {
      let str = '';
      if (isCapture) {
        str += ChessEngine.coordsToSquare(move.from.row, move.from.col)[0] + 'x';
      }
      str += toSq;
      if (move.flags.promotion) {
        str += '=' + move.flags.promotion.toUpperCase();
      }
      return str;
    }

    const pieceLetter = piece.type.toUpperCase();
    let disambiguation = '';

    // Disambiguation if another piece of the same type can move to the same square
    const candidates = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (r === move.from.row && c === move.from.col) continue;
        const p = this.board[r][c];
        if (p && p.color === piece.color && p.type === piece.type) {
          const lMoves = this.getLegalMovesForSquare(r, c);
          if (lMoves.some(m => m.to.row === move.to.row && m.to.col === move.to.col)) {
            candidates.push({ row: r, col: c });
          }
        }
      }
    }

    if (candidates.length > 0) {
      const sameCol = candidates.some(c => c.col === move.from.col);
      const sameRow = candidates.some(c => c.row === move.from.row);

      if (!sameCol) {
        disambiguation = ChessEngine.coordsToSquare(move.from.row, move.from.col)[0];
      } else if (!sameRow) {
        disambiguation = ChessEngine.coordsToSquare(move.from.row, move.from.col)[1];
      } else {
        disambiguation = ChessEngine.coordsToSquare(move.from.row, move.from.col);
      }
    }

    return pieceLetter + disambiguation + (isCapture ? 'x' : '') + toSq;
  }

  getGameStatus() {
    const legalMoves = this.getAllLegalMoves(this.turn);
    const inCheck = this.isInCheck(this.turn);

    if (legalMoves.length === 0) {
      if (inCheck) {
        const winner = this.turn === 'w' ? 'black' : 'white';
        return { isGameOver: true, isCheckmate: true, isDraw: false, winner, reason: 'checkmate' };
      } else {
        return { isGameOver: true, isCheckmate: false, isDraw: true, winner: null, reason: 'stalemate' };
      }
    }

    if (this.halfmoveClock >= 100) {
      return { isGameOver: true, isCheckmate: false, isDraw: true, winner: null, reason: '50-move rule' };
    }

    if (this.hasInsufficientMaterial()) {
      return { isGameOver: true, isCheckmate: false, isDraw: true, winner: null, reason: 'insufficient material' };
    }

    return {
      isGameOver: false,
      isCheckmate: false,
      isDraw: false,
      isCheck: inCheck,
      winner: null
    };
  }

  hasInsufficientMaterial() {
    let pieces = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p) pieces.push({ ...p, r, c });
      }
    }

    // K vs K
    if (pieces.length === 2) return true;

    // K+B vs K or K+N vs K
    if (pieces.length === 3) {
      const nonKing = pieces.find(p => p.type !== 'k');
      if (nonKing && (nonKing.type === 'b' || nonKing.type === 'n')) {
        return true;
      }
    }

    // K+B vs K+B with bishops on same color
    if (pieces.length === 4) {
      const bishops = pieces.filter(p => p.type === 'b');
      if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
        const sq1Color = (bishops[0].r + bishops[0].c) % 2;
        const sq2Color = (bishops[1].r + bishops[1].c) % 2;
        if (sq1Color === sq2Color) return true;
      }
    }

    return false;
  }

  getCapturedPieces() {
    const initial = {
      w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
      b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
    };
    const current = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
    };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (p && p.type !== 'k') {
          current[p.color][p.type]++;
        }
      }
    }

    const capturedByWhite = [];
    const capturedByBlack = [];

    const order = ['q', 'r', 'b', 'n', 'p'];
    for (const t of order) {
      const bDiff = initial.b[t] - current.b[t];
      for (let i = 0; i < bDiff; i++) capturedByWhite.push('b' + t.toUpperCase());

      const wDiff = initial.w[t] - current.w[t];
      for (let i = 0; i < wDiff; i++) capturedByBlack.push('w' + t.toUpperCase());
    }

    // Calculate material value advantage (P=1, N=3, B=3, R=5, Q=9)
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    let wScore = 0;
    let bScore = 0;
    for (const t of order) {
      wScore += current.w[t] * values[t];
      bScore += current.b[t] * values[t];
    }
    const materialAdvantage = wScore - bScore; // > 0 means White leads, < 0 means Black leads

    return { capturedByWhite, capturedByBlack, materialAdvantage };
  }

  getFEN() {
    const rows = [];
    for (let r = 0; r < 8; r++) {
      let empty = 0;
      let rowStr = '';
      for (let c = 0; c < 8; c++) {
        const p = this.board[r][c];
        if (!p) {
          empty++;
        } else {
          if (empty > 0) {
            rowStr += empty;
            empty = 0;
          }
          rowStr += p.color === 'w' ? p.type.toUpperCase() : p.type.toLowerCase();
        }
      }
      if (empty > 0) rowStr += empty;
      rows.push(rowStr);
    }

    let castlingStr = '';
    if (this.castling.w.k) castlingStr += 'K';
    if (this.castling.w.q) castlingStr += 'Q';
    if (this.castling.b.k) castlingStr += 'k';
    if (this.castling.b.q) castlingStr += 'q';
    if (!castlingStr) castlingStr = '-';

    const epStr = this.enPassantSquare
      ? ChessEngine.coordsToSquare(this.enPassantSquare.row, this.enPassantSquare.col)
      : '-';

    return `${rows.join('/')} ${this.turn} ${castlingStr} ${epStr} ${this.halfmoveClock} ${this.fullmoveNumber}`;
  }

  loadFEN(fen) {
    const parts = fen.trim().split(/\s+/);
    if (parts.length < 4) return false;

    const [boardPart, turnPart, castlingPart, epPart, halfPart, fullPart] = parts;
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));

    const rows = boardPart.split('/');
    if (rows.length !== 8) return false;

    for (let r = 0; r < 8; r++) {
      let c = 0;
      for (const char of rows[r]) {
        if (char >= '1' && char <= '8') {
          c += parseInt(char, 10);
        } else {
          const isWhite = char === char.toUpperCase();
          newBoard[r][c] = {
            color: isWhite ? 'w' : 'b',
            type: char.toLowerCase()
          };
          c++;
        }
      }
    }

    this.board = newBoard;
    this.turn = turnPart === 'b' ? 'b' : 'w';
    this.castling = {
      w: { k: castlingPart.includes('K'), q: castlingPart.includes('Q') },
      b: { k: castlingPart.includes('k'), q: castlingPart.includes('q') }
    };
    this.enPassantSquare = epPart !== '-' ? ChessEngine.squareToCoords(epPart) : null;
    this.halfmoveClock = halfPart ? parseInt(halfPart, 10) : 0;
    this.fullmoveNumber = fullPart ? parseInt(fullPart, 10) : 1;

    return true;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChessEngine };
}
