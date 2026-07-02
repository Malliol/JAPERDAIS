import { useCallback, useEffect, useState } from 'react';

export function useGraphData() {
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('data.json?v=' + Date.now())
      .then(r => r.json())
      .then(j => {
        setNodes(j.nodes || []);
        setLinks(j.links || []);
        setLoaded(true);
      })
      .catch(e => { console.warn('data.json not found', e); setLoaded(true); });
  }, []);

  const addLink = useCallback((link) => setLinks(prev => [...prev, link]), []);

  const updateLink = useCallback((idx, patch) => {
    setLinks(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  }, []);

  const deleteLink = useCallback((idx) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const cleanPayload = useCallback(() => ({
    nodes: nodes.map(n => ({ id: n.id, name: n.name, role: n.role, spectrum: n.spectrum, stats: n.stats || {} })),
    links: links.map(l => ({ from: l.from, to: l.to, type: l.type, label: l.label })),
  }), [nodes, links]);

  return { nodes, links, setNodes, setLinks, addLink, updateLink, deleteLink, cleanPayload, loaded };
}
