import { useEffect, useRef } from 'react';
import { PLAYER_COLORS } from '../constants';

export default function LudoBoard({ players }) {
  const canvasRef = useRef(null);
  const BOARD_SIZE = 450;
  const CELL = BOARD_SIZE / 15;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    drawBoard(ctx);
  }, [players]);

  function drawBoard(ctx) {
    ctx.fillStyle = "#0D1B3E";
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        let fill = "#112247";
        if (r < 6 && c < 6)  fill = "rgba(255,71,87,0.20)";
        if (r < 6 && c > 8)  fill = "rgba(46,134,255,0.20)";
        if (r > 8 && c < 6)  fill = "rgba(46,213,115,0.18)";
        if (r > 8 && c > 8)  fill = "rgba(255,211,42,0.18)";
        if (r >= 6 && r < 9 && c >= 6 && c < 9) fill = "rgba(255,255,255,0.04)";
        if (r === 7 && c >= 1 && c <= 5)  fill = "rgba(46,213,115,0.35)";
        if (r === 7 && c >= 9 && c <= 13) fill = "rgba(46,134,255,0.35)";
        if (c === 7 && r >= 1 && r <= 5)  fill = "rgba(255,71,87,0.35)";
        if (c === 7 && r >= 9 && r <= 13) fill = "rgba(255,211,42,0.35)";
        ctx.fillStyle = fill;
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.strokeRect(c * CELL, r * CELL, CELL, CELL);
      }
    }
    drawCenter(ctx);
    drawHomeZones(ctx);
    drawTokens(ctx);
  }

  function drawCenter(ctx) {
    const cx = 7.5 * CELL, cy = 7.5 * CELL;
    [
      { pts: [[6,6],[9,6],[7.5,7.5]], color: "rgba(255,71,87,0.75)" },
      { pts: [[9,6],[9,9],[7.5,7.5]], color: "rgba(46,134,255,0.75)" },
      { pts: [[9,9],[6,9],[7.5,7.5]], color: "rgba(255,211,42,0.75)" },
      { pts: [[6,9],[6,6],[7.5,7.5]], color: "rgba(46,213,115,0.75)" },
    ].forEach(({ pts, color }) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] * CELL, pts[0][1] * CELL);
      pts.slice(1).forEach(p => ctx.lineTo(p[0] * CELL, p[1] * CELL));
      ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = "rgba(13,27,62,0.5)";
    ctx.beginPath(); ctx.arc(cx, cy, CELL * 0.9, 0, Math.PI * 2); ctx.fill();
    ctx.font = `${CELL * 1.3}px serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🎲", cx, cy);
  }

  function drawHomeZones(ctx) {
    [
      { row: 1, col: 1, color: "rgba(255,71,87,0.55)" },
      { row: 1, col: 9, color: "rgba(46,134,255,0.55)" },
      { row: 9, col: 1, color: "rgba(46,213,115,0.5)" },
      { row: 9, col: 9, color: "rgba(255,211,42,0.55)" },
    ].forEach(({ row, col, color }) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(col * CELL + 4, row * CELL + 4, 4 * CELL - 8, 4 * CELL - 8, 8);
      ctx.fill();
    });
  }

  function drawTokens(ctx) {
    const TOKEN_POSITIONS = {
      red:    [[2.5,2.5],[2.5,3.5],[3.5,2.5],[3.5,3.5]],
      blue:   [[2.5,11.5],[2.5,12.5],[3.5,11.5],[3.5,12.5]],
      green:  [[11.5,2.5],[11.5,3.5],[12.5,2.5],[12.5,3.5]],
      yellow: [[11.5,11.5],[11.5,12.5],[12.5,11.5],[12.5,12.5]],
    };
    players.forEach(p => {
      const color = PLAYER_COLORS[p.color];
      TOKEN_POSITIONS[p.color].forEach(([row, col]) => {
        const x = col * CELL, y = row * CELL, r = CELL * 0.32;
        ctx.shadowColor = color; ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      });
    });
  }

  return <canvas ref={canvasRef} width={BOARD_SIZE} height={BOARD_SIZE} style={{ borderRadius: 16, display: "block" }} />;
}