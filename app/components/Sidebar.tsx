'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Sidebar({ active, showDifficulty = true, playerColor = 'w', onPlayerColor, difficulty = 20, onDifficultyChange }: { active: 'game' | 'puzzle'; showDifficulty?: boolean; playerColor?: 'w'|'b'; onPlayerColor?: (color: 'w'|'b') => void; difficulty?: number; onDifficultyChange?: (level: number) => void }) {
  const [pendingColor, setPendingColor] = useState<'w' | 'b'>(playerColor);
  useEffect(() => setPendingColor(playerColor), [playerColor]);
  return <aside className="side"><div className="brand"><i>♞</i><div><b>CHECKMATE</b><span>CHESS ARENA</span></div></div><nav>
    <Link className={active === 'game' ? 'active nav-link' : 'nav-link'} href="/">
      <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5.5" r="3"/><path d="M9 9h6l-.5 4 2.5 4H7l2.5-4L9 9ZM5.5 21h13"/></svg><span>Ván đấu mới</span>
    </Link>
    <Link className={active === 'puzzle' ? 'active nav-link' : 'nav-link'} href="/co-the">
      <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5" className="nav-icon-highlight"/></svg><span>Cờ thế</span>
    </Link>
  </nav>{showDifficulty&&<div className="engine"><div><em/> MÁY <small>SẴN SÀNG</small></div><p>Độ khó <b>{difficulty}/20</b></p><input aria-label="Độ khó máy cờ" type="range" min="1" max="20" value={difficulty} onChange={event=>onDifficultyChange?.(Number(event.target.value))}/><p>Chọn cờ</p><div className="color-picker"><button disabled={!onPlayerColor} className={pendingColor==='w'?'picked':''} onClick={()=>setPendingColor('w')}><span className="color-icon">♔</span><span>Trắng</span></button><button disabled={!onPlayerColor} className={pendingColor==='b'?'picked':''} onClick={()=>setPendingColor('b')}><span className="color-icon">♚</span><span>Đen</span></button></div><button className="confirm-color" disabled={!onPlayerColor} onClick={()=>onPlayerColor?.(pendingColor)}>XÁC NHẬN</button></div>}</aside>;
}
