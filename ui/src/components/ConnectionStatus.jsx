export function ConnectionStatus({ connected }) {
  return (
    <div className="connection-status">
      <div className={`indicator ${connected ? 'connected' : 'disconnected'}`} />
      <span>{connected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}
