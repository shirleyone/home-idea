const PETAL_ANGLES = [0, 60, 120, 180, 240, 300];

export function FlowerLogo({ size = 32 }: { size?: number }) {
  const cx = 20;
  const cy = 20;
  const petalRadius = 9;
  const distance = 9;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      {PETAL_ANGLES.map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = cx + distance * Math.cos(rad);
        const y = cy + distance * Math.sin(rad);
        return <circle key={angle} cx={x} cy={y} r={petalRadius} fill="var(--color-sage)" />;
      })}
      <circle cx={cx} cy={cy} r={6} fill="#ffffff" />
    </svg>
  );
}
