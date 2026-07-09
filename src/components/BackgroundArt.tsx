import { Particles } from './Particles';

const DOPAMINE_COLORS = ['#4D96FF', '#FF6EC7', '#FFD93D', '#6BCB77', '#F78154'];

export function BackgroundArt() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-cream">
      <Particles className="h-full w-full" quantity={90} colors={DOPAMINE_COLORS} size={1.8} ease={60} />
    </div>
  );
}
