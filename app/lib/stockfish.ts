type PendingSearch = {
  resolve: (move: string) => void;
  reject: (error: Error) => void;
  phase: "ready" | "search";
  fen: string;
  depth: number;
};

let worker: Worker | null = null;
let initPromise: Promise<void> | null = null;
let pending: PendingSearch | null = null;
let searchQueue: Promise<void> = Promise.resolve();

function initializeEngine(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = new Promise((resolve, reject) => {
    try {
      worker = new Worker("/stockfish/stockfish-19-lite-single.js");
      worker.onmessage = (event: MessageEvent<string>) => {
        const line = String(event.data).trim();
        if (line === "uciok") { resolve(); return; }
        if (line === "readyok" && pending?.phase === "ready") {
          pending.phase = "search";
          worker?.postMessage("position fen " + pending.fen);
          worker?.postMessage("go depth " + pending.depth);
          return;
        }
        if (line.startsWith("bestmove ")) {
          const move = line.split(/\s+/)[1];
          const current = pending;
          pending = null;
          if (!current) return;
          if (!move || move === "(none)" || move === "0000") current.reject(new Error("Stockfish không tìm thấy nước đi hợp lệ."));
          else current.resolve(move);
        }
      };
      worker.onerror = () => {
        const error = new Error("Không tải được Stockfish. Hãy tải lại trang và thử lại.");
        pending?.reject(error);
        pending = null;
        reject(error);
        worker?.terminate();
        worker = null;
        initPromise = null;
      };
      worker.postMessage("uci");
    } catch (error) {
      initPromise = null;
      reject(error instanceof Error ? error : new Error("Không khởi động được Stockfish."));
    }
  });
  return initPromise;
}

export function getStockfishMove(fen: string, skillLevel: number): Promise<string> {
  const search = async () => {
    await initializeEngine();
    if (!worker) throw new Error("Stockfish chưa sẵn sàng.");
    return new Promise<string>((resolve, reject) => {
      const clampedLevel = Math.max(1, Math.min(20, Math.round(skillLevel)));
      const depth = Math.min(16, 8 + Math.floor(clampedLevel * 0.4));
      pending = { resolve, reject, phase: "ready", fen, depth };
      worker?.postMessage("setoption name Skill Level value " + clampedLevel);
      worker?.postMessage("isready");
    });
  };
  const result = searchQueue.then(search, search);
  searchQueue = result.then(() => undefined, () => undefined);
  return result;
}
