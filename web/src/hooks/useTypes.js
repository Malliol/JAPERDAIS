import { useCallback, useState } from 'react';

export const BUILTIN = [
  { id: 'pos', label: 'ПОЛОЖИТЕЛЬНО', color: '#1a9950', dash: 'solid' },
  { id: 'neg', label: 'НЕГАТИВНО', color: '#cc1133', dash: 'solid' },
  { id: 'neu', label: 'НЕЙТРАЛЬНО', color: '#888888', dash: 'dashed' },
  { id: 'envy', label: 'ЗАВИСТЬ', color: '#c47800', dash: 'long-dash' },
];

function loadCustom() {
  try { return JSON.parse(localStorage.getItem('custom_types') || '[]'); } catch { return []; }
}
function saveCustom(arr) {
  localStorage.setItem('custom_types', JSON.stringify(arr));
}

export function useTypes() {
  const [customTypes, setCustomTypes] = useState(loadCustom);

  const allTypes = [...BUILTIN, ...customTypes];
  const typeById = useCallback((id) => allTypes.find(t => t.id === id) || { id, label: id, color: '#888', dash: 'solid' }, [customTypes]);

  const addType = useCallback((label, color, dash) => {
    const id = 'custom_' + Date.now();
    const next = [...loadCustom(), { id, label, color, dash }];
    saveCustom(next);
    setCustomTypes(next);
    return id;
  }, []);

  const updateType = useCallback((id, label, color, dash) => {
    const next = loadCustom().map(t => t.id === id ? { ...t, label, color, dash } : t);
    saveCustom(next);
    setCustomTypes(next);
  }, []);

  const removeType = useCallback((id) => {
    const next = loadCustom().filter(t => t.id !== id);
    saveCustom(next);
    setCustomTypes(next);
  }, []);

  return { allTypes, typeById, addType, updateType, removeType, customTypes };
}

export function typeSvg(t) {
  const d = t.dash === 'dashed' ? 'stroke-dasharray="4 4"' : t.dash === 'long-dash' ? 'stroke-dasharray="8 4"' : '';
  return `<svg width="28" height="12" viewBox="0 0 28 12"><line x1="0" y1="6" x2="28" y2="6" stroke="${t.color}" stroke-width="2.5" ${d}/></svg>`;
}
