export default function StatCard({ label, value, unit }) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {unit && <p className="stat-unit">{unit}</p>}
    </article>
  );
}
