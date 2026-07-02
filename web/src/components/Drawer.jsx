import { useSettings } from '../context/SettingsContext.jsx';

export default function Drawer({ open, setOpen, onDownload, onSave, onNewLink, onOpenTypes }) {
  const { theme, setTheme, fontSize, setFontSize, animEnabled, setAnimEnabled } = useSettings();

  return (
    <>
      <button id="menu-btn" title="Меню" onClick={() => setOpen(true)}>
        <span></span><span></span><span></span>
      </button>
      <div id="drawer-overlay" className={open ? 'open' : ''} onClick={() => setOpen(false)}></div>
      <div id="drawer" className={open ? 'open' : ''}>
        <div id="drawer-header">
          <h2>ИНСТРУМЕНТЫ</h2>
          <button id="drawer-close" onClick={() => setOpen(false)}>×</button>
        </div>
        <div id="drawer-body">
          <div className="drawer-section">
            <h3>ДАННЫЕ</h3>
            <div className="drawer-item" onClick={() => { setOpen(false); onDownload(); }}>
              <span className="drawer-item-icon">↓</span>
              <span className="drawer-item-text">СКАЧАТЬ JSON</span>
            </div>
            <div className="drawer-item" onClick={() => { setOpen(false); onSave(); }}>
              <span className="drawer-item-icon">↑</span>
              <span className="drawer-item-text">СОХРАНИТЬ В РЕПО</span>
            </div>
          </div>
          <div className="drawer-section">
            <h3>СВЯЗИ</h3>
            <div className="drawer-item" onClick={() => { setOpen(false); onNewLink(); }}>
              <span className="drawer-item-icon">→</span>
              <span className="drawer-item-text">СОЗДАТЬ СТРЕЛКУ</span>
            </div>
            <div className="drawer-item" onClick={() => { setOpen(false); onOpenTypes(); }}>
              <span className="drawer-item-icon">◐</span>
              <span className="drawer-item-text">ТИПЫ СТРЕЛОК</span>
            </div>
          </div>
          <div className="drawer-section">
            <h3>НАСТРОЙКИ</h3>
            <div className="setting-row">
              <div className="setting-label">ТЕМА</div>
              <div className="theme-toggle">
                <button className={'theme-btn' + (theme !== 'dark' ? ' active' : '')} onClick={() => setTheme('light')}>☀ СВЕТЛАЯ</button>
                <button className={'theme-btn' + (theme === 'dark' ? ' active' : '')} onClick={() => setTheme('dark')}>☾ ТЁМНАЯ</button>
              </div>
            </div>
            <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
              <div className="setting-label">РАЗМЕР ШРИФТА · <span>{fontSize}</span>px</div>
              <input type="range" min="9" max="18" value={fontSize} className="setting-slider" style={{ width: '100%' }}
                onChange={e => setFontSize(+e.target.value)} />
            </div>
            <div className="setting-row">
              <div className="setting-label">АНИМАЦИЯ</div>
              <label className="toggle-switch">
                <input type="checkbox" checked={animEnabled} onChange={e => setAnimEnabled(e.target.checked)} />
                <span className="toggle-track"><span className="toggle-thumb"></span></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
