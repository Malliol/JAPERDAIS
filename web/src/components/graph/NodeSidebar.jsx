import { useState } from 'react';

function RelRow({ link, idx, isOutgoing, currentNode, nodes, nodeMap, typesApi, onUpdateLink, onDeleteLink }) {
  const [editing, setEditing] = useState(false);
  const { allTypes, typeById } = typesApi;
  const peerId = isOutgoing ? link.to : link.from;
  const peer = nodeMap[peerId];
  const t = typeById(link.type);

  const [type, setType] = useState(link.type);
  const [label, setLabel] = useState(link.label || '');
  const [from, setFrom] = useState(link.from);

  if (!editing) {
    return (
      <div className="rel-row">
        <div className="rel-dot" style={{ background: t.color }}></div>
        <div className="rel-text">
          <div className="rel-name">{peer?.name || peerId}</div>
          <div className="rel-desc">{link.label || '—'}</div>
        </div>
        <div className="rel-btns">
          <button className="rel-icon-btn" title="Изменить" onClick={() => setEditing(true)}>✏</button>
          <button className="rel-icon-btn" title="Удалить" onClick={() => { if (confirm('Удалить отношение?')) onDeleteLink(idx); }}>✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rel-row">
      <div className="rel-dot" style={{ background: t.color }}></div>
      <div className="rel-edit-form active">
        {!isOutgoing && (
          <select value={from} onChange={e => setFrom(e.target.value)}>
            {nodes.filter(n => n.id !== currentNode.id).map(n => <option value={n.id} key={n.id}>{n.name}</option>)}
          </select>
        )}
        <select value={type} onChange={e => setType(e.target.value)}>
          {allTypes.map(tt => <option value={tt.id} key={tt.id}>{tt.label}</option>)}
        </select>
        <input value={label} onChange={e => setLabel(e.target.value)} />
        <div className="rel-edit-actions">
          <button className="rel-save" onClick={() => {
            onUpdateLink(idx, { type, label, ...(isOutgoing ? {} : { from }) });
            setEditing(false);
          }}>✓ СОХРАНИТЬ</button>
          <button className="rel-cancel" onClick={() => setEditing(false)}>ОТМЕНА</button>
        </div>
      </div>
    </div>
  );
}

export default function NodeSidebar({ node, nodes, links, typesApi, onClose, onAddLink, onUpdateLink, onDeleteLink }) {
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  const outLinks = [];
  const inLinks = [];
  links.forEach((l, idx) => {
    if (l.from === node.id) outLinks.push({ link: l, idx });
    if (l.to === node.id) inLinks.push({ link: l, idx });
  });

  function addRel(dir) {
    const other = nodes.find(n => n.id !== node.id);
    if (!other) return;
    onAddLink(dir === 'out' ? { from: node.id, to: other.id, type: 'neu', label: '' } : { from: other.id, to: node.id, type: 'neu', label: '' });
  }

  return (
    <div id="sidebar" className="open">
      <div id="sb-top">
        <button id="sb-close" onClick={onClose}>×</button>
        <div id="sb-name">{node.name}</div>
        <div id="sb-role">{node.role}</div>
        <div id="sb-spectrum">{node.spectrum}</div>
      </div>
      <div id="sb-body">
        <div className="rel-section-title">
          КАК ОТНОСИТСЯ К ДРУГИМ
          <button className="rel-add-btn" onClick={() => addRel('out')}>+ ДОБАВИТЬ</button>
        </div>
        {outLinks.map(({ link, idx }) => (
          <RelRow key={idx} link={link} idx={idx} isOutgoing currentNode={node} nodes={nodes} nodeMap={nodeMap}
            typesApi={typesApi} onUpdateLink={onUpdateLink} onDeleteLink={onDeleteLink} />
        ))}
        <div className="rel-section-title" style={{ marginTop: 20 }}>
          КАК ДРУГИЕ ОТНОСЯТСЯ
          <button className="rel-add-btn" onClick={() => addRel('in')}>+ ДОБАВИТЬ</button>
        </div>
        {inLinks.map(({ link, idx }) => (
          <RelRow key={idx} link={link} idx={idx} isOutgoing={false} currentNode={node} nodes={nodes} nodeMap={nodeMap}
            typesApi={typesApi} onUpdateLink={onUpdateLink} onDeleteLink={onDeleteLink} />
        ))}
      </div>
    </div>
  );
}
