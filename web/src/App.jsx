import { useState } from 'react';
import TopTabs from './components/TopTabs.jsx';
import Drawer from './components/Drawer.jsx';
import GraphView from './components/graph/GraphView.jsx';
import StatsView from './components/stats/StatsView.jsx';
import ProfilesView from './components/profiles/ProfilesView.jsx';
import WorldView from './components/world/WorldView.jsx';
import NewLinkModal from './components/modals/NewLinkModal.jsx';
import TypesModal from './components/modals/TypesModal.jsx';
import SaveModal from './components/modals/SaveModal.jsx';
import { useGraphData } from './hooks/useGraphData.js';
import { useTypes } from './hooks/useTypes.js';

export default function App() {
  const [view, setView] = useState('graph');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newLinkOpen, setNewLinkOpen] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const graph = useGraphData();
  const typesApi = useTypes();

  function download() {
    const payload = graph.cleanPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'data.json'; a.click();
    URL.revokeObjectURL(a.href);
  }

  function openSave() {
    if (localStorage.getItem('gh_token')) setSaveOpen(true);
    else setSaveOpen(true);
  }

  return (
    <>
      {!graph.loaded && <div id="loading">ЗАГРУЗКА...</div>}

      <Drawer
        open={drawerOpen} setOpen={setDrawerOpen}
        onDownload={download} onSave={openSave}
        onNewLink={() => setNewLinkOpen(true)} onOpenTypes={() => setTypesOpen(true)}
      />

      <TopTabs view={view} setView={setView} />

      <GraphView
        active={view === 'graph'}
        nodes={graph.nodes} links={graph.links}
        typesApi={typesApi}
        onUpdateLink={graph.updateLink}
        onDeleteLink={graph.deleteLink}
        onAddLink={graph.addLink}
      />
      <StatsView active={view === 'stats'} />
      <ProfilesView active={view === 'profiles'} />
      <WorldView active={view === 'world'} />

      <NewLinkModal
        open={newLinkOpen} onClose={() => setNewLinkOpen(false)}
        nodes={graph.nodes} typesApi={typesApi}
        onCreate={(link) => { graph.addLink(link); setNewLinkOpen(false); }}
      />
      <TypesModal open={typesOpen} onClose={() => setTypesOpen(false)} typesApi={typesApi} />
      <SaveModal open={saveOpen} onClose={() => setSaveOpen(false)} cleanPayload={graph.cleanPayload} />
    </>
  );
}
