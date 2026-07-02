import { useState } from 'react';

export default function LinkPopup({ popup, typesApi, nodeMap, onClose, onSave, onDelete }) {
  const { allTypes } = typesApi;
  const { link, x, y } = popup;
  const [type, setType] = useState(link.type);
  const [label, setLabel] = useState(link.label || '');

  const pw = 260, ph = 160;
  let lx = x + 12, ly = y - 20;
  if (typeof window !== 'undefined') {
    if (lx + pw > window.innerWidth - 10) lx = x - pw - 12;
    if (ly + ph > window.innerHeight - 10) ly = window.innerHeight - ph - 10;
  }

  return (
    <div id="link-popup" className="open" style={{ left: lx, top: ly }}>
      <div id="link-popup-title">СТРЕЛКА</div>
      <select value={type} onChange={e => setType(e.target.value)}>
        {allTypes.map(t => <option value={t.id} key={t.id}>{t.label}</option>)}
      </select>
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="описание отношения" />
      <div id="link-popup-btns">
        <button id="link-popup-save" onClick={() => onSave({ type, label })}>✓ СОХРАНИТЬ</button>
        <button id="link-popup-del" onClick={() => { if (confirm('Удалить эту стрелку?')) onDelete(); }}>✕</button>
        <button id="link-popup-cancel" onClick={onClose}>—</button>
      </div>
    </div>
  );
}
