function typeSvg(t) {
  const d = t.dash === 'dashed' ? '4 4' : t.dash === 'long-dash' ? '8 4' : null;
  return (
    <svg width="28" height="12" viewBox="0 0 28 12">
      <line x1="0" y1="6" x2="28" y2="6" stroke={t.color} strokeWidth="2.5" strokeDasharray={d || undefined} />
    </svg>
  );
}

export default function Legend({ allTypes, hiddenTypes, onToggle }) {
  return (
    <div id="legend">
      {allTypes.map(t => (
        <div key={t.id} className={'leg' + (hiddenTypes.has(t.id) ? ' off' : '')} onClick={() => onToggle(t.id)}>
          <div className="leg-line">{typeSvg(t)}</div>{t.label}
        </div>
      ))}
    </div>
  );
}
