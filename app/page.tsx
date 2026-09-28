'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import Sidebar from './components/Sidebar';
import { getStockfishMove } from './lib/stockfish';

const FILES = 'abcdefgh';
const PIECES: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};

function positionStatus(game: Chess, playerColor: 'w' | 'b') {
  if (game.isCheckmate()) return `Chiếu hết! ${game.turn() === 'w' ? 'Đen' : 'Trắng'} thắng.`;
  if (game.isStalemate()) return 'Hòa cờ — hết nước đi hợp lệ (stalemate).';
  if (game.isInsufficientMaterial()) return 'Hòa cờ — không đủ quân để chiếu hết.';
  if (game.isThreefoldRepetition()) return 'Hòa cờ — thế cờ lặp lại ba lần.';
  if (game.isDrawByFiftyMoves()) return 'Hòa cờ — luật 50 nước.';
  if (game.isDraw()) return 'Hòa cờ.';
  if (game.isCheck()) return `Chiếu! Vua ${game.turn() === 'w' ? 'Trắng' : 'Đen'} đang bị chiếu.`;
  return game.turn() === playerColor ? `Lượt của bạn — quân ${playerColor === 'w' ? 'Trắng' : 'Đen'}.` : 'Lượt của máy.';
}

type MoveRecord = { from: string; to: string; san: string; color: 'w' | 'b' };
type GameSnapshot = { fen: string; lastMove: MoveRecord | null; hasMoved: boolean; status: string };

