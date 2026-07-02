export default function TopTabs({ view, setView }) {
  const tabs = [
    { id: 'graph', label: 'ОТНОШЕНИЯ' },
    { id: 'stats', label: 'СТАТИСТИКА' },
    { id: 'profiles', label: 'ПЕРСОНАЖИ' },
    { id: 'world', label: 'МИР' },
  ];
  return (
    <div id="view-tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          className={'view-tab' + (view === t.id ? ' active' : '')}
          onClick={() => setView(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
