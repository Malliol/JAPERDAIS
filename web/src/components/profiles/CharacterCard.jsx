export default function CharacterCard({ ch, onOpen }) {
  const cover = ch.images && ch.images.length ? ch.images[0] : '';
  const chips = [];
  if (ch.age) chips.push(ch.age);
  if (ch.nationality) chips.push(ch.nationality);
  if (ch.temperament) chips.push(ch.temperament.split(',')[0].trim());

  return (
    <div className="char-card" onClick={() => onOpen(ch)}>
      <div className="char-card-imgwrap">
        {cover
          ? <img className="char-card-cover" src={cover} loading="lazy" alt={ch.name} />
          : <div className="char-card-cover-placeholder">◉</div>}
        <div className="char-card-scrim"></div>
      </div>
      <div className="char-card-body">
        <div className="char-card-name">{ch.name}</div>
        <div className="char-card-role">{ch.role || '—'}</div>
        {chips.length > 0 && (
          <div className="char-card-tagrow">
            {chips.map((c, i) => <span className="char-card-chip" key={i}>{c}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
