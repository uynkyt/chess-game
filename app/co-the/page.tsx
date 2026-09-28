'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import Sidebar from '../components/Sidebar';
import { getStockfishMove } from '../lib/stockfish';

const files = 'abcdefgh';
const symbols: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
};
const samplePositions = [
  { fen: '5N2/p2Bpp2/2p5/4k3/1P5P/8/1P1BKP2/RN1Q4 w - - 1 25', key: 'Bc3+' },
  { fen: '2bqkbn1/3pp1r1/n1p2p2/6Np/1r2PP2/P7/2PP2PP/R1BQK2R w KQ - 0 13', key: 'Qxh5+' },
  { fen: '1r4n1/5Rp1/1p2k3/pP6/P7/Q3N3/3P1PP1/R3K3 w - - 1 31', key: 'Qb3+' },
  { fen: '4k1n1/2p1p3/3p1p1r/1p5p/3P1bQP/1PP1P3/rP1N2R1/2B2K2 w - - 4 22', key: 'Qc8+' },
  { fen: 'r1bqkbn1/3pp3/n1p2p2/pp3P2/8/2NPP3/PPP3rP/R1BQKBR1 w Qq - 0 10', key: 'Qh5+' },
  { fen: 'rnbqkbnr/ppppp1p1/7p/5p2/8/4PQ2/PPPP1PPP/RNB1KBNR w KQkq - 0 3', key: 'Qh5+' },
  { fen: 'r2qk2r/2p1pp1Q/n2p4/1P6/p7/R7/PP1NPPB1/R1B1K1N1 w Qkq - 1 12', key: 'Bc6+' },
  { fen: '5knR/r7/p7/P2pPpNR/8/3P4/1Q1KP1P1/5B2 w - - 3 31', key: 'Qb8+' },
  { fen: '5R2/2p1p3/1p2k3/8/3rpP2/7P/P1Q2K2/6R1 w - - 0 34', key: 'Qc6+' },
  { fen: 'r1b2k2/pp3p2/2p1pPR1/3p2n1/PN6/1P2P3/2Q5/RN2KB2 w - - 1 23', key: 'Qc5+' },
  { fen: '4k3/2Q5/2P1p3/8/4B3/8/R2r4/2B4K w - - 2 33', key: 'Bg6+' },
  { fen: '3kr3/p5p1/2Q5/7p/P1B1p3/2b1P3/R4P1P/2BK4 w - - 3 31', key: 'Qd6+' },
  { fen: 'r4bk1/3R4/P5n1/8/P6P/4P1N1/2Q2P2/3K2NR w - - 1 29', key: 'Qxg6+' },
  { fen: 'r3k3/1p4pr/p3B3/5p1p/n4P2/1P4P1/2P2K1P/RN1Q3R w q - 0 19', key: 'Qd7+' },
  { fen: '1r3k2/1b2p2B/2p2p2/P7/2P2P1Q/B6N/P3P3/R3K3 w Q - 0 27', key: 'Qxf6+' },
  { fen: '3k1b2/1pp3p1/3p1pn1/1QP1p3/R2P2p1/4PN2/4K1B1/7R w - - 0 28', key: 'Ra8+' },
  { fen: '1Bb3nr/7p/4k3/2pp2p1/8/N1PP4/4B1KP/R3Q2R w - - 0 20', key: 'Bh5+' },
  { fen: 'rnbqkbnr/1pppp1p1/p4p1p/4P3/8/7P/PPPP1PP1/RNBQKBNR w KQkq - 0 4', key: 'Qh5+' },
  { fen: '2b2br1/4kpp1/p1B1pn1R/8/3p4/1P6/P2QPP2/RNB1K1N1 w Q - 1 16', key: 'Ba3+' },
  { fen: 'rnbqkbnr/p1ppp1p1/5p1p/1p6/8/3PP2N/PPP2PPP/RNBQKB1R w KQkq - 0 4', key: 'Qh5+' },
];
const unlimitedPositions = [
  'r1bqkbnr/p2p1p1p/1p2p1p1/1np5/1PP5/3P4/PR2PPPP/2BQKBNR w Kkq - 0 8',
  '1nb1kb2/1p1qnppr/r1pp3p/p2Pp3/4P3/1PNB4/P1P1QPPP/1RB1K1NR w K - 1 10',
  '1rb3nr/1q4p1/ppk4p/1p2Pp2/2P2BPP/Q2p4/P4PN1/RNR3K1 w - - 1 27',
  '1rbqr3/pp1B1p1p/1P1k4/2pp1ppn/1n1PP3/B1P5/P1Q1N1Pb/RN2K2R w - - 2 24',
  'rn1qkbnr/p2bp1pp/8/2pp1p2/1p5P/3PBN1R/PPP1PPP1/RN1QKB2 w Qkq - 0 7',
  'rnbq1b1r/1ppk1pp1/3p3n/4p2p/p1P5/1Q1PPKP1/PP1N1P1P/R1B2BNR w - - 2 9',
  '1n4nr/rp4b1/3pk1p1/p1p2pqp/2PPNPbN/PP2P2P/5P1R/R1B1K3 w Q - 0 22',
  '4rbnr/p1p2p2/bn1k4/1p2p1pp/BP1P1BPP/P2Pq3/2P2P2/RN1Q1KNR w - - 4 23',
  'r3kb1r/p3Npp1/b1n2P1p/2qp4/1ppPp3/P1P2P1N/1P2B1PP/R1BQK1R1 w Qkq - 0 15',
  'r2qr3/1b3p1p/1ppk1bp1/p1n1p1PN/2PpP2P/1P1P3R/P2Q1NP1/R1BK1B2 w - - 9 24',
  'r1b2bnr/pp1kppp1/8/q1P4p/2p4P/2B1P1P1/P3QP1R/RN2KBN1 w Q - 1 13',
  'rn1qkbnr/pp4pp/5p2/2ppP3/4P1b1/N2P4/PPP1B1PP/R1BQK1NR w KQkq - 1 8',
  'r4bn1/p1p2kp1/2q1pp1r/3P3p/1P4bP/P1PQ2P1/3PnP2/RNBK1B1R w - - 6 17',
  'r2qr1k1/p3p2p/b2p1n1b/2p2pp1/PP2P3/R4N2/3P1PPP/1NBQKB1R w - - 0 13',
  'rnb3nr/q4kp1/8/pp1ppp2/1bBP2PB/1P2PP1P/P1P5/RK1Q2NR w - - 4 21',
  '1rbq2k1/p2pr2p/p1nb1pp1/2p1p3/P2PPB2/2P4N/1P3P1P/RN1BK2R w K - 2 19',
  '2bq1b1r/3k1np1/n4r2/pNppp2p/8/1P3PPP/7Q/RNB1KB1R w K - 0 22',
  'r2qkb1r/1nB3p1/2pppp1n/p6p/NPP4P/P2P4/5PP1/RQ2KBNR w KQkq - 0 14',
  'r1bqkb1r/1p1np1pp/2p2p1n/p2P4/P2P4/3N2P1/1PP2P1P/RNBQKB1R w KQk - 0 9',
  '2bqkb1r/4p1pp/1rpp1p2/8/p5PP/2P1nP2/PP1PB2R/RNB1K1N1 w Qk - 2 15',
];
type MoveRecord = { from: string; to: string; san: string; color: 'w' | 'b' };
type PositionSnapshot = {
  fen: string;
  puzzleStage: number;
  samplePlaying: boolean;
  customPlaying: boolean;
  message: string;
  lastMove: MoveRecord | null;
};

