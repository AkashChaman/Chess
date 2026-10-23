/**
 * Chess Master - Frontend Application Controller
 * Coordinates: Board Rendering, Drag & Drop, Click-to-Move, Sound Effects,
 * Local Engine, AI Engine, and Real-Time Socket.io Multiplayer.
 */

class ChessApp {
  constructor() {
    this.engine = new ChessEngine();
    this.mode = 'online'; // 'online' | 'local' | 'ai'
    this.aiDifficulty = 'medium';
    this.aiUserColor = 'w'; // 'w' or 'b'
    this.boardFlipped = false; // false: White at bottom, true: Black at bottom

    // Selection & Pending Moves
    this.selectedSquare = null; // { row, col }
    this.legalMovesForSelected = [];
    this.lastMove = null; // { from: {row, col}, to: {row, col} }
    this.pendingPromotionMove = null;

    // Online Multiplayer State
    this.socket = null;
    this.roomId = null;
    this.playerColor = 'white'; // 'white' | 'black' | null
    this.isMyTurn = false;
    this.onlineMatchActive = false;

    // Drag & Drop State
    this.dragState = {
      isDragging: false,
      fromSquare: null,
      pieceSvg: null,
      ghostEl: null
    };

    // Cache DOM Elements
    this.dom = {
      board: document.getElementById('chessboard'),
      promotionOverlay: document.getElementById('promotion-overlay'),
      promotionOptions: document.getElementById('promotion-options'),
      gameOverOverlay: document.getElementById('game-over-overlay'),
      gameResultBadge: document.getElementById('game-result-badge'),
      gameResultTitle: document.getElementById('game-result-title'),
      gameResultDesc: document.getElementById('game-result-desc'),
      btnResultRematch: document.getElementById('btn-result-rematch'),
      btnResultClose: document.getElementById('btn-result-close'),

      // Players
      topName: document.getElementById('top-name'),
      topColorPill: document.getElementById('top-color-pill'),
      topAvatar: document.getElementById('top-avatar'),
      topCaptured: document.getElementById('top-captured'),
      topAdvantage: document.getElementById('top-advantage'),
      playerTopBar: document.getElementById('player-top'),

      bottomName: document.getElementById('bottom-name'),
      bottomColorPill: document.getElementById('bottom-color-pill'),
      bottomAvatar: document.getElementById('bottom-avatar'),
      bottomCaptured: document.getElementById('bottom-captured'),
      bottomAdvantage: document.getElementById('bottom-advantage'),
      playerBottomBar: document.getElementById('player-bottom'),

      // Turn Indicator
      turnIndicator: document.getElementById('turn-indicator'),
      turnLabel: document.getElementById('turn-label'),
      turnSubLabel: document.getElementById('turn-sub-label'),
      turnPiecePreview: document.getElementById('turn-piece-preview'),

      // Buttons
      btnNewGame: document.getElementById('btn-new-game'),
      btnFlipBoard: document.getElementById('btn-flip-board'),
      btnResign: document.getElementById('btn-resign'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      iconSoundOn: document.getElementById('icon-sound-on'),
      iconSoundOff: document.getElementById('icon-sound-off'),
      themeSelect: document.getElementById('theme-select'),

      // Modes
      modeBtns: document.querySelectorAll('.mode-btn'),
      multiplayerPanel: document.getElementById('multiplayer-panel'),
      aiPanel: document.getElementById('ai-panel'),
      aiDifficultySelect: document.getElementById('ai-difficulty'),
      btnAiPlayWhite: document.getElementById('btn-ai-play-white'),
      btnAiPlayBlack: document.getElementById('btn-ai-play-black'),

      // Multiplayer Lobby
      socketStatus: document.getElementById('socket-status'),
      socketStatusText: document.getElementById('socket-status-text'),
      onlineLobbyView: document.getElementById('online-lobby-view'),
      onlineRoomView: document.getElementById('online-room-view'),
      inputPlayerName: document.getElementById('input-player-name'),
      btnCreateGame: document.getElementById('btn-create-game'),
      inputRoomCode: document.getElementById('input-room-code'),
      btnJoinGame: document.getElementById('btn-join-game'),
      displayRoomCode: document.getElementById('display-room-code'),
      btnCopyCode: document.getElementById('btn-copy-code'),
      btnCopyLink: document.getElementById('btn-copy-link'),
      roomWaitingBanner: document.getElementById('room-waiting-banner'),
      roomActiveBanner: document.getElementById('room-active-banner'),

      // History
      historyTbody: document.getElementById('history-tbody'),
      moveHistoryList: document.getElementById('move-history-list'),
      moveCountBadge: document.getElementById('move-count-badge'),

      // Chat
      chatSection: document.getElementById('chat-section'),
      chatMessages: document.getElementById('chat-messages'),
      chatForm: document.getElementById('chat-form'),
      chatInput: document.getElementById('chat-input')
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.renderBoard();
    this.updateStatusDisplay();
    this.initSocket();

    // Check for room invite URL parameter e.g. ?room=XYZ123
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      this.dom.inputRoomCode.value = roomParam.toUpperCase();
      this.switchMode('online');
    }
  }

  setupEventListeners() {
    // Mode Switching
    this.dom.modeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mode = btn.dataset.mode;
        this.switchMode(mode);
      });
    });

    // Theme selector
    this.dom.themeSelect.addEventListener('change', (e) => {
      document.body.setAttribute('data-theme', e.target.value);
    });

    // Sound toggle
    this.dom.btnSoundToggle.addEventListener('click', () => {
      const isMuted = window.chessAudio.toggleMute();
      this.dom.iconSoundOn.classList.toggle('hidden', isMuted);
      this.dom.iconSoundOff.classList.toggle('hidden', !isMuted);
    });

    // Game Action Buttons
    this.dom.btnNewGame.addEventListener('click', () => this.handleNewGame());
    this.dom.btnFlipBoard.addEventListener('click', () => {
      this.boardFlipped = !this.boardFlipped;
      this.renderBoard();
      this.updatePlayerBars();
    });
    this.dom.btnResign.addEventListener('click', () => this.handleResign());

    // AI Settings
    this.dom.aiDifficultySelect.addEventListener('change', (e) => {
      this.aiDifficulty = e.target.value;
    });
    this.dom.btnAiPlayWhite.addEventListener('click', () => {
      this.aiUserColor = 'w';
      this.boardFlipped = false;
      this.dom.btnAiPlayWhite.classList.add('active', 'btn-primary');
      this.dom.btnAiPlayWhite.classList.remove('btn-secondary');
      this.dom.btnAiPlayBlack.classList.remove('active', 'btn-primary');
      this.dom.btnAiPlayBlack.classList.add('btn-secondary');
      this.handleNewGame();
    });
    this.dom.btnAiPlayBlack.addEventListener('click', () => {
      this.aiUserColor = 'b';
      this.boardFlipped = true;
      this.dom.btnAiPlayBlack.classList.add('active', 'btn-primary');
      this.dom.btnAiPlayBlack.classList.remove('btn-secondary');
      this.dom.btnAiPlayWhite.classList.remove('active', 'btn-primary');
      this.dom.btnAiPlayWhite.classList.add('btn-secondary');
      this.handleNewGame();
      // AI moves first as white
      setTimeout(() => this.triggerAiMove(), 400);
    });

    // Online Lobby Buttons
    this.dom.btnCreateGame.addEventListener('click', () => this.createOnlineGame());
    this.dom.btnJoinGame.addEventListener('click', () => this.joinOnlineGame());
    this.dom.inputRoomCode.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') this.joinOnlineGame();
    });

    this.dom.btnCopyCode.addEventListener('click', () => {
      if (!this.roomId) return;
      navigator.clipboard.writeText(this.roomId);
      this.showButtonFeedback(this.dom.btnCopyCode, 'Copied!');
    });

    this.dom.btnCopyLink.addEventListener('click', () => {
      if (!this.roomId) return;
      const shareUrl = `${window.location.origin}${window.location.pathname}?room=${this.roomId}`;
      navigator.clipboard.writeText(shareUrl);
      this.showButtonFeedback(this.dom.btnCopyLink, 'Link Copied!');
    });

    // Chat Form
    this.dom.chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.dom.chatInput.value.trim();
      if (!text || !this.roomId || !this.socket) return;
      this.socket.emit('chatMessage', { roomId: this.roomId, text });
      this.dom.chatInput.value = '';
    });

    // Modals
    this.dom.btnResultRematch.addEventListener('click', () => {
      this.dom.gameOverOverlay.classList.add('hidden');
      if (this.mode === 'online' && this.socket && this.roomId) {
        this.socket.emit('requestRematch', { roomId: this.roomId });
        this.addChatMessage('System', 'You requested a rematch. Waiting for opponent...');
      } else {
        this.handleNewGame();
      }
    });

    this.dom.btnResultClose.addEventListener('click', () => {
      this.dom.gameOverOverlay.classList.add('hidden');
    });

    // Global Mouse & Touch Listeners for Drag and Drop
    window.addEventListener('mousemove', (e) => this.handleDragMove(e));
    window.addEventListener('mouseup', (e) => this.handleDragEnd(e));
    window.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleDragEnd(e));
  }

  showButtonFeedback(btn, text) {
    const orig = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = orig; }, 1800);
  }

  switchMode(newMode) {
    this.mode = newMode;
    this.dom.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === newMode));

    if (newMode === 'online') {
      this.dom.multiplayerPanel.classList.remove('hidden');
      this.dom.aiPanel.classList.add('hidden');
      this.dom.chatSection.classList.remove('hidden');
    } else if (newMode === 'ai') {
      this.dom.multiplayerPanel.classList.add('hidden');
      this.dom.aiPanel.classList.remove('hidden');
      this.dom.chatSection.classList.add('hidden');
      this.boardFlipped = (this.aiUserColor === 'b');
      this.handleNewGame();
      if (this.aiUserColor === 'b' && this.engine.turn === 'w') {
        setTimeout(() => this.triggerAiMove(), 500);
      }
    } else {
      // Local Pass & Play
      this.dom.multiplayerPanel.classList.add('hidden');
      this.dom.aiPanel.classList.add('hidden');
      this.dom.chatSection.classList.add('hidden');
      this.boardFlipped = false;
      this.handleNewGame();
    }

    this.updatePlayerBars();
    this.renderBoard();
  }

  // =========================================================================
  // Board Rendering & Square Mapping
  // =========================================================================
  renderBoard() {
    const boardEl = this.dom.board;
    boardEl.innerHTML = '';

    const kingInCheck = this.engine.isInCheck(this.engine.turn);
    const kingCoords = kingInCheck ? this.engine.findKing(this.engine.turn) : null;

    for (let displayRow = 0; displayRow < 8; displayRow++) {
      for (let displayCol = 0; displayCol < 8; displayCol++) {
        // Map display coordinates to actual board row/col based on board orientation
        const r = this.boardFlipped ? (7 - displayRow) : displayRow;
        const c = this.boardFlipped ? (7 - displayCol) : displayCol;

        const sqDiv = document.createElement('div');
        sqDiv.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        sqDiv.dataset.row = r;
        sqDiv.dataset.col = c;
        sqDiv.dataset.square = ChessEngine.coordsToSquare(r, c);

        // Highlight selected
        if (this.selectedSquare && this.selectedSquare.row === r && this.selectedSquare.col === c) {
          sqDiv.classList.add('selected');
        }

        // Highlight last move
        if (this.lastMove) {
          if (
            (this.lastMove.from.row === r && this.lastMove.from.col === c) ||
            (this.lastMove.to.row === r && this.lastMove.to.col === c)
          ) {
            sqDiv.classList.add('last-move');
          }
        }

        // Highlight King if in check
        if (kingCoords && kingCoords.row === r && kingCoords.col === c) {
          sqDiv.classList.add('in-check');
        }

        // Legal move indicators
        const isLegal = this.legalMovesForSelected.some(m => m.to.row === r && m.to.col === c);
        if (isLegal) {
          const pieceOnSq = this.engine.getPiece(r, c);
          const isEnPassant = this.legalMovesForSelected.some(
            m => m.to.row === r && m.to.col === c && m.flags && m.flags.enPassant
          );

          if (pieceOnSq || isEnPassant) {
            sqDiv.classList.add('legal-capture');
          } else {
            const dot = document.createElement('div');
            dot.className = 'legal-dot';
            sqDiv.appendChild(dot);
          }
        }

        // Coordinate labels on board borders
        if (displayCol === 0) {
          const rankLabel = document.createElement('span');
          rankLabel.className = 'coord-rank';
          rankLabel.textContent = (8 - r);
          sqDiv.appendChild(rankLabel);
        }
        if (displayRow === 7) {
          const fileLabel = document.createElement('span');
          fileLabel.className = 'coord-file';
          fileLabel.textContent = String.fromCharCode(97 + c);
          sqDiv.appendChild(fileLabel);
        }

        // Piece rendering
        const piece = this.engine.getPiece(r, c);
        if (piece) {
          const pieceEl = document.createElement('div');
          pieceEl.className = 'piece';
          const pieceKey = piece.color + piece.type.toUpperCase();
          pieceEl.innerHTML = PIECE_SVGS[pieceKey] || '';

          // Drag and drop attachment
          pieceEl.addEventListener('mousedown', (e) => this.handleDragStart(e, r, c));
          pieceEl.addEventListener('touchstart', (e) => this.handleDragStart(e, r, c), { passive: false });

          sqDiv.appendChild(pieceEl);
        }

        // Click-to-move listener
        sqDiv.addEventListener('click', (e) => this.handleSquareClick(r, c));

        boardEl.appendChild(sqDiv);
      }
    }
  }

  // =========================================================================
  // Move Handling & Validation
  // =========================================================================
  handleSquareClick(r, c) {
    if (this.isInteractionLocked()) return;

    const clickedPiece = this.engine.getPiece(r, c);

    // 1. If a square is already selected, check if clicked square is a legal destination
    if (this.selectedSquare) {
      const legalMatch = this.legalMovesForSelected.find(
        m => m.to.row === r && m.to.col === c
      );

      if (legalMatch) {
        // Execute move!
        this.attemptMove({
          from: this.selectedSquare,
          to: { row: r, col: c },
          flags: legalMatch.flags
        });
        return;
      }

      // If clicked on own piece again, reselect
      if (clickedPiece && clickedPiece.color === this.engine.turn) {
        this.selectSquare(r, c);
        return;
      }

      // Otherwise deselect
      this.clearSelection();
      return;
    }

    // 2. No square selected yet: select if piece belongs to current turn player
    if (clickedPiece && clickedPiece.color === this.engine.turn) {
      if (this.mode === 'online' && clickedPiece.color !== (this.playerColor === 'white' ? 'w' : 'b')) {
        return;
      }
      if (this.mode === 'ai' && clickedPiece.color !== this.aiUserColor) {
        return;
      }
      this.selectSquare(r, c);
    }
  }

  selectSquare(r, c) {
    this.selectedSquare = { row: r, col: c };
    this.legalMovesForSelected = this.engine.getLegalMovesForSquare(r, c);
    this.renderBoard();
  }

  clearSelection() {
    this.selectedSquare = null;
    this.legalMovesForSelected = [];
    this.renderBoard();
  }

  attemptMove(moveData) {
    const { from, to, flags } = moveData;
    const movingPiece = this.engine.getPiece(from.row, from.col);

    // Check for Pawn Promotion
    if (
      movingPiece &&
      movingPiece.type === 'p' &&
      ((movingPiece.color === 'w' && to.row === 0) || (movingPiece.color === 'b' && to.row === 7))
    ) {
      this.showPromotionDialog(from, to, movingPiece.color);
      return;
    }

    this.executeMove(from, to, 'q');
  }

  showPromotionDialog(from, to, color) {
    this.pendingPromotionMove = { from, to };
    const container = this.dom.promotionOptions;
    container.innerHTML = '';

    const pieces = ['q', 'r', 'b', 'n'];
    pieces.forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'promo-btn';
      const key = color + p.toUpperCase();
      btn.innerHTML = PIECE_SVGS[key];
      btn.addEventListener('click', () => {
        this.dom.promotionOverlay.classList.add('hidden');
        if (this.pendingPromotionMove) {
          const { from, to } = this.pendingPromotionMove;
          this.pendingPromotionMove = null;
          this.executeMove(from, to, p);
        }
      });
      container.appendChild(btn);
    });

    this.dom.promotionOverlay.classList.remove('hidden');
  }

  executeMove(from, to, promotion = 'q') {
    const fromSq = ChessEngine.coordsToSquare(from.row, from.col);
    const toSq = ChessEngine.coordsToSquare(to.row, to.col);

    // Online Multiplayer Mode: emit move event to server
    if (this.mode === 'online' && this.onlineMatchActive && this.socket) {
      this.socket.emit('move', {
        roomId: this.roomId,
        from: fromSq,
        to: toSq,
        promotion
      });
      this.clearSelection();
      return;
    }

    // Local or Vs AI Mode: execute on local engine
    const res = this.engine.makeMove({ from, to, promotion });
    if (!res) {
      window.chessAudio.playIllegal();
      this.clearSelection();
      return;
    }

    this.handleMoveSuccess(res);

    // If Vs AI mode, trigger AI response
    if (this.mode === 'ai' && !this.engine.getGameStatus().isGameOver) {
      if (this.engine.turn !== this.aiUserColor) {
        setTimeout(() => this.triggerAiMove(), 450);
      }
    }
  }

  handleMoveSuccess(moveRecord) {
    this.lastMove = { from: moveRecord.from, to: moveRecord.to };
    this.clearSelection();

    // Play appropriate sound effect
    const status = this.engine.getGameStatus();
    if (status.isGameOver) {
      window.chessAudio.playGameOver(status.winner === (this.mode === 'ai' ? this.aiUserColor : 'w'));
    } else if (status.isCheck) {
      window.chessAudio.playCheck();
    } else if (moveRecord.flags.castling) {
      window.chessAudio.playCastle();
    } else if (moveRecord.captured) {
      window.chessAudio.playCapture();
    } else {
      window.chessAudio.playMove();
    }

    this.appendMoveHistory(moveRecord.san);
    this.updateStatusDisplay();
    this.renderBoard();

    if (status.isGameOver) {
      this.showGameOverModal(status);
    }
  }

  triggerAiMove() {
    const aiColor = this.aiUserColor === 'w' ? 'b' : 'w';
    if (this.engine.turn !== aiColor) return;

    this.dom.turnSubLabel.textContent = 'Computer is thinking...';

    setTimeout(() => {
      const bestMove = window.chessAI.getBestMove(this.engine, aiColor, this.aiDifficulty);
      if (bestMove) {
        const promo = bestMove.flags.promotion || 'q';
        const res = this.engine.makeMove({
          from: bestMove.from,
          to: bestMove.to,
          promotion: promo
        });
        if (res) {
          this.handleMoveSuccess(res);
        }
      }
    }, 250);
  }

  isInteractionLocked() {
    const status = this.engine.getGameStatus();
    if (status.isGameOver) return true;

    if (this.mode === 'online') {
      if (!this.onlineMatchActive) return true;
      const myTurnColor = this.playerColor === 'white' ? 'w' : 'b';
      return this.engine.turn !== myTurnColor;
    }

    if (this.mode === 'ai') {
      return this.engine.turn !== this.aiUserColor;
    }

    return false;
  }

  // =========================================================================
  // Drag & Drop Piece Handling
  // =========================================================================
  handleDragStart(e, r, c) {
    if (this.isInteractionLocked()) return;

    const piece = this.engine.getPiece(r, c);
    if (!piece || piece.color !== this.engine.turn) return;

    if (this.mode === 'online' && piece.color !== (this.playerColor === 'white' ? 'w' : 'b')) return;
    if (this.mode === 'ai' && piece.color !== this.aiUserColor) return;

    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    this.dragState.isDragging = true;
    this.dragState.fromSquare = { row: r, col: c };

    // Select the square
    this.selectSquare(r, c);

    // Create ghost element
    const pieceKey = piece.color + piece.type.toUpperCase();
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.innerHTML = PIECE_SVGS[pieceKey];
    ghost.style.left = `${clientX}px`;
    ghost.style.top = `${clientY}px`;
    document.body.appendChild(ghost);
    this.dragState.ghostEl = ghost;

    // Dim the original piece
    const originalPieceEl = e.currentTarget;
    originalPieceEl.classList.add('dragging');
    this.dragState.originalPieceEl = originalPieceEl;

    if (isTouch) e.preventDefault();
  }

  handleDragMove(e) {
    if (!this.dragState.isDragging || !this.dragState.ghostEl) return;

    const isTouch = e.type === 'touchmove';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    this.dragState.ghostEl.style.left = `${clientX}px`;
    this.dragState.ghostEl.style.top = `${clientY}px`;

    if (isTouch) e.preventDefault();
  }

  handleDragEnd(e) {
    if (!this.dragState.isDragging) return;

    const isTouch = e.type === 'touchend';
    const clientX = isTouch ? (e.changedTouches ? e.changedTouches[0].clientX : 0) : e.clientX;
    const clientY = isTouch ? (e.changedTouches ? e.changedTouches[0].clientY : 0) : e.clientY;

    // Cleanup ghost
    if (this.dragState.ghostEl) {
      this.dragState.ghostEl.remove();
      this.dragState.ghostEl = null;
    }
    if (this.dragState.originalPieceEl) {
      this.dragState.originalPieceEl.classList.remove('dragging');
      this.dragState.originalPieceEl = null;
    }

    this.dragState.isDragging = false;

    // Determine square dropped on
    const elemUnder = document.elementFromPoint(clientX, clientY);
    if (!elemUnder) return;

    const squareEl = elemUnder.closest('.square');
    if (squareEl) {
      const toR = parseInt(squareEl.dataset.row, 10);
      const toC = parseInt(squareEl.dataset.col, 10);
      const from = this.dragState.fromSquare;

      if (from.row !== toR || from.col !== toC) {
        const legalMatch = this.legalMovesForSelected.find(
          m => m.to.row === toR && m.to.col === toC
        );
        if (legalMatch) {
          this.attemptMove({
            from,
            to: { row: toR, col: toC },
            flags: legalMatch.flags
          });
        }
      }
    }
  }

  // =========================================================================
  // Information Displays & History
  // =========================================================================
  updateStatusDisplay() {
    const turn = this.engine.turn;
    const isWhite = turn === 'w';
    const status = this.engine.getGameStatus();

    // Turn Indicator
    this.dom.turnPiecePreview.innerHTML = PIECE_SVGS[isWhite ? 'wK' : 'bK'];
    this.dom.turnLabel.textContent = isWhite ? "White's Turn" : "Black's Turn";

    if (status.isCheckmate) {
      this.dom.turnSubLabel.textContent = `Checkmate! ${status.winner.toUpperCase()} wins.`;
    } else if (status.isDraw) {
      this.dom.turnSubLabel.textContent = `Game Draw (${status.reason})`;
    } else if (status.isCheck) {
      this.dom.turnSubLabel.textContent = 'CHECK! King in danger!';
    } else if (this.mode === 'online') {
      const isMyTurn = (this.playerColor === 'white' && isWhite) || (this.playerColor === 'black' && !isWhite);
      this.dom.turnSubLabel.textContent = isMyTurn ? 'Your turn to move' : "Waiting for opponent...";
    } else {
      this.dom.turnSubLabel.textContent = 'Ready for move';
    }

    this.updatePlayerBars();
  }

  updatePlayerBars() {
    const { capturedByWhite, capturedByBlack, materialAdvantage } = this.engine.getCapturedPieces();

    // Bottom is user/White (unless board flipped)
    const isBottomWhite = !this.boardFlipped;

    const whiteName = this.mode === 'online' ? (this.playerColor === 'white' ? (this.dom.inputPlayerName.value || 'You') : 'Opponent') : (this.mode === 'ai' ? (this.aiUserColor === 'w' ? 'You' : 'Computer') : 'Player 1');
    const blackName = this.mode === 'online' ? (this.playerColor === 'black' ? (this.dom.inputPlayerName.value || 'You') : 'Opponent') : (this.mode === 'ai' ? (this.aiUserColor === 'b' ? 'You' : 'Computer') : 'Player 2');

    this.dom.bottomName.textContent = isBottomWhite ? whiteName : blackName;
    this.dom.bottomColorPill.textContent = isBottomWhite ? 'White' : 'Black';
    this.dom.bottomAvatar.textContent = isBottomWhite ? 'W' : 'B';

    this.dom.topName.textContent = isBottomWhite ? blackName : whiteName;
    this.dom.topColorPill.textContent = isBottomWhite ? 'Black' : 'White';
    this.dom.topAvatar.textContent = isBottomWhite ? 'B' : 'W';

    // Highlight active player bar
    const isWhiteTurn = this.engine.turn === 'w';
    this.dom.playerBottomBar.classList.toggle('active-turn', isBottomWhite ? isWhiteTurn : !isWhiteTurn);
    this.dom.playerTopBar.classList.toggle('active-turn', isBottomWhite ? !isWhiteTurn : isWhiteTurn);

    // Captured pieces rendering
    const renderCaptures = (container, pieceKeys) => {
      container.innerHTML = '';
      pieceKeys.forEach(k => {
        const span = document.createElement('span');
        span.className = 'captured-icon';
        span.innerHTML = PIECE_SVGS[k];
        container.appendChild(span);
      });
    };

    if (isBottomWhite) {
      renderCaptures(this.dom.bottomCaptured, capturedByWhite); // White captured these black pieces
      renderCaptures(this.dom.topCaptured, capturedByBlack);
      this.dom.bottomAdvantage.textContent = materialAdvantage > 0 ? `+${materialAdvantage}` : '';
      this.dom.topAdvantage.textContent = materialAdvantage < 0 ? `+${Math.abs(materialAdvantage)}` : '';
    } else {
      renderCaptures(this.dom.bottomCaptured, capturedByBlack);
      renderCaptures(this.dom.topCaptured, capturedByWhite);
      this.dom.bottomAdvantage.textContent = materialAdvantage < 0 ? `+${Math.abs(materialAdvantage)}` : '';
      this.dom.topAdvantage.textContent = materialAdvantage > 0 ? `+${materialAdvantage}` : '';
    }
  }

  appendMoveHistory(san) {
    const moves = this.engine.moveHistory;
    const count = moves.length;
    this.dom.moveCountBadge.textContent = `${count} Move${count === 1 ? '' : 's'}`;

    const tbody = this.dom.historyTbody;
    const moveNumber = Math.ceil(count / 2);
    const isWhite = count % 2 === 1;

    if (isWhite) {
      // Remove empty placeholder row if present
      const emptyRow = tbody.querySelector('.empty-history-row');
      if (emptyRow) emptyRow.remove();

      const tr = document.createElement('tr');
      tr.id = `history-row-${moveNumber}`;
      tr.innerHTML = `
        <td class="col-num">${moveNumber}.</td>
        <td class="col-white"><span class="history-move active" data-ply="${count}">${san}</span></td>
        <td class="col-black"><span class="history-move" data-ply="${count + 1}"></span></td>
      `;
      tbody.appendChild(tr);
    } else {
      const prevActive = tbody.querySelector('.history-move.active');
      if (prevActive) prevActive.classList.remove('active');

      const tr = document.getElementById(`history-row-${moveNumber}`);
      if (tr) {
        const blackSpan = tr.querySelector('.col-black .history-move');
        if (blackSpan) {
          blackSpan.textContent = san;
          blackSpan.classList.add('active');
        }
      }
    }

    // Auto-scroll history container
    this.dom.moveHistoryList.scrollTop = this.dom.moveHistoryList.scrollHeight;
  }

  clearHistory() {
    this.dom.historyTbody.innerHTML = `
      <tr class="empty-history-row">
        <td colspan="3">Moves will appear here</td>
      </tr>
    `;
    this.dom.moveCountBadge.textContent = '0 Moves';
  }

  showGameOverModal(status) {
    this.dom.gameResultBadge.textContent = status.reason.toUpperCase();
    if (status.isCheckmate) {
      this.dom.gameResultTitle.textContent = `${status.winner.toUpperCase()} Wins!`;
      this.dom.gameResultDesc.textContent = `Victory achieved by checkmate.`;
    } else if (status.isDraw) {
      this.dom.gameResultTitle.textContent = `Game Drawn!`;
      this.dom.gameResultDesc.textContent = `Drawn by ${status.reason}.`;
    }
    this.dom.gameOverOverlay.classList.remove('hidden');
  }

  handleNewGame() {
    this.engine.reset();
    this.lastMove = null;
    this.clearSelection();
    this.clearHistory();
    this.dom.gameOverOverlay.classList.add('hidden');
    this.updateStatusDisplay();
    this.renderBoard();
  }

  handleResign() {
    if (this.engine.getGameStatus().isGameOver) return;

    if (this.mode === 'online' && this.onlineMatchActive && this.socket) {
      if (confirm('Are you sure you want to resign this match?')) {
        this.socket.emit('resign', { roomId: this.roomId });
      }
      return;
    }

    if (confirm('Are you sure you want to resign?')) {
      const winner = this.engine.turn === 'w' ? 'black' : 'white';
      this.showGameOverModal({
        isGameOver: true,
        isCheckmate: false,
        isDraw: false,
        winner,
        reason: 'resignation'
      });
    }
  }

  // =========================================================================
  // Socket.io Real-Time Multiplayer Integration
  // =========================================================================
  initSocket() {
    if (typeof io === 'undefined') {
      this.setSocketStatus(false, 'Socket Offline');
      return;
    }

    this.socket = io();

    this.socket.on('connect', () => {
      this.setSocketStatus(true, 'Server Connected');
    });

    this.socket.on('disconnect', () => {
      this.setSocketStatus(false, 'Disconnected');
      this.onlineMatchActive = false;
    });

    this.socket.on('connect_error', () => {
      this.setSocketStatus(false, 'Connection Error');
    });

    // 1. Game Created Confirmation
    this.socket.on('gameCreated', (data) => {
      this.roomId = data.roomId;
      this.playerColor = 'white';
      this.boardFlipped = false;

      this.dom.displayRoomCode.textContent = this.roomId;
      this.dom.onlineLobbyView.classList.add('hidden');
      this.dom.onlineRoomView.classList.remove('hidden');
      this.dom.roomWaitingBanner.classList.remove('hidden');
      this.dom.roomActiveBanner.classList.add('hidden');

      window.chessAudio.playNotify();
      this.addChatMessage('System', `Room ${this.roomId} created. Share the code to invite an opponent!`);
    });

    // 2. Game Joined Confirmation
    this.socket.on('gameJoined', (data) => {
      this.roomId = data.roomId;
      this.playerColor = 'black';
      this.boardFlipped = true; // Auto-flip board for Black!

      this.dom.displayRoomCode.textContent = this.roomId;
      this.dom.onlineLobbyView.classList.add('hidden');
      this.dom.onlineRoomView.classList.remove('hidden');

      window.chessAudio.playNotify();
    });

    this.socket.on('joinError', (data) => {
      alert(data.message || 'Could not join room.');
    });

    // 3. Match Starts (Both players ready)
    this.socket.on('gameStart', (data) => {
      this.onlineMatchActive = true;
      this.dom.roomWaitingBanner.classList.add('hidden');
      this.dom.roomActiveBanner.classList.remove('hidden');

      this.engine.loadFEN(data.fen);
      this.lastMove = null;
      this.clearSelection();
      this.clearHistory();

      // Set player names
      if (data.players) {
        if (this.playerColor === 'white') {
          this.dom.bottomName.textContent = data.players.white.name || 'You';
          this.dom.topName.textContent = data.players.black.name || 'Opponent';
        } else {
          this.dom.bottomName.textContent = data.players.black.name || 'You';
          this.dom.topName.textContent = data.players.white.name || 'Opponent';
        }
      }

      window.chessAudio.playNotify();
      this.addChatMessage('System', `Game started! White to move.`);
      this.updateStatusDisplay();
      this.renderBoard();
    });

    // 4. Move Made Broadcast
    this.socket.on('moveMade', (data) => {
      const { move, fen, isCheck, isGameOver, isCheckmate, isDraw, winner, endReason } = data;

      // Sync local engine with server FEN
      this.engine.loadFEN(fen);

      const fromCoords = ChessEngine.squareToCoords(move.from);
      const toCoords = ChessEngine.squareToCoords(move.to);
      this.lastMove = { from: fromCoords, to: toCoords };

      // Play audio
      if (isGameOver) {
        window.chessAudio.playGameOver(winner === this.playerColor);
      } else if (isCheck) {
        window.chessAudio.playCheck();
      } else if (move.flags && (move.flags.includes('k') || move.flags.includes('q'))) {
        window.chessAudio.playCastle();
      } else if (move.captured) {
        window.chessAudio.playCapture();
      } else {
        window.chessAudio.playMove();
      }

      this.appendMoveHistory(move.san);
      this.updateStatusDisplay();
      this.renderBoard();

      if (isGameOver) {
        this.showGameOverModal({
          isGameOver: true,
          isCheckmate,
          isDraw,
          winner,
          reason: endReason || 'game over'
        });
      }
    });

    // 5. Invalid Move feedback
    this.socket.on('invalidMove', (data) => {
      window.chessAudio.playIllegal();
      alert(data.message || 'Illegal move!');
      this.clearSelection();
    });

    // 6. Opponent Disconnected
    this.socket.on('opponentDisconnected', (data) => {
      this.addChatMessage('System', data.message || 'Opponent disconnected.');
      alert(data.message || 'Opponent has disconnected from the match.');
    });

    // 7. Resign Notification
    this.socket.on('gameResigned', (data) => {
      this.showGameOverModal({
        isGameOver: true,
        isCheckmate: false,
        isDraw: false,
        winner: data.winner,
        reason: 'resignation'
      });
      this.addChatMessage('System', data.message);
    });

    // 8. Rematch Handling
    this.socket.on('rematchOffered', (data) => {
      this.addChatMessage('System', `${data.by} offered a rematch. Click "Play Again" to accept!`);
    });

    this.socket.on('rematchStarted', (data) => {
      // Swap colors!
      this.playerColor = (this.playerColor === 'white') ? 'black' : 'white';
      this.boardFlipped = (this.playerColor === 'black');
      this.engine.loadFEN(data.fen);
      this.lastMove = null;
      this.clearSelection();
      this.clearHistory();
      this.dom.gameOverOverlay.classList.add('hidden');
      this.updateStatusDisplay();
      this.renderBoard();
      this.addChatMessage('System', 'Rematch started! Colors have been swapped.');
    });

    // 9. Chat Message Received
    this.socket.on('chatMessage', (data) => {
      this.addChatMessage(data.sender, data.text, data.color, data.time);
    });
  }

  setSocketStatus(isOnline, text) {
    this.dom.socketStatus.classList.toggle('online', isOnline);
    this.dom.socketStatus.classList.toggle('offline', !isOnline);
    this.dom.socketStatusText.textContent = text;
  }

  createOnlineGame() {
    if (!this.socket || !this.socket.connected) {
      alert('Unable to reach server. Please ensure the server is running.');
      return;
    }
    const playerName = this.dom.inputPlayerName.value || 'Player 1';
    this.socket.emit('createGame', { playerName });
  }

  joinOnlineGame() {
    if (!this.socket || !this.socket.connected) {
      alert('Unable to reach server. Please ensure the server is running.');
      return;
    }
    const code = this.dom.inputRoomCode.value.trim().toUpperCase();
    if (!code || code.length !== 6) {
      alert('Please enter a valid 6-character room code.');
      return;
    }
    const playerName = this.dom.inputPlayerName.value || 'Player 2';
    this.socket.emit('joinGame', { roomId: code, playerName });
  }

  addChatMessage(sender, text, colorClass = '', time = '') {
    const box = this.dom.chatMessages;
    const bubble = document.createElement('div');

    if (sender === 'System') {
      bubble.className = 'chat-system-msg';
      bubble.textContent = text;
    } else {
      bubble.className = 'chat-bubble';
      bubble.innerHTML = `
        <span class="chat-sender ${colorClass}">${sender} ${time ? `<span style="font-weight:400;color:#726f69;">(${time})</span>` : ''}:</span>
        <span class="chat-text">${text}</span>
      `;
    }

    box.appendChild(bubble);
    box.scrollTop = box.scrollHeight;
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.chessApp = new ChessApp();
});