export default function Home() {
  const [game, setGame] = useState(() => new Chess());
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w');
  const [difficulty, setDifficulty] = useState(20);
  const [selected, setSelected] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [resultDismissed, setResultDismissed] = useState(false);
  const [status, setStatus] = useState('Chọn màu quân, sau đó chọn quân để xem nước đi.');
  const [lastMove, setLastMove] = useState<{ from: string; to: string; san: string; color: 'w' | 'b' } | null>(null);
  const [pastPositions, setPastPositions] = useState<GameSnapshot[]>([]);

  const targets = useMemo(
    () => selected ? game.moves({ square: selected as never, verbose: true }).map(move => move.to) : [],
    [game, selected],
  );
  const rememberCurrentPosition = useCallback(() => setPastPositions(history => [...history, {
    fen: game.fen(), lastMove, hasMoved, status,
  }]), [game, lastMove, hasMoved, status]);

  useEffect(() => {
    if (game.isGameOver() || game.turn() === playerColor) return;
    let cancelled = false;
    setThinking(true);
    getStockfishMove(game.fen(), difficulty).then(uci => {
      if (cancelled) return;
      const next = new Chess(game.fen());
      const played = next.move({ from: uci.slice(0, 2) as never, to: uci.slice(2, 4) as never, promotion: (uci[4] || 'q') as never });
      rememberCurrentPosition();
      setGame(next);
      setLastMove({ from: played.from, to: played.to, san: played.san, color: played.color });
      setHasMoved(true);
      setStatus(positionStatus(next, playerColor));
      setThinking(false);
    }).catch(() => {
      if (cancelled) return;
      setStatus('Không thể khởi động máy cờ. Tải lại trang để thử lại.');
      setThinking(false);
    });
    return () => { cancelled = true; };
  }, [game, playerColor, difficulty, rememberCurrentPosition]);

  const onSquareClick = (viewRow: number, viewColumn: number) => {
    if (thinking || game.isGameOver() || game.turn() !== playerColor) return;
    const row = playerColor === 'w' ? viewRow : 7 - viewRow;
    const column = playerColor === 'w' ? viewColumn : 7 - viewColumn;
    const square = `${FILES[column]}${8 - row}`;
    const piece = game.get(square as never);

    if (selected && targets.includes(square as never)) {
      const next = new Chess(game.fen());
      const played = next.move({ from: selected as never, to: square as never, promotion: 'q' });
      rememberCurrentPosition();
      setGame(next);
      setLastMove({ from: played.from, to: played.to, san: played.san, color: played.color });
      setSelected(null);
      setHasMoved(true);
      setStatus(positionStatus(next, playerColor));
      return;
    }

    setSelected(piece?.color === playerColor ? square : null);
  };

  const restart = () => {
    setGame(new Chess());
    setPastPositions([]);
    setSelected(null);
    setHasMoved(false);
    setThinking(false);
    setLastMove(null);
    setResultDismissed(false);
    setStatus('Chọn màu quân, sau đó chọn quân để xem nước đi.');
  };

  const undoMove = () => {
    if (!pastPositions.length) return;
    const computerJustMoved = game.turn() === playerColor && lastMove?.color !== playerColor;
    const plies = computerJustMoved && pastPositions.length > 1 ? 2 : 1;
    const index = Math.max(0, pastPositions.length - plies);
    const previous = pastPositions[index];
    setPastPositions(pastPositions.slice(0, index));
    setGame(new Chess(previous.fen));
    setLastMove(previous.lastMove);
    setHasMoved(previous.hasMoved);
    setStatus(previous.status);
    setSelected(null);
    setThinking(false);
  };

  const shownBoard = playerColor === 'w' ? game.board() : [...game.board()].reverse().map(row => [...row].reverse());
  const checkedKing = game.isCheck()
    ? game.board().flatMap((row, rank) => row.map((piece, file) => piece?.type === 'k' && piece.color === game.turn() ? `${FILES[file]}${8 - rank}` : null)).find(Boolean)
    : null;
  const result = game.isCheckmate()
    ? game.turn() === playerColor ? 'THẤT BẠI' : 'CHIẾN THẮNG'
    : game.isDraw() ? 'HÒA CỜ' : null;

  return <main className="chess-app">
    <Sidebar active="game" playerColor={playerColor} onPlayerColor={hasMoved ? undefined : setPlayerColor} difficulty={difficulty} onDifficultyChange={setDifficulty} />
    <section className="arena">
      <header><div><p>ĐẤU VỚI MÁY</p><h1>Chess Arena</h1></div></header>
      <div className="grid">
        <div className="play">
          <div className="board" aria-label="Bàn cờ vua">
            {shownBoard.map((row, r) => row.map((piece, c) => {
              const rank = playerColor === 'w' ? r : 7 - r;
              const file = playerColor === 'w' ? c : 7 - c;
              const square = `${FILES[file]}${8 - rank}`;
              return <button key={`${r}-${c}`} aria-label={square} onClick={() => onSquareClick(r, c)} className={`sq ${(r + c) % 2 ? 'dark' : 'light'} ${selected === square ? 'selected' : ''} ${targets.includes(square as never) ? 'can' : ''} ${lastMove?.from === square || lastMove?.to === square ? 'was' : ''} ${checkedKing === square ? 'in-check' : ''}`}>
                {c === 0 && <span className="rank">{8 - rank}</span>}
                {r === 7 && <span className="file">{FILES[file]}</span>}
                {piece && <strong className={piece.color}>{PIECES[piece.color + piece.type]}</strong>}
              </button>;
            }))}
          </div>
          {result && !thinking && !resultDismissed && <div className="board-result"><button className="result-badge" onClick={() => setResultDismissed(true)} aria-label={`Đóng thông báo ${result.toLowerCase()}`}>{result}</button></div>}
          <button className="restart" onClick={restart}><span className="restart-icon">＋</span><span>VÁN MỚI</span></button>
        </div>
        <div className="details-column">
        <aside className="details">
          <div className="title"><span>VÁN ĐẤU THƯỜNG</span><b>{thinking ? 'Máy đang nghĩ...' : status}</b></div>
          <div className={`notice ${lastMove ? 'last-move-notice' : 'player-hint-notice'}`}><i>◈</i><b>{lastMove ? `Nước đi gần nhất: ${lastMove.san}` : `Bạn cầm quân ${playerColor === 'w' ? 'Trắng' : 'Đen'}`}<small>{lastMove ? `${lastMove.color === playerColor ? 'Bạn' : 'Máy'}: ${lastMove.from} → ${lastMove.to}` : game.turn() === playerColor ? 'Chọn một quân của bạn để xem nước đi hợp lệ.' : 'Máy đang đi.'}</small></b></div>
        </aside>
        <button className="undo-button" onClick={undoMove} disabled={!pastPositions.length}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-2"/></svg>
          <span>QUAY LẠI NƯỚC TRƯỚC</span>
        </button>
        </div>
      </div>
    </section>
  </main>;
}
