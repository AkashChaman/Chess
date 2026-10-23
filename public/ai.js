/**
 * Chess AI with Minimax, Alpha-Beta Pruning, and Piece-Square Tables (PST)
 * Allows solo offline play against the computer with selectable difficulty.
 */

class ChessAI {
  constructor(depth = 3) {
    this.depth = depth;

    // Piece values in centipawns
    this.pieceValues = {
      p: 100,
      n: 320,
      b: 330,
      r: 500,
      q: 900,
      k: 20000
    };

    // Simplified Piece-Square Tables (from White's perspective; inverted for Black)
    this.pst = {
      p: [
        [  0,  0,  0,  0,  0,  0,  0,  0 ],
        [ 50, 50, 50, 50, 50, 50, 50, 50 ],
        [ 10, 10, 20, 30, 30, 20, 10, 10 ],
        [  5,  5, 10, 25, 25, 10,  5,  5 ],
        [  0,  0,  0, 20, 20,  0,  0,  0 ],
        [  5, -5,-10,  0,  0,-10, -5,  5 ],
        [  5, 10, 10,-20,-20, 10, 10,  5 ],
        [  0,  0,  0,  0,  0,  0,  0,  0 ]
      ],
      n: [
        [-50,-40,-30,-30,-30,-30,-40,-50 ],
        [-40,-20,  0,  0,  0,  0,-20,-40 ],
        [-30,  0, 10, 15, 15, 10,  0,-30 ],
        [-30,  5, 15, 20, 20, 15,  5,-30 ],
        [-30,  0, 15, 20, 20, 15,  0,-30 ],
        [-30,  5, 10, 15, 15, 10,  5,-30 ],
        [-40,-20,  0,  5,  5,  0,-20,-40 ],
        [-50,-40,-30,-30,-30,-30,-40,-50 ]
      ],
      b: [
        [-20,-10,-10,-10,-10,-10,-10,-20 ],
        [-10,  0,  0,  0,  0,  0,  0,-10 ],
        [-10,  0,  5, 10, 10,  5,  0,-10 ],
        [-10,  5,  5, 10, 10,  5,  5,-10 ],
        [-10,  0, 10, 10, 10, 10,  0,-10 ],
        [-10, 10, 10, 10, 10, 10, 10,-10 ],
        [-10,  5,  0,  0,  0,  0,  5,-10 ],
        [-20,-10,-10,-10,-10,-10,-10,-20 ]
      ],
      r: [
        [  0,  0,  0,  0,  0,  0,  0,  0 ],
        [  5, 10, 10, 10, 10, 10, 10,  5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [ -5,  0,  0,  0,  0,  0,  0, -5 ],
        [  0,  0,  0,  5,  5,  0,  0,  0 ]
      ],
      q: [
        [-20,-10,-10, -5, -5,-10,-10,-20 ],
        [-10,  0,  0,  0,  0,  0,  0,-10 ],
        [-10,  0,  5,  5,  5,  5,  0,-10 ],
        [ -5,  0,  5,  5,  5,  5,  0, -5 ],
        [  0,  0,  5,  5,  5,  5,  0, -5 ],
        [-10,  5,  5,  5,  5,  5,  0,-10 ],
        [-10,  0,  5,  0,  0,  0,  0,-10 ],
        [-20,-10,-10, -5, -5,-10,-10,-20 ]
      ],
      k: [
        [-30,-40,-40,-50,-50,-40,-40,-30 ],
        [-30,-40,-40,-50,-50,-40,-40,-30 ],
        [-30,-40,-40,-50,-50,-40,-40,-30 ],
        [-30,-40,-40,-50,-50,-40,-40,-30 ],
        [-20,-30,-30,-40,-40,-30,-30,-20 ],
        [-10,-20,-20,-20,-20,-20,-20,-10 ],
        [ 20, 20,  0,  0,  0,  0, 20, 20 ],
        [ 20, 30, 10,  0,  0, 10, 30, 20 ]
      ]
    };
  }

  evaluateBoard(engine) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = engine.board[r][c];
        if (!piece) continue;

        const val = this.pieceValues[piece.type];
        const table = this.pst[piece.type];
        const posVal = piece.color === 'w' ? table[r][c] : table[7 - r][c];
        const total = val + posVal;

        if (piece.color === 'w') {
          score += total;
        } else {
          score -= total;
        }
      }
    }
    return score;
  }

  getBestMove(engine, color = 'b', difficulty = 'medium') {
    const allMoves = engine.getAllLegalMoves(color);
    if (allMoves.length === 0) return null;

    if (difficulty === 'easy') {
      // 70% random, 30% capture preference
      const captures = allMoves.filter(m => m.captured);
      if (captures.length > 0 && Math.random() < 0.6) {
        return captures[Math.floor(Math.random() * captures.length)];
      }
      return allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    const searchDepth = difficulty === 'hard' ? 3 : 2;
    const isMaximizing = color === 'w';

    // Move ordering (captures & checks first)
    allMoves.sort((a, b) => {
      const aScore = (a.captured ? this.pieceValues[a.captured.type] : 0) + (a.flags.promotion ? 800 : 0);
      const bScore = (b.captured ? this.pieceValues[b.captured.type] : 0) + (b.flags.promotion ? 800 : 0);
      return bScore - aScore;
    });

    let bestMove = allMoves[0];
    let bestValue = isMaximizing ? -Infinity : Infinity;

    for (const move of allMoves) {
      const sim = engine.cloneState();
      sim.applyMoveSim(move);
      sim.turn = sim.turn === 'w' ? 'b' : 'w';

      const value = this.minimax(sim, searchDepth - 1, -Infinity, Infinity, !isMaximizing);

      if (isMaximizing) {
        if (value > bestValue) {
          bestValue = value;
          bestMove = move;
        }
      } else {
        if (value < bestValue) {
          bestValue = value;
          bestMove = move;
        }
      }
    }

    return bestMove;
  }

  minimax(engine, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
      return this.evaluateBoard(engine);
    }

    const color = isMaximizing ? 'w' : 'b';
    const moves = engine.getAllLegalMoves(color);

    if (moves.length === 0) {
      if (engine.isInCheck(color)) {
        return isMaximizing ? -100000 + (3 - depth) : 100000 - (3 - depth);
      }
      return 0; // stalemate
    }

    // Sort moves for alpha-beta efficiency
    moves.sort((a, b) => {
      const aScore = a.captured ? 1000 : 0;
      const bScore = b.captured ? 1000 : 0;
      return bScore - aScore;
    });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const sim = engine.cloneState();
        sim.applyMoveSim(move);
        sim.turn = 'b';
        const evalScore = this.minimax(sim, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Beta cutoff
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const sim = engine.cloneState();
        sim.applyMoveSim(move);
        sim.turn = 'w';
        const evalScore = this.minimax(sim, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha cutoff
      }
      return minEval;
    }
  }
}

window.chessAI = new ChessAI();
