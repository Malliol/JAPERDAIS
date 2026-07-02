import { useEffect, useState } from 'react';

export default function WorldView({ active }) {
  const [world, setWorld] = useState(null);

  useEffect(() => {
    fetch('world.json?v=' + Date.now())
      .then(r => r.json())
      .then(setWorld)
      .catch(e => console.warn('world.json not found', e));
  }, []);

  return (
    <div id="world-view" className={active ? 'open' : ''}>
      <div id="world-wrap">
        {world && (
          <>
            <div className="world-title">{world.title || 'JAPERDAIS'}</div>
            <div className="world-subtitle">Кооперативный психологический триллер</div>

            <div className="world-section">
              <div className="world-section-title">О мире</div>
              {(world.description || []).map((p, i) => <div className="world-p" key={i}>{p}</div>)}
            </div>

            {world.world_device && world.world_device.length > 0 && (
              <div className="world-section">
                <div className="world-section-title">Устройство мира</div>
                {world.world_device.map((p, i) => <div className="world-p" key={i}>{p}</div>)}
                {world.world_device_images_local && world.world_device_images_local.length > 0 && (
                  <div className="world-gallery">
                    {world.world_device_images_local.map((p, i) => (
                      <img key={i} src={p} loading="lazy" onClick={() => window.open(p, '_blank')} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {world.gameplay_facts && world.gameplay_facts.length > 0 && (
              <div className="world-section">
                <div className="world-section-title">Рекорды экспедиции</div>
                {world.gameplay_facts.map((f, i) => <div className="world-fact-row" key={i}>{f}</div>)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
