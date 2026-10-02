import type { PinLayer } from '../lib/pins';

export type ActiveCommunityLayer = Extract<PinLayer, 'hazard' | 'artisan'>;

interface LayerToggleProps {
  active: Set<ActiveCommunityLayer>;
  onToggle: (layer: ActiveCommunityLayer) => void;
  onAdd: (layer: ActiveCommunityLayer) => void;
  hazardFilter: string;
  onHazardFilter: (v: string) => void;
  tradeFilter: string;
  onTradeFilter: (v: string) => void;
}

export default function LayerToggle({
  active,
  onToggle,
  onAdd,
  hazardFilter,
  onHazardFilter,
  tradeFilter,
  onTradeFilter,
}: LayerToggleProps) {
  const hazardOn = active.has('hazard');
  const artisanOn = active.has('artisan');

  return (
    <div className="layer-bar">
      <span className="layer-bar-label">Layers</span>
      <button
        type="button"
        className={`layer-chip hazard${hazardOn ? ' on' : ''}`}
        onClick={() => onToggle('hazard')}
        aria-pressed={hazardOn}
      >
        Hazard
      </button>
      <button
        type="button"
        className={`layer-chip artisan${artisanOn ? ' on' : ''}`}
        onClick={() => onToggle('artisan')}
        aria-pressed={artisanOn}
      >
        Artisan
      </button>
      {hazardOn && (
        <>
          <select
            className="layer-filter"
            value={hazardFilter}
            onChange={(e) => onHazardFilter(e.target.value)}
            aria-label="Filter hazard type"
          >
            <option value="">All types</option>
            <option value="flood">Flood</option>
            <option value="road_cut">Road cut</option>
            <option value="pothole">Pothole</option>
            <option value="drain">Drain</option>
            <option value="accident">Accident</option>
            <option value="other">Other</option>
          </select>
          <button type="button" className="btn btn-hazard layer-add" onClick={() => onAdd('hazard')}>
            + Report
          </button>
        </>
      )}
      {artisanOn && (
        <>
          <select
            className="layer-filter"
            value={tradeFilter}
            onChange={(e) => onTradeFilter(e.target.value)}
            aria-label="Filter trade"
          >
            <option value="">All trades</option>
            <option value="plumber">Plumber</option>
            <option value="electrician">Electrician</option>
            <option value="ac">AC</option>
            <option value="carpenter">Carpenter</option>
            <option value="painter">Painter</option>
            <option value="welder">Welder</option>
            <option value="other">Other</option>
          </select>
          <button
            type="button"
            className="btn btn-artisan layer-add"
            onClick={() => onAdd('artisan')}
          >
            + List
          </button>
        </>
      )}
    </div>
  );
}
