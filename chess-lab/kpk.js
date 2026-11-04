// King + pawn vs king solver (White has the pawn). Builds a full win/draw
// table with distance, so the computer can play perfectly on both sides.
// Squares: 0..63, sq = file + 8 * (rank - 1).
(function (root) {
  const N = 64 * 64 * 64;               // per side to move
  let T = null;                         // Uint8Array(2N): 0 = draw/illegal/unknown, d>0 = White wins, d = pass resolved
  const adj = [];
  for (let s = 0; s < 64; s++) {
    const f = s & 7, r = s >> 3, a = [];
    for (let df = -1; df <= 1; df++) for (let dr = -1; dr <= 1; dr++) {
      if (!df && !dr) continue;
      const nf = f + df, nr = r + dr;
      if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) a.push(nf + 8 * nr);
    }
    adj.push(a);
  }
  const near = (a, b) => Math.max(Math.abs((a & 7) - (b & 7)), Math.abs((a >> 3) - (b >> 3))) <= 1;
  const pawnAtt = (p, s) => (s >> 3) === (p >> 3) + 1 && Math.abs((s & 7) - (p & 7)) === 1;
  const idx = (stm, wk, bk, wp) => stm * N + (wk * 64 + bk) * 64 + wp;

  function legal(stm, wk, bk, wp) {
    if (wp < 8 || wp >= 56) return false;
    if (wk === bk || wk === wp || bk === wp || near(wk, bk)) return false;
    if (stm === 0 && pawnAtt(wp, bk)) return false;   // White to move, Black king in check: impossible
    return true;
  }
  // queen on q, white king wk, black king bk, Black to move: 'win' | 'draw'
  function queenAttacks(q, s, wk, bk) {
    const qf = q & 7, qr = q >> 3, sf = s & 7, sr = s >> 3;
    const df = Math.sign(sf - qf), dr = Math.sign(sr - qr);
    if (!(qf === sf || qr === sr || Math.abs(sf - qf) === Math.abs(sr - qr)) || q === s) return false;
    let f = qf + df, r = qr + dr;
    while (f !== sf || r !== sr) { const t = f + 8 * r; if (t === wk) return false; f += df; r += dr; }
    return true;   // the black king itself does not block (it is the one moving)
  }
  function afterPromotion(q, wk, bk) {
    if (near(q, bk) && !near(q, wk)) return 'draw';           // Black takes the queen
    const check = queenAttacks(q, bk, wk, bk);
    const esc = adj[bk].some(s => s !== wk && !near(s, wk) && (s === q ? !near(q, wk) : !queenAttacks(q, s, wk, bk)));
    if (!esc && !check) return 'draw';                          // stalemate
    return 'win';
  }
  function wMoves(wk, bk, wp) {   // -> list of {kind, wk, wp, q}
    const out = [];
    for (const s of adj[wk]) if (s !== wp && !near(s, bk)) out.push({ wk: s, wp });
    const one = wp + 8;
    if (one !== wk && one !== bk) {
      if (one >= 56) out.push({ wk, wp: -1, q: one });
      else {
        out.push({ wk, wp: one });
        const two = wp + 16;
        if ((wp >> 3) === 1 && two !== wk && two !== bk) out.push({ wk, wp: two });
      }
    }
    return out;
  }
  function bMoves(wk, bk, wp) {   // -> list of {bk, capture}
    const out = [];
    for (const s of adj[bk]) {
      if (s === wk || near(s, wk) || pawnAtt(wp, s)) continue;
      out.push({ bk: s, capture: s === wp });
    }
    return out;
  }
  function solve() {
    if (T) return T;
    T = new Uint8Array(2 * N);
    const todo = [];
    for (let stm = 0; stm < 2; stm++) for (let wk = 0; wk < 64; wk++) for (let bk = 0; bk < 64; bk++) for (let wp = 8; wp < 56; wp++)
      if (legal(stm, wk, bk, wp)) todo.push(idx(stm, wk, bk, wp));
    let pass = 0, list = todo;
    for (;;) {
      pass++;
      const won = [], rest = [];
      for (const i of list) {
        const stm = i >= N ? 1 : 0, j = i - stm * N, wk = (j >> 12) & 63, bk = (j >> 6) & 63, wp = j & 63;
        let win = false;
        if (stm === 0) {
          for (const m of wMoves(wk, bk, wp)) {
            if (m.q !== undefined) { if (afterPromotion(m.q, m.wk, bk) === 'win') { win = true; break; } }
            else { const v = T[idx(1, m.wk, bk, m.wp)]; if (v && v < pass) { win = true; break; } }
          }
        } else {
          const ms = bMoves(wk, bk, wp);
          if (ms.length === 0) win = pawnAtt(wp, bk);           // mated by king+pawn (rare); stalemate = draw
          else {
            win = true;
            for (const m of ms) { if (m.capture) { win = false; break; } const v = T[idx(0, wk, m.bk, wp)]; if (!v || v >= pass) { win = false; break; } }
          }
        }
        (win ? won : rest).push(i);
      }
      if (!won.length) break;
      for (const i of won) T[i] = pass;
      list = rest;
    }
    return T;
  }
  // Public helpers work on {stm:'w'|'b', wk, bk, wp} with algebraic squares.
  const toSq = a => (a.charCodeAt(0) - 97) + 8 * (+a[1] - 1);
  const toAlg = s => String.fromCharCode(97 + (s & 7)) + ((s >> 3) + 1);
  function value(p) {   // > 0 means White wins (smaller = faster), 0 = draw
    solve();
    const wk = toSq(p.wk), bk = toSq(p.bk), wp = toSq(p.wp), stm = p.stm === 'w' ? 0 : 1;
    if (!legal(stm, wk, bk, wp)) return 0;
    return T[idx(stm, wk, bk, wp)];
  }
  root.KPK = { solve, setTable: t => { T = t; }, ready: () => !!T, value, afterPromotion: (q, wk, bk) => afterPromotion(toSq(q), toSq(wk), toSq(bk)), toSq, toAlg };
})(typeof window !== 'undefined' ? window : globalThis);
