import { useEffect, useMemo, useState } from 'react';

const STAT_KEYS = ['Сила', 'Здоровье', 'Скорость', 'Стамина'];

function StatCell({ val, label }) {
  return (
    <div className="td-stat-inner" data-label={label}>
      <div className="bar-bg"><div className="bar-fill" style={{ width: val + '%' }}></div></div>
      <div className="bar-val">{val}%</div>
    </div>
  );
}

export default function StatsView({ active }) {
  const [nodes, setNodes] = useState([]);
  const [sortCol, setSortCol] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    fetch('data.json?v=' + Date.now())
      .then(r => r.json())
      .then(d => setNodes(d.nodes || []))
      .catch(e => console.warn('data.json not found', e));
  }, []);

  const sorted = useMemo(() => {
    const arr = [...nodes];
    arr.sort((a, b) => {
      if (sortCol === 'name') return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      if (sortCol === 'role') return sortAsc ? a.role.localeCompare(b.role) : b.role.localeCompare(a.role);
      const av = (a.stats || {})[sortCol] || 0, bv = (b.stats || {})[sortCol] || 0;
      return sortAsc ? av - bv : bv - av;
    });
    return arr;
  }, [nodes, sortCol, sortAsc]);

  function onSort(col) {
    if (sortCol === col) setSortAsc(a => !a);
    else { setSortCol(col); setSortAsc(col === 'name' || col === 'role'); }
  }

  const cols = [
    ['name', 'ИМЯ'], ['role', 'РОЛЬ'],
    ['Сила', 'СИЛА'], ['Здоровье', 'ЗДОРОВЬЕ'], ['Скорость', 'СКОРОСТЬ'], ['Стамина', 'СТАМИНА'],
  ];

  return (
    <div id="stats-view" className={active ? 'open' : ''}>
      <div id="stats-table-wrap">
        <table id="stats-table">
          <thead>
            <tr>
              {cols.map(([col, label]) => (
                <th key={col} data-col={col} className={sortCol === col ? 'sorted' : ''} onClick={() => onSort(col)}>
                  {label} <span className="sort-arrow">{sortCol === col ? (sortAsc ? '↑' : '↓') : '↕'}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(n => {
              const s = n.stats || {};
              return (
                <tr key={n.id}>
                  <td><div className="td-name">{n.name}</div></td>
                  <td><div className="td-role">{n.role}</div></td>
                  {STAT_KEYS.map(k => (
                    <td className="td-stat" key={k}><StatCell val={s[k] || 0} label={k} /></td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
