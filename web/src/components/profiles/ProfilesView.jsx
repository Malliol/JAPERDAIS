import { useEffect, useState } from 'react';
import CharacterCard from './CharacterCard.jsx';
import CharacterModal from './CharacterModal.jsx';

export default function ProfilesView({ active }) {
  const [chars, setChars] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch('characters.json?v=' + Date.now())
      .then(r => r.json())
      .then(setChars)
      .catch(e => console.warn('characters.json not found', e));
  }, []);

  useEffect(() => { if (!active) setSelected(null); }, [active]);

  return (
    <div id="profiles-view" className={active ? 'open' : ''}>
      <div className="profiles-grid" id="profiles-grid">
        {chars.map(ch => <CharacterCard ch={ch} key={ch.id} onOpen={setSelected} />)}
      </div>
      {selected && <CharacterModal ch={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
