import { useState } from 'react';

function QuoteList({ title, quotes, peerKey, id }) {
  const [expanded, setExpanded] = useState(false);
  if (!quotes || !quotes.length) return null;
  const shown = expanded ? quotes : quotes.slice(0, 2);
  return (
    <div className="char-modal-section">
      <div className="char-modal-section-title">{title}</div>
      <div>
        {shown.map((q, i) => (
          <div className="quote-block" key={i}>
            <div className="quote-peer">{q[peerKey]}</div>
            <div className="quote-tone">{q.tone}</div>
            <div className="quote-text">«{q.text}»</div>
          </div>
        ))}
      </div>
      {quotes.length > 2 && (
        <span className="quote-toggle" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Свернуть' : `Показать все ${quotes.length}`}
        </span>
      )}
    </div>
  );
}

export default function CharacterModal({ ch, onClose }) {
  if (!ch) return null;
  const cover = ch.images && ch.images.length ? ch.images[0] : '';

  const tags = [];
  if (ch.age) tags.push(['👤', ch.age]);
  if (ch.height) tags.push(['↕', ch.height + ' см']);
  if (ch.temperament) tags.push(['🧠', ch.temperament]);
  if (ch.zodiac) tags.push(['♒', ch.zodiac]);

  const dossier = [
    ['Национальность', ch.nationality],
    ['Мировоззрение', ch.worldview],
    ['Семейное положение', ch.family],
    ['Ориентация', ch.orientation],
  ].filter(([, v]) => v && v !== '-');

  const statKeys = ['Сила', 'Здоровье', 'Скорость', 'Стамина'];

  return (
    <div id="char-modal" className="open" onClick={e => { if (e.target.id === 'char-modal') onClose(); }}>
      <div id="char-modal-inner">
        <button id="char-modal-close" onClick={onClose}>×</button>
        <div id="char-modal-img-wrap">
          {cover
            ? <img className="char-modal-cover" src={cover} alt={ch.name} />
            : <div className="char-modal-cover-placeholder">◉</div>}
        </div>
        <div className="char-modal-body">
          <div className="char-modal-name">{ch.name}</div>
          <div className="char-modal-role">{ch.role || '—'}</div>
          {ch.spectrum && <div className="char-modal-spectrum">{ch.spectrum}</div>}
          <div className="char-modal-status-row">
            {tags.map(([icon, val], i) => <div className="char-modal-tag" key={i}>{icon} {val}</div>)}
          </div>

          {dossier.length > 0 && (
            <div className="char-modal-section">
              <div className="char-modal-section-title">Досье</div>
              <div className="dossier">
                {dossier.map(([k, v]) => (
                  <div className="dossier-row" key={k}>
                    <span className="dossier-k">{k}</span>
                    <span className="dossier-v">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ch.stats && Object.keys(ch.stats).length > 0 && (
            <div className="char-modal-section">
              <div className="char-modal-section-title">Характеристики</div>
              {statKeys.map(k => ch.stats[k] != null && (
                <div className="cm-stat" key={k}>
                  <span className="cm-stat-k">{k}</span>
                  <span className="cm-stat-bar"><span className="cm-stat-fill" style={{ width: ch.stats[k] + '%' }}></span></span>
                  <span className="cm-stat-v">{ch.stats[k]}%</span>
                </div>
              ))}
            </div>
          )}

          {ch.paths && ch.paths.length > 0 && (
            <div className="char-modal-section">
              <div className="char-modal-section-title">Пути персонажа</div>
              <div className="char-paths">
                {ch.paths.map((p, i) => <div className="char-path-item" key={i}>{p}</div>)}
              </div>
            </div>
          )}

          {ch.name_meaning && (
            <div className="char-modal-section">
              <div className="char-modal-section-title">Значение имени</div>
              <div className="char-modal-text">{ch.name_meaning}</div>
            </div>
          )}

          {ch.bio_short && (
            <div className="char-modal-section">
              <div className="char-modal-section-title">Биография</div>
              <div className="char-modal-text">{ch.bio_short}</div>
            </div>
          )}

          {ch.facts && ch.facts.length > 0 && (
            <div className="char-modal-section">
              <div className="char-modal-section-title">Факты</div>
              <ul className="char-modal-facts">
                {ch.facts.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          <QuoteList title={`Что ${ch.name} думает о других`} quotes={ch.quotes_about_others} peerKey="to" />
          <QuoteList title={`Что другие думают о ${ch.name}`} quotes={ch.quotes_from_others} peerKey="from" />

          {ch.images && ch.images.length > 1 && (
            <div className="char-modal-section">
              <div className="char-modal-section-title">Внешность</div>
              <div className="char-gallery">
                {ch.images.slice(1).map((p, i) => (
                  <img className="char-gallery-img" key={i} src={p} loading="lazy" onClick={() => window.open(p, '_blank')} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
