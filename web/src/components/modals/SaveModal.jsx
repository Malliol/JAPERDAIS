import { useEffect, useState } from 'react';

export default function SaveModal({ open, onClose, cleanPayload }) {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');
  const [statusClass, setStatusClass] = useState('modal-status');

  useEffect(() => {
    if (open) {
      const cached = localStorage.getItem('gh_token') || '';
      setToken(cached);
      setStatus('');
      setStatusClass('modal-status');
      if (cached) save(cached);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function save(tok) {
    setStatusClass('modal-status'); setStatus('Сохраняю...');
    const owner = 'malliol', repo = 'JAPERDAIS', path = 'docs/data.json';
    const headers = { 'Authorization': 'token ' + tok, 'Content-Type': 'application/json' };
    try {
      const g = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, { headers });
      if (!g.ok) throw new Error(g.status + ' ' + g.statusText);
      const sha = (await g.json()).sha;
      const payload = cleanPayload();
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
      const p = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT', headers, body: JSON.stringify({ message: 'Update relationship data', content, sha }),
      });
      if (!p.ok) { const e = await p.json(); throw new Error(e.message); }
      setStatusClass('modal-status ok'); setStatus('✓ Сохранено!');
      setTimeout(onClose, 1800);
    } catch (e) {
      setStatusClass('modal-status err'); setStatus('Ошибка: ' + e.message);
    }
  }

  function confirm_() {
    const tok = token.trim();
    if (!tok) { setStatusClass('modal-status err'); setStatus('Введи токен'); return; }
    localStorage.setItem('gh_token', tok);
    save(tok);
  }

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target.classList.contains('modal-overlay')) onClose(); }}>
      <div className="modal-box">
        <h3>СОХРАНИТЬ В РЕПО</h3>
        <p style={{ fontSize: 10, color: 'var(--sub)', lineHeight: 1.8, marginBottom: 14 }}>
          Нужен GitHub токен с правом <strong>repo</strong>.<br />
          <a href="https://github.com/settings/tokens/new?scopes=repo&description=JAPERDAIS+editor" target="_blank" rel="noreferrer" style={{ color: 'var(--fg)' }}>Создать токен →</a><br />
          Токен хранится в localStorage браузера.
        </p>
        <div className="modal-label">ТОКЕН</div>
        <input type="password" className="modal-input" placeholder="ghp_..." style={{ margin: '5px 0 8px' }}
          value={token} onChange={e => setToken(e.target.value)} />
        <div className={statusClass}>{status}</div>
        <div className="modal-btns">
          <button className="mbtn mbtn-cancel" onClick={onClose}>ОТМЕНА</button>
          <button className="mbtn mbtn-ok" onClick={confirm_}>СОХРАНИТЬ</button>
        </div>
      </div>
    </div>
  );
}