export default function PuzzlePage() {
  const [chess, setChess] = useState(() => new Chess(samplePositions[0].fen));
  const [loadedSampleIndex, setLoadedSampleIndex] = useState(0);
  const [difficulty, setDifficulty] = useState(20);
  const [samplePlaying, setSamplePlaying] = useState(true);
  const [puzzleStage, setPuzzleStage] = useState(0);
  const [practiceMode, setPracticeMode] = useState<'mate2' | 'unlimited'>('mate2');
  const [from, setFrom] = useState<string | null>(null);
  const [custom, setCustom] = useState(false);
  const [customPlaying, setCustomPlaying] = useState(false);
  const [preserveCustomOrientation, setPreserveCustomOrientation] = useState(false);
  const [tool, setTool] = useState('wq');
  const [pickerBottomColor, setPickerBottomColor] = useState<'w' | 'b'>('w');
  const [thinking, setThinking] = useState(false);
  const [resultDismissed, setResultDismissed] = useState(false);
  const [message, setMessage] = useState(`Thế mẫu 01/${samplePositions.length} — Trắng đi, hãy chiếu hết trong 2 nước.`);
  const [lastMove, setLastMove] = useState<MoveRecord | null>(null);
  const [pastPositions, setPastPositions] = useState<PositionSnapshot[]>([]);
  const playerColor = pickerBottomColor;
  const flipBoard = !preserveCustomOrientation && (customPlaying || samplePlaying) && playerColor === 'b';

  const targets = useMemo(
    () => from ? chess.moves({ square: from as never, verbose: true }).map(move => move.to) : [],
    [chess, from],
  );
  const hasBothKings = chess.board().flat().filter(piece => piece?.type === 'k').length === 2;
  const pickerPieces = Object.entries(symbols).sort(
    ([a], [b]) => Number(a[0] === pickerBottomColor) - Number(b[0] === pickerBottomColor),
  );
  const visiblePositions = practiceMode === 'unlimited' ? unlimitedPositions : samplePositions;
  const rememberCurrentPosition = useCallback(() => setPastPositions(history => [...history, {
    fen: chess.fen(), puzzleStage, samplePlaying, customPlaying, message, lastMove,
  }]), [chess, puzzleStage, samplePlaying, customPlaying, message, lastMove]);

  useEffect(() => {
    if ((!customPlaying && !samplePlaying) || chess.turn() === playerColor || chess.isGameOver()) return;
    let cancelled = false;
    setThinking(true);
    getStockfishMove(chess.fen(), difficulty).then(uci => {
      if (cancelled) return;
      const next = new Chess(chess.fen(), { skipValidation: true });
      const played = next.move({ from: uci.slice(0, 2) as never, to: uci.slice(2, 4) as never, promotion: (uci[4] || 'q') as never });
      rememberCurrentPosition();
      setChess(next);
      setLastMove({ from: played.from, to: played.to, san: played.san, color: played.color });
      setMessage(customPlaying
        ? next.isCheckmate() ? 'Chiếu hết! Bạn thua.' : next.isStalemate() ? 'Hòa cờ — stalemate.' : next.isCheck() ? `Chiếu! Vua ${next.turn() === 'w' ? 'Trắng' : 'Đen'} đang bị chiếu.` : 'Lượt của bạn.'
        : playerColor === 'w' ? 'Đen đã đáp lại. Trắng đi — hãy tìm nước chiếu hết.' : 'Trắng đã đi. Đen đến lượt bạn — hãy tìm cách phòng thủ.');
      setThinking(false);
    }).catch(() => {
      if (cancelled) return;
      setMessage('Không thể khởi động máy cờ. Tải lại trang để thử lại.');
      setThinking(false);
    });
    return () => { cancelled = true; };
  }, [chess, customPlaying, samplePlaying, difficulty, playerColor, rememberCurrentPosition]);

  const clickSquare = (row: number, column: number) => {
    const viewRow = flipBoard ? 7 - row : row;
    const viewColumn = flipBoard ? 7 - column : column;
    const square = `${files[viewColumn]}${8 - viewRow}`;
    if (custom) {
      const next = new Chess(chess.fen(), { skipValidation: true });
      if (tool === 'wk' || tool === 'bk') {
        const color = tool[0] as 'w' | 'b';
        next.board().forEach((boardRow, rank) => boardRow.forEach((piece, file) => {
          if (piece?.type === 'k' && piece.color === color) next.remove(`${files[file]}${8 - rank}` as never);
        }));
      }
      next.remove(square as never);
      if (tool !== 'erase') next.put({ color: tool[0] as 'w' | 'b', type: tool[1] as 'p' | 'n' | 'b' | 'r' | 'q' | 'k' }, square as never);
      setChess(next);
      return;
    }

    if (customPlaying) {
      if (thinking || chess.turn() !== playerColor || chess.isGameOver()) return;
      if (!from) { if (chess.get(square as never)?.color === playerColor) setFrom(square); return; }
      if (!targets.includes(square as never)) { setFrom(chess.get(square as never)?.color === playerColor ? square : null); return; }
      const next = new Chess(chess.fen(), { skipValidation: true });
      const played = next.move({ from: from as never, to: square as never, promotion: 'q' });
      rememberCurrentPosition();
      setChess(next); setFrom(null);
      setLastMove({ from: played.from, to: played.to, san: played.san, color: played.color });
      setMessage(next.isCheckmate() ? 'Chiếu hết! Bạn thắng.' : next.isStalemate() ? 'Hòa cờ — stalemate.' : next.isCheck() ? `Chiếu! Vua ${next.turn() === 'w' ? 'Trắng' : 'Đen'} đang bị chiếu.` : 'Máy đang nghĩ...');
      return;
    }

    if (thinking || chess.turn() !== playerColor || chess.isGameOver()) return;
    if (!from) { if (chess.get(square as never)?.color === playerColor) setFrom(square); return; }
    if (!targets.includes(square as never)) { setFrom(chess.get(square as never)?.color === playerColor ? square : null); return; }
    const next = new Chess(chess.fen());
    const played = next.move({ from: from as never, to: square as never, promotion: 'q' });
    rememberCurrentPosition();
    setChess(next); setFrom(null);
    setLastMove({ from: played.from, to: played.to, san: played.san, color: played.color });
    if (samplePlaying && playerColor === 'b') {
      if (next.isGameOver()) {
        setSamplePlaying(false);
        setMessage(next.isCheckmate() ? 'Chiếu hết! Đen thua.' : 'Hòa cờ.');
      } else {
        setMessage(next.isCheck() ? 'Chiếu! Trắng sẽ đáp lại.' : 'Trắng đang nghĩ...');
      }
      return;
    }
    if (samplePlaying && puzzleStage === 0) {
      if (played.san === samplePositions[loadedSampleIndex].key) {
        setPuzzleStage(1);
        setMessage('Đúng hướng! Đen đang đáp lại...');
      } else {
        setSamplePlaying(false);
        setMessage('Nước đi chưa giải được bài. Chọn lại thế mẫu để thử lại.');
      }
      return;
    }
    if (samplePlaying && puzzleStage === 1) {
      setSamplePlaying(false);
      setMessage(next.isCheckmate() ? '✓ Chính xác! Chiếu hết trong 2 nước.' : 'Chưa chiếu hết trong 2 nước. Chọn lại thế mẫu để thử lại.');
      return;
    }
    setMessage(next.isCheckmate() ? '✓ Chính xác! Chiếu hết trong 2 nước.' : 'Nước đi hợp lệ, nhưng chưa chiếu hết.');
  };

  const preset = (index: number) => {
    setPreserveCustomOrientation(false);
    setLoadedSampleIndex(index);
    setPastPositions([]);
    const fen = samplePositions[index].fen.split(' ');
    fen[1] = 'w';
    setChess(new Chess(fen.join(' '))); setFrom(null); setLastMove(null); setCustom(false); setCustomPlaying(false); setSamplePlaying(true); setPuzzleStage(0); setThinking(false);
    setResultDismissed(false);
    setMessage(pickerBottomColor === 'w'
      ? `Thế mẫu ${String(index + 1).padStart(2, '0')}/${samplePositions.length} — Trắng đi, hãy chiếu hết trong 2 nước.`
      : `Thế mẫu ${String(index + 1).padStart(2, '0')}/${samplePositions.length} — Trắng đi trước; bạn cầm Đen để phòng thủ.`);
  };
  const startSampleGame = (index: number) => {
    setPreserveCustomOrientation(false);
    setLoadedSampleIndex(index);
    setPastPositions([]);
    const fen = unlimitedPositions[index].split(' ');
    fen[1] = 'w';
    setChess(new Chess(fen.join(' '))); setFrom(null); setLastMove(null); setCustom(false); setCustomPlaying(true); setSamplePlaying(false); setPuzzleStage(0); setThinking(false);
    setPracticeMode('unlimited'); setResultDismissed(false);
    setMessage(`Ván đấu bắt đầu từ thế cờ mẫu. Trắng đi trước; bạn cầm ${pickerBottomColor === 'w' ? 'Trắng' : 'Đen'} — chơi đến chiến thắng, không giới hạn số nước.`);
  };
  const chooseSample = (index: number) => practiceMode === 'unlimited' ? startSampleGame(index) : preset(index);
  const changePracticeMode = (mode: 'mate2' | 'unlimited') => {
    if (mode === 'unlimited') startSampleGame(loadedSampleIndex);
    else {
      setPracticeMode('mate2');
      preset(loadedSampleIndex);
    }
  };
  const create = () => {
    setPreserveCustomOrientation(false);
    const empty = new Chess(); empty.clear();
    setPastPositions([]);
    setChess(new Chess(empty.fen(), { skipValidation: true })); setFrom(null); setLastMove(null); setCustom(true); setCustomPlaying(false); setSamplePlaying(false); setThinking(false);
    setResultDismissed(false);
    setTool('wq'); setMessage('Bàn trống. Tự đặt cả Vua Trắng và Vua Đen.');
  };
  const pickerColor = (color: 'w' | 'b') => {
    setPickerBottomColor(color);
    if (practiceMode === 'mate2' && !custom && !customPlaying) {
      const fen = samplePositions[loadedSampleIndex].fen.split(' ');
      fen[1] = 'w';
      setChess(new Chess(fen.join(' ')));
      setFrom(null);
      setLastMove(null);
      setPuzzleStage(0);
      setSamplePlaying(true);
      setPastPositions([]);
      setThinking(false);
      setResultDismissed(false);
      setMessage(color === 'w'
        ? `Thế mẫu ${String(loadedSampleIndex + 1).padStart(2, '0')}/${samplePositions.length} — Trắng đi, hãy chiếu hết trong 2 nước.`
        : `Thế mẫu ${String(loadedSampleIndex + 1).padStart(2, '0')}/${samplePositions.length} — Trắng đi trước; bạn cầm Đen để phòng thủ.`);
    }
  };
  const startCustom = () => {
    if (!hasBothKings) return;
    setPreserveCustomOrientation(true);
    const fen = chess.fen().split(' ');
    fen[1] = 'w';
    setPastPositions([]);
    setChess(new Chess(fen.join(' '), { skipValidation: true })); setFrom(null); setCustom(false); setCustomPlaying(true); setSamplePlaying(false);
    setPracticeMode('unlimited');
    setResultDismissed(false);
    setMessage(`Ván đấu bắt đầu từ thế cờ của bạn. Trắng đi trước; bạn cầm ${pickerBottomColor === 'w' ? 'Trắng' : 'Đen'}.`);
  };
  const undoMove = () => {
    if (!pastPositions.length) return;
    const undoComputerTurn = (samplePlaying || customPlaying) && chess.turn() === 'w' && lastMove?.color === 'b';
    const index = Math.max(0, pastPositions.length - (undoComputerTurn ? 2 : 1));
    const previous = pastPositions[index];
    setPastPositions(pastPositions.slice(0, index));
    setChess(new Chess(previous.fen, { skipValidation: true }));
    setPuzzleStage(previous.puzzleStage);
    setSamplePlaying(previous.samplePlaying);
    setCustomPlaying(previous.customPlaying);
    setMessage(previous.message);
    setLastMove(previous.lastMove);
    setFrom(null);
    setThinking(false);
    setResultDismissed(false);
    setCustom(false);
  };
  const checkedKing = chess.isCheck()
    ? chess.board().flatMap((row, rank) => row.map((piece, file) => piece?.type === 'k' && piece.color === chess.turn() ? `${files[file]}${8-rank}` : null)).find(Boolean)
    : null;
  const result = chess.isCheckmate()
    ? chess.turn() === playerColor ? 'THẤT BẠI' : 'CHIẾN THẮNG'
    : (customPlaying || (!custom && practiceMode === 'mate2' && playerColor === 'b')) && chess.isDraw() ? 'HÒA CỜ' : null;

  return <main className="chess-app">
    <Sidebar active="puzzle" playerColor={pickerBottomColor} onPlayerColor={customPlaying ? undefined : pickerColor} difficulty={difficulty} onDifficultyChange={setDifficulty}/>
    <section className="arena">
      <header><div><p>{customPlaying ? 'ĐẤU VỚI MÁY' : 'LUYỆN TẬP CHIẾN THUẬT'}</p><h1>{custom ? 'Tự tạo cờ thế' : customPlaying ? 'Đấu đến chiến thắng · Không giới hạn' : practiceMode === 'mate2' && playerColor === 'b' ? 'Cờ thế · Phòng thủ quân Đen' : 'Cờ thế · Chiếu hết trong 2'}</h1></div></header>
      <div className="grid">
        <div className="play">
          <div className="board">{(flipBoard ? [...chess.board()].reverse().map(row => [...row].reverse()) : chess.board()).map((row, r) => row.map((piece, c) => {
            const boardRow = flipBoard ? 7 - r : r;
            const boardColumn = flipBoard ? 7 - c : c;
            const square = `${files[boardColumn]}${8-boardRow}`;
            return <button key={square} onClick={() => clickSquare(r,c)} className={`sq ${(r+c)%2?'dark':'light'} ${from===square?'selected':''} ${targets.includes(square as never)?'can':''} ${lastMove?.from===square||lastMove?.to===square?'was':''} ${checkedKing===square?'in-check':''}`}>
              {c===0&&<span className="rank">{8-boardRow}</span>}{r===7&&<span className="file">{files[boardColumn]}</span>}
              {piece&&<strong className={piece.color}>{symbols[piece.color+piece.type]}</strong>}
            </button>;
          }))}</div>
          {result && !thinking && !resultDismissed && <div className="board-result"><button className="result-badge" onClick={() => setResultDismissed(true)} aria-label={`Đóng thông báo ${result.toLowerCase()}`}>{result}</button></div>}
          {custom && hasBothKings && <button className="play-custom" onClick={startCustom}>▶　CHƠI THẾ CỜ NÀY</button>}
        </div>
        <div className="details-column">
        <aside className="details">
          <div className="title"><span>{custom ? 'THẾ CỜ TỰ TẠO' : customPlaying ? 'ĐẤU VỚI MÁY' : `THẾ CỜ #${String(loadedSampleIndex + 1).padStart(2, '0')}`}</span><b>{thinking ? 'Máy đang nghĩ...' : message}</b></div>
          {custom && <div className="piece-picker">{pickerPieces.map(([key, value]) => <button key={key} className={tool===key?'picked':''} onClick={() => setTool(key)}>{value}</button>)}<button className={tool==='erase'?'picked':''} onClick={() => setTool('erase')}>⌫</button></div>}
          <div className={`notice ${lastMove ? 'last-move-notice' : ''}`}><i>✦</i><b>{lastMove ? `Nước đi gần nhất: ${lastMove.san}` : custom ? 'Đặt quân lên bàn cờ' : customPlaying ? `Bạn cầm quân ${playerColor === 'w' ? 'Trắng' : 'Đen'}` : practiceMode === 'mate2' && playerColor === 'b' ? 'Bạn cầm quân Đen' : 'Gợi ý'}<small>{lastMove ? `${lastMove.color === 'w' ? 'Trắng' : 'Đen'}: ${lastMove.from} → ${lastMove.to}` : custom ? 'Trắng sẽ đi trước; chọn màu bạn muốn cầm trong sidebar.' : customPlaying ? `Máy cầm ${playerColor === 'w' ? 'Đen' : 'Trắng'} và sẽ đáp lại nước đi của bạn.` : practiceMode === 'mate2' && playerColor === 'b' ? 'Máy đi Trắng trước, sau đó bạn đi quân Đen để phòng thủ.' : 'Trắng đi — hãy tìm nước chiếu hết trong 2 nước.'}</small></b></div>
          <div className="sample-label">CHỌN THẾ MẪU ({visiblePositions.length})</div>
          <div className="puzzle-tabs" role="tablist" aria-label="Chế độ cờ thế">
            <button role="tab" aria-selected={practiceMode === 'mate2'} className={practiceMode === 'mate2' ? 'active' : ''} onClick={() => changePracticeMode('mate2')}>CHIẾU HẾT TRONG 2 NƯỚC</button>
            <button role="tab" aria-selected={practiceMode === 'unlimited'} className={practiceMode === 'unlimited' ? 'active' : ''} onClick={() => changePracticeMode('unlimited')}>ĐI ĐẾN CHIẾN THẮNG <small>KHÔNG GIỚI HẠN NƯỚC</small></button>
          </div>
          <div className="sample-grid" aria-label="Chọn thế cờ mẫu">
            {visiblePositions.map((_, index) => <button key={index} className={`sample-card ${loadedSampleIndex === index ? 'active' : ''}`} onClick={() => chooseSample(index)} aria-label={`${practiceMode === 'unlimited' ? 'Chơi' : 'Nạp'} thế mẫu ${index + 1}`} aria-pressed={loadedSampleIndex === index}>
              <span>{String(index + 1).padStart(2, '0')}</span><small>{practiceMode === 'unlimited' ? 'ĐẤU VỚI MÁY' : 'CHIẾU HẾT 2'}</small>
            </button>)}
          </div>
          <button className="confirm-color create-position" onClick={create}>＋　TỰ TẠO THẾ CỜ</button>
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
