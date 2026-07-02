import { useEffect, useRef, useState } from 'react';
import Legend from './Legend.jsx';
import ModeToggle from './ModeToggle.jsx';
import NodeSidebar from './NodeSidebar.jsx';
import LinkPopup from './LinkPopup.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function GraphView({ active, nodes, links, typesApi, onUpdateLink, onDeleteLink, onAddLink }) {
  const canvasRef = useRef(null);
  const tipRef = useRef(null);
  const { animEnabled, theme } = useSettings();
  const { allTypes, typeById } = typesApi;

  const [mode3D, setMode3D] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState(() => new Set());
  const [focusedId, setFocusedId] = useState(null);
  const [popupLink, setPopupLink] = useState(null); // {idx, link, x, y}

  // engine holds mutable runtime state that must NOT trigger re-renders every frame
  const engine = useRef({
    NODES: [], LINKS: [], nodeMap: {}, outgoing: {}, incoming: {},
    W: 0, H: 0, cx: 0, cy: 0, DPR: 1,
    animT: 0, dashOffset: 0, rafId: null,
    rot: { x: 0.25, y: 0 }, isDragging: false, lastMX: 0, lastMY: 0,
    autoRotSpeed: 0.003, sphere3D: [], sphRadius: 0,
    hoveredNode: null, hoveredLink: null, selectedLink: null,
    mode3D: false, focusedId: null, hiddenTypes: new Set(),
    animEnabled: true, theme: 'light',
  });

  // keep engine flags in sync with react state (cheap refs, no redraw cost)
  useEffect(() => { engine.current.mode3D = mode3D; }, [mode3D]);
  useEffect(() => { engine.current.focusedId = focusedId; }, [focusedId]);
  useEffect(() => { engine.current.hiddenTypes = hiddenTypes; }, [hiddenTypes]);
  useEffect(() => { engine.current.animEnabled = animEnabled; }, [animEnabled]);
  useEffect(() => { engine.current.theme = theme; }, [theme]);
  useEffect(() => {
    engine.current.selectedLink = popupLink ? popupLink.link : null;
  }, [popupLink]);

  // rebuild working NODES array (with runtime x/y/z fields) when logical nodes change
  useEffect(() => {
    const e = engine.current;
    const prevById = {};
    e.NODES.forEach(n => { prevById[n.id] = n; });
    e.NODES = nodes.map(n => ({ ...n, ...(prevById[n.id] ? { x: prevById[n.id].x, y: prevById[n.id].y, bx: prevById[n.id].bx, by: prevById[n.id].by, z: prevById[n.id].z, pscale: prevById[n.id].pscale } : {}) }));
    e.LINKS = links;
    e.nodeMap = {}; e.outgoing = {}; e.incoming = {};
    e.NODES.forEach(n => { e.nodeMap[n.id] = n; e.outgoing[n.id] = []; e.incoming[n.id] = []; });
    e.LINKS.forEach(l => { if (e.outgoing[l.from]) e.outgoing[l.from].push(l); if (e.incoming[l.to]) e.incoming[l.to].push(l); });
    positionNodes2D();
    buildSphere3D();
  }, [nodes, links]);

  function typeByIdLive(id) { return typeById(id); }

  function positionNodes2D() {
    const e = engine.current;
    const r2 = Math.min(e.W, e.H) * 0.34;
    e.NODES.forEach((n, i) => {
      const a = (i / e.NODES.length) * 2 * Math.PI - Math.PI / 2;
      n.bx = e.cx + r2 * Math.cos(a); n.by = e.cy + r2 * Math.sin(a);
      if (n.x == null) { n.x = n.bx; n.y = n.by; }
    });
  }
  function buildSphere3D() {
    const e = engine.current;
    e.sphere3D = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    const n = e.NODES.length;
    for (let i = 0; i < n; i++) {
      const y = n > 1 ? 1 - (i / (n - 1)) * 2 : 0;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      e.sphere3D.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
    }
  }
  function rotateVec(v, rx, ry) {
    let x = v.x * Math.cos(ry) + v.z * Math.sin(ry);
    let y = v.y;
    let z = -v.x * Math.sin(ry) + v.z * Math.cos(ry);
    const y2 = y * Math.cos(rx) - z * Math.sin(rx);
    const z2 = y * Math.sin(rx) + z * Math.cos(rx);
    return { x, y: y2, z: z2 };
  }
  function project3D(p, e) {
    const fov = 800, dist = 2.5;
    const scale = fov / (dist + p.z);
    return { x: e.cx + p.x * scale * (e.sphRadius / fov), y: e.cy + p.y * scale * (e.sphRadius / fov), z: p.z, scale };
  }
  function updateNodes3D() {
    const e = engine.current;
    e.NODES.forEach((n, i) => {
      const r = rotateVec(e.sphere3D[i], e.rot.x, e.rot.y);
      const fov = 800, dist = 2.5, s = fov / (dist + r.z);
      n.x = e.cx + r.x * s * (e.sphRadius / fov);
      n.y = e.cy + r.y * s * (e.sphRadius / fov);
      n.z = r.z;
      n.pscale = (fov / (dist + r.z)) / (fov / (dist + 1));
    });
  }

  function edgeAlpha(l) {
    const e = engine.current;
    if (e.hiddenTypes.has(l.type)) return 0;
    if (e.focusedId && l.from !== e.focusedId && l.to !== e.focusedId) return e.mode3D ? 0.03 : 0.05;
    const t = typeByIdLive(l.type);
    return t.dash !== 'solid' ? 0.65 : 0.95;
  }
  function nodeBaseAlpha(n) {
    const e = engine.current;
    if (!e.focusedId) return 1;
    if (n.id === e.focusedId) return 1;
    return e.LINKS.some(l => (l.from === e.focusedId && l.to === n.id) || (l.to === e.focusedId && l.from === n.id)) ? 0.9 : 0.15;
  }
  function getBidi() {
    const e = engine.current;
    const s = new Set();
    e.LINKS.forEach(a => e.LINKS.forEach(b => { if (a.from === b.to && a.to === b.from) s.add(a.from + '->' + a.to); }));
    return s;
  }

  function drawArrow(ctx, x1, y1, x2, y2, t, alpha, isBi, r1, r2, dashOffset, extraWidth = 0) {
    const color = t.color;
    const dx = x2 - x1, dy = y2 - y1, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return;
    const ux = dx / dist, uy = dy / dist;
    const sx = x1 + ux * r1, sy = y1 + uy * r1, ex = x2 - ux * r2, ey = y2 - uy * r2;
    const mx = (sx + ex) / 2, my = (sy + ey) / 2, bend = isBi ? dist * .22 : dist * .08;
    const cpx = mx + (-uy) * bend, cpy = my + ux * bend;
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color;
    ctx.lineWidth = (t.dash !== 'solid' ? 1.5 : 2.2) + extraWidth;
    if (t.dash === 'dashed') { ctx.setLineDash([5, 5]); ctx.lineDashOffset = -dashOffset; }
    else if (t.dash === 'long-dash') { ctx.setLineDash([10, 5]); ctx.lineDashOffset = -dashOffset; }
    else ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cpx, cpy, ex, ey); ctx.stroke();
    ctx.setLineDash([]); ctx.lineDashOffset = 0;
    const tp = .88;
    const ax = (1 - tp) ** 2 * sx + 2 * (1 - tp) * tp * cpx + tp * tp * ex;
    const ay = (1 - tp) ** 2 * sy + 2 * (1 - tp) * tp * cpy + tp * tp * ey;
    const tlen = Math.sqrt((ex - ax) ** 2 + (ey - ay) ** 2) || 1;
    const tx = (ex - ax) / tlen, ty = (ey - ay) / tlen, arr = 8 * (r2 / 34);
    ctx.beginPath(); ctx.moveTo(ex, ey);
    ctx.lineTo(ex - arr * tx + arr * .4 * (-ty), ey - arr * ty + arr * .4 * tx);
    ctx.lineTo(ex - arr * tx - arr * .4 * (-ty), ey - arr * ty - arr * .4 * tx);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }

  function draw() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const e = engine.current;
    if (!e.NODES.length) return;
    const dark = e.theme === 'dark';
    const BG = dark ? '#111' : '#fff', FG = dark ? '#e0e0e0' : '#000', STROKE = dark ? '#bbb' : '#222';
    ctx.clearRect(0, 0, e.W, e.H); ctx.fillStyle = BG; ctx.fillRect(0, 0, e.W, e.H);

    if (e.mode3D) {
      ctx.save(); ctx.globalAlpha = 0.04; ctx.strokeStyle = FG;
      const steps = 8;
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI;
        ctx.beginPath();
        for (let j = 0; j <= 60; j++) {
          const b = (j / 60) * 2 * Math.PI;
          const v = { x: Math.sin(a) * Math.cos(b), y: Math.cos(a), z: Math.sin(a) * Math.sin(b) };
          const r = rotateVec(v, e.rot.x, e.rot.y);
          const fov = 800, dist = 2.5, s = fov / (dist + r.z);
          const px = e.cx + r.x * s * (e.sphRadius / fov);
          const py = e.cy + r.y * s * (e.sphRadius / fov);
          j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    const bidi = getBidi();
    const sortedLinks = e.mode3D
      ? [...e.LINKS].sort((a, b) => {
          const za = (e.nodeMap[a.from]?.z || 0) + (e.nodeMap[a.to]?.z || 0);
          const zb = (e.nodeMap[b.from]?.z || 0) + (e.nodeMap[b.to]?.z || 0);
          return za - zb;
        })
      : e.LINKS;

    sortedLinks.forEach(link => {
      let alpha = edgeAlpha(link); if (!alpha) return;
      const f = e.nodeMap[link.from], t2 = e.nodeMap[link.to]; if (!f || !t2) return;
      const r1 = e.mode3D ? 34 * f.pscale : 34, r2d = e.mode3D ? 34 * t2.pscale : 34;
      const isHov = (link === e.hoveredLink || link === e.selectedLink);
      if (isHov) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 8; }
      drawArrow(ctx, f.x, f.y, t2.x, t2.y, typeByIdLive(link.type), isHov ? 1 : alpha, bidi.has(link.from + '->' + link.to), r1, r2d, e.dashOffset, isHov ? 3.5 : 0);
      if (isHov) ctx.restore();
    });

    const sortedNodes = e.mode3D ? [...e.NODES].sort((a, b) => a.z - b.z) : e.NODES;
    sortedNodes.forEach(n => {
      const a = nodeBaseAlpha(n);
      const focused = n.id === e.focusedId, hovered = n === e.hoveredNode;
      const R = e.mode3D ? Math.max(14, 34 * (n.pscale || 1)) : 34;
      const depthA = e.mode3D ? Math.max(0.25, ((n.z || 0) + 1) / 2 * 0.75 + 0.25) : 1;
      ctx.save(); ctx.globalAlpha = a * depthA;
      ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = focused ? 16 : 6; ctx.shadowOffsetY = focused ? 4 : 2;
      ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2);
      ctx.fillStyle = focused ? FG : BG; ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = focused ? FG : (hovered ? FG : STROKE);
      ctx.lineWidth = focused ? 3 : (hovered ? 2.5 : 1.5); ctx.stroke();
      const fs = Math.round(12 * Math.min(1, R / 34));
      if (R > 18) {
        ctx.fillStyle = focused ? BG : (a > .5 ? FG : (dark ? '#555' : '#ddd'));
        ctx.font = `bold ${fs}px -apple-system, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(n.name, n.x, n.y - (R > 25 ? 6 : 0));
        if (R > 25) {
          ctx.fillStyle = focused ? (dark ? '#666' : '#aaa') : (a > .5 ? (dark ? '#888' : '#555') : (dark ? '#444' : '#ddd'));
          ctx.font = `${Math.round(8 * Math.min(1, R / 34))}px -apple-system, sans-serif`;
          ctx.fillText(n.role, n.x, n.y + 9 * (R / 34));
        }
      }
      ctx.restore();
    });
  }

  function getNodeAt(mx, my) {
    const e = engine.current;
    const ordered = e.mode3D ? [...e.NODES].sort((a, b) => b.z - a.z) : e.NODES;
    return ordered.find(n => {
      const R = e.mode3D ? Math.max(14, 34 * (n.pscale || 1)) : 34;
      return (mx - n.x) ** 2 + (my - n.y) ** 2 < R * R;
    });
  }
  function getLinkControlPoint(link) {
    const e = engine.current;
    const f = e.nodeMap[link.from], t = e.nodeMap[link.to]; if (!f || !t) return null;
    const bidi = getBidi();
    const dx = t.x - f.x, dy = t.y - f.y, dist = Math.sqrt(dx * dx + dy * dy); if (dist < 1) return null;
    const ux = dx / dist, uy = dy / dist, R = 34;
    const sx = f.x + ux * R, sy = f.y + uy * R, ex = t.x - ux * R, ey = t.y - uy * R;
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const isBi = bidi.has(link.from + '->' + link.to);
    const bend = isBi ? dist * .22 : dist * .08;
    return { sx, sy, ex, ey, cpx: mx + (-uy) * bend, cpy: my + ux * bend };
  }
  function getLinkAt(mx, my) {
    const e = engine.current;
    const THRESH = 10;
    for (let i = e.LINKS.length - 1; i >= 0; i--) {
      const link = e.LINKS[i];
      if (e.hiddenTypes.has(link.type)) continue;
      const cp = getLinkControlPoint(link); if (!cp) continue;
      const { sx, sy, ex, ey, cpx, cpy } = cp;
      for (let t2 = 0; t2 <= 1; t2 += 1 / 30) {
        const bx = (1 - t2) ** 2 * sx + 2 * (1 - t2) * t2 * cpx + t2 * t2 * ex;
        const by = (1 - t2) ** 2 * sy + 2 * (1 - t2) * t2 * cpy + t2 * t2 * ey;
        if ((mx - bx) ** 2 + (my - by) ** 2 < THRESH * THRESH) return { link, idx: i };
      }
    }
    return null;
  }

  // ── resize + animation loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    function resize() {
      const e = engine.current;
      e.DPR = window.devicePixelRatio || 1; e.W = window.innerWidth; e.H = window.innerHeight;
      canvas.width = e.W * e.DPR; canvas.height = e.H * e.DPR;
      canvas.style.width = e.W + 'px'; canvas.style.height = e.H + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(e.DPR, 0, 0, e.DPR, 0, 0);
      e.cx = e.W / 2; e.cy = e.H / 2;
      e.sphRadius = Math.min(e.W, e.H) * 0.3;
      positionNodes2D();
      buildSphere3D();
    }
    resize();
    window.addEventListener('resize', resize);

    function loop() {
      const e = engine.current;
      e.rafId = requestAnimationFrame(loop);
      if (!e.animEnabled) { draw(); return; }
      e.animT += 0.016;
      e.dashOffset = (e.dashOffset + 0.3) % 20;
      if (e.mode3D) {
        if (!e.isDragging) e.rot.y += e.autoRotSpeed;
        updateNodes3D();
      } else {
        e.NODES.forEach((n, i) => {
          const phase = (i / e.NODES.length) * Math.PI * 2;
          n.x = n.bx + Math.sin(e.animT * 0.7 + phase) * 3;
          n.y = n.by + Math.cos(e.animT * 0.5 + phase) * 2;
        });
      }
      draw();
    }
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      if (engine.current.rafId) cancelAnimationFrame(engine.current.rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── mouse / touch ──
  useEffect(() => {
    const canvas = canvasRef.current;
    const e = engine.current;

    function onMouseDown(ev) {
      if (e.mode3D) { e.isDragging = true; e.lastMX = ev.clientX; e.lastMY = ev.clientY; canvas.style.cursor = 'grabbing'; }
    }
    function onMouseMove(ev) {
      const r = canvas.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      if (e.mode3D && e.isDragging) {
        e.rot.y += (ev.clientX - e.lastMX) * 0.006;
        e.rot.x += (ev.clientY - e.lastMY) * 0.006;
        e.rot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, e.rot.x));
        e.lastMX = ev.clientX; e.lastMY = ev.clientY;
        return;
      }
      e.hoveredNode = getNodeAt(mx, my);
      const linkHit = e.hoveredNode ? null : getLinkAt(mx, my);
      e.hoveredLink = linkHit ? linkHit.link : null;
      const tip = tipRef.current;
      if (!tip) return;
      if (e.hoveredNode) {
        canvas.style.cursor = 'pointer';
        tip.style.display = 'block';
        tip.style.left = (ev.clientX + 14) + 'px';
        tip.style.top = (ev.clientY - 10) + 'px';
        tip.textContent = e.hoveredNode.spectrum || '';
      } else if (e.hoveredLink) {
        canvas.style.cursor = 'pointer';
        tip.style.display = 'block';
        tip.style.left = (ev.clientX + 14) + 'px';
        tip.style.top = (ev.clientY - 10) + 'px';
        const f = e.nodeMap[e.hoveredLink.from], t = e.nodeMap[e.hoveredLink.to];
        tip.textContent = `${f?.name || '?'} → ${t?.name || '?'}: ${e.hoveredLink.label || '—'}`;
      } else {
        canvas.style.cursor = e.mode3D ? 'grab' : 'default';
        tip.style.display = 'none';
      }
    }
    function onMouseUp(ev) {
      if (e.mode3D && e.isDragging) {
        e.isDragging = false;
        canvas.style.cursor = 'grab';
        const r = canvas.getBoundingClientRect();
        const node = getNodeAt(ev.clientX - r.left, ev.clientY - r.top);
        if (node) {
          setFocusedId(prev => {
            const next = prev === node.id ? null : node.id;
            return next;
          });
        }
      }
    }
    function onClick(ev) {
      if (e.mode3D) return;
      const r = canvas.getBoundingClientRect();
      const mx = ev.clientX - r.left, my = ev.clientY - r.top;
      const node = getNodeAt(mx, my);
      if (node) {
        setPopupLink(null);
        setFocusedId(prev => prev === node.id ? null : node.id);
      } else {
        const hit = getLinkAt(mx, my);
        if (hit) {
          setPopupLink({ idx: hit.idx, link: hit.link, x: ev.clientX, y: ev.clientY });
        } else {
          setFocusedId(null);
          setPopupLink(null);
        }
      }
    }
    function onMouseLeave() {
      e.isDragging = false; e.hoveredNode = null;
      if (tipRef.current) tipRef.current.style.display = 'none';
      canvas.style.cursor = e.mode3D ? 'grab' : 'default';
    }

    let touchStartX = 0, touchStartY = 0, touchMoved = false;
    function onTouchStart(ev) {
      ev.preventDefault();
      const t = ev.touches[0];
      touchStartX = t.clientX; touchStartY = t.clientY; touchMoved = false;
      if (e.mode3D) { e.isDragging = true; e.lastMX = t.clientX; e.lastMY = t.clientY; }
    }
    function onTouchMove(ev) {
      ev.preventDefault();
      const t = ev.touches[0];
      const dx = t.clientX - touchStartX, dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) touchMoved = true;
      if (e.mode3D && e.isDragging) {
        e.rot.y += (t.clientX - e.lastMX) * 0.006;
        e.rot.x += (t.clientY - e.lastMY) * 0.006;
        e.rot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, e.rot.x));
        e.lastMX = t.clientX; e.lastMY = t.clientY;
      }
    }
    function onTouchEnd(ev) {
      ev.preventDefault();
      e.isDragging = false;
      if (touchMoved) return;
      const r = canvas.getBoundingClientRect();
      const mx = touchStartX - r.left, my = touchStartY - r.top;
      const node = getNodeAt(mx, my);
      if (node) {
        setPopupLink(null);
        setFocusedId(prev => prev === node.id ? null : node.id);
      } else if (!e.mode3D) {
        const hit = getLinkAt(mx, my);
        if (hit) setPopupLink({ idx: hit.idx, link: hit.link, x: touchStartX, y: touchStartY });
        else { setFocusedId(null); setPopupLink(null); }
      }
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  function toggleType(id) {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const focusedNode = focusedId ? engine.current.nodeMap[focusedId] : null;

  return (
    <>
      <canvas id="canvas" ref={canvasRef} style={{ display: active ? 'block' : 'none' }}></canvas>
      {active && (
        <>
          <div id="hdr"><h1>JAPERDAIS · ДИАГРАММА ОТНОШЕНИЙ</h1></div>
          <Legend allTypes={allTypes} hiddenTypes={hiddenTypes} onToggle={toggleType} />
          <ModeToggle mode3D={mode3D} setMode3D={setMode3D} />
          <div id="tip" ref={tipRef}></div>
          {focusedNode && (
            <NodeSidebar
              node={focusedNode}
              nodes={nodes}
              links={links}
              typesApi={typesApi}
              onClose={() => setFocusedId(null)}
              onAddLink={onAddLink}
              onUpdateLink={onUpdateLink}
              onDeleteLink={onDeleteLink}
            />
          )}
          {popupLink && (
            <LinkPopup
              popup={popupLink}
              typesApi={typesApi}
              nodeMap={engine.current.nodeMap}
              onClose={() => setPopupLink(null)}
              onSave={(patch) => { onUpdateLink(popupLink.idx, patch); setPopupLink(null); }}
              onDelete={() => { onDeleteLink(popupLink.idx); setPopupLink(null); }}
            />
          )}
        </>
      )}
    </>
  );
}
