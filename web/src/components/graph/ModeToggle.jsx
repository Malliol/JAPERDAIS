export default function ModeToggle({ mode3D, setMode3D }) {
  return (
    <div id="mode-toggle">
      <button className={'mode-btn' + (!mode3D ? ' active' : '')} onClick={() => setMode3D(false)}>2D</button>
      <button className={'mode-btn' + (mode3D ? ' active' : '')} onClick={() => setMode3D(true)}>3D</button>
    </div>
  );
}
