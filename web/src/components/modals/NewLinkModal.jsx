import { useEffect, useState } from 'react';

function typeSvg(t) {
  const d = t.dash === 'dashed' ? '4 4' : t.dash === 'long-dash' ? '8 4' : null;
  return (
    <svg width="28" height="12" viewBox="0 0 28 12">
      <line x1="0" y1="6" x2="28" y2="6" stroke={t.color} strokeWidth="2.5" strokeDasharray={d || undefined} />
    </svg>
  );
}

export default function NewLinkModal({ open, onClose, nodes, typesApi, onCreate }) {
  const { allTypes } = typesApi;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('neu');
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (open && nodes.length) {
      setFrom(nodes[0].id);
      setTo(nodes.length > 1 ? nodes[1].id : nodes[0].id);
      setType('neu');
      setLabel('');
      setStatus('');
    }
  }, [open, nodes]);

  if (!open) return null;

  function confirm_() {
    if (from === to) { setStatus('Нельзя выбрать одного персонажа дважды'); return; }
    if (!label.trim()) { setStatus('Введи описание отношения'); return; }
    onCreate({ from, to, type, label: label.trim() });
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-box">
        <h3>СОЗДАТЬ СТРЕЛКУ</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <div className="modal-label">ОТ КОГО</div>
            <select className="modal-input" style={{ padding: 8 }} value={from} onChange={e => setFrom(e.target.value)}>
              {nodes.map(n => <option value={n.id} key={n.id}>{n.name}</option>)}
            </select>
          </div>
          <div>
            <div className="modal-label">К КОМУ</div>
            <select className="modal-input" style={{ padding: 8 }} value={to} onChange={e => setTo(e.target.value)}>
              {nodes.map(n => <option value={n.id} key={n.id}>{n.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div className="modal-label" style={{ marginBottom: 8 }}>ВИД СВЯЗИ</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allTypes.map(t => (
              <label className="nl-type-row" key={t.id} style={{ borderColor: type === t.id ? 'var(--fg)' : undefined, background: type === t.id ? 'var(--hover)' : undefined }}>
                <input type="radio" name="nl-type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} style={{ display: 'none' }} />
                {typeSvg(t)}<span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="modal-label">ОПИСАНИЕ ОТНОШЕНИЯ</div>
          <input className="modal-input" style={{ marginTop: 5 }} placeholder="например: завидует харизме"
            value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        <div className="modal-status err">{status}</div>
        <div className="modal-btns">
          <button className="mbtn mbtn-cancel" onClick={onClose}>ОТМЕНА</button>
          <button className="mbtn mbtn-ok" onClick={confirm_}>ДОБАВИТЬ</button>
        </div>
      </div>
    </div>
  );
}
