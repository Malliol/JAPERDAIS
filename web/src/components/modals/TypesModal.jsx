import { useEffect, useState } from 'react';
import { BUILTIN } from '../../hooks/useTypes.js';

function typeSvg(t) {
  const d = t.dash === 'dashed' ? '4 4' : t.dash === 'long-dash' ? '8 4' : null;
  return (
    <svg width="28" height="12" viewBox="0 0 28 12">
      <line x1="0" y1="6" x2="28" y2="6" stroke={t.color} strokeWidth="2.5" strokeDasharray={d || undefined} />
    </svg>
  );
}

export default function TypesModal({ open, onClose, typesApi }) {
  const { allTypes, addType, updateType, removeType } = typesApi;
  const [editingId, setEditingId] = useState(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#6644cc');
  const [dash, setDash] = useState('solid');
  const [status, setStatus] = useState('');

  function resetForm() {
    setEditingId(null); setLabel(''); setColor('#6644cc'); setDash('solid'); setStatus('');
  }
  useEffect(() => { if (open) resetForm(); }, [open]);

  if (!open) return null;

  function startEdit(t) {
    setEditingId(t.id); setLabel(t.label); setColor(t.color); setDash(t.dash); setStatus('');
  }

  function submit() {
    const lab = label.trim().toUpperCase();
    if (!lab) { setStatus('Введи название'); return; }
    if (editingId) { updateType(editingId, lab, color, dash); resetForm(); }
    else { addType(lab, color, dash); setLabel(''); setStatus(''); }
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-box">
        <h3>ТИПЫ СТРЕЛОК</h3>
        <div id="types-list">
          {allTypes.map(t => {
            const isBuiltin = BUILTIN.some(b => b.id === t.id);
            return (
              <div className={'type-row' + (isBuiltin ? ' builtin' : '') + (t.id === editingId ? ' editing' : '')} key={t.id}>
                <div className="type-row-swatch">{typeSvg(t)}</div>
                <div className="type-row-label">{t.label}</div>
                {!isBuiltin && <button className="type-row-edit" title="Изменить" onClick={() => startEdit(t)}>✏</button>}
                {!isBuiltin && (
                  <button className="type-row-del" onClick={() => { removeType(t.id); if (editingId === t.id) resetForm(); }}>✕</button>
                )}
              </div>
            );
          })}
        </div>
        <div className="type-editor">
          <h4>{editingId ? 'РЕДАКТИРОВАНИЕ ТИПА' : 'НОВЫЙ ТИП'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 12 }}>
            <div>
              <div className="modal-label">НАЗВАНИЕ</div>
              <input className="modal-input" style={{ marginTop: 5 }} placeholder="например: симпатия"
                value={label} onChange={e => setLabel(e.target.value)} />
            </div>
            <div>
              <div className="modal-label">ЦВЕТ</div>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 54, height: 42, border: '2px solid #111', padding: 2, cursor: 'pointer', marginTop: 5, background: '#fff' }} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div className="modal-label" style={{ marginBottom: 8 }}>СТИЛЬ ЛИНИИ</div>
            <div className="style-opts">
              {[['solid', 'СПЛОШНАЯ', null], ['dashed', 'ПУНКТИР', '4 4'], ['long-dash', 'ДЛИННЫЙ', '8 4']].map(([val, txt, dasharr]) => (
                <label className="style-opt" key={val} style={{ borderColor: dash === val ? 'var(--fg)' : undefined, background: dash === val ? 'var(--hover)' : undefined }}>
                  <input type="radio" name="nt-dash" checked={dash === val} onChange={() => setDash(val)} />
                  <svg width="32" height="12"><line x1="0" y1="6" x2="32" y2="6" stroke="#555" strokeWidth="2" strokeDasharray={dasharr || undefined} /></svg>
                  <span style={{ fontSize: 9, letterSpacing: 1, color: '#555' }}>{txt}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="modal-status err">{status}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mbtn mbtn-ok" style={{ flex: 1 }} onClick={submit}>
              {editingId ? '✓ СОХРАНИТЬ ИЗМЕНЕНИЯ' : '+ ДОБАВИТЬ ТИП'}
            </button>
            {editingId && <button className="mbtn mbtn-cancel" onClick={resetForm}>ОТМЕНА</button>}
          </div>
        </div>
        <div className="modal-btns" style={{ marginTop: 20 }}>
          <button className="mbtn mbtn-cancel" onClick={onClose}>ЗАКРЫТЬ</button>
        </div>
      </div>
    </div>
  );
}
