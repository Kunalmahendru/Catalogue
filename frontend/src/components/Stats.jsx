export default function Stats({ stats }) {
  const items = [
    { value: stats.designs, label: "Designs" },
    { value: stats.orders_delivered, label: "Orders delivered" },
    { value: stats.states, label: "States across India" },
  ];

  return (
    <section className="stats" aria-label="Our reach">
      <div className="stats__row">
        {items.map((s) => (
          <div className="stats__item" key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
      <p className="stats__note">Loved by customers all over the country.</p>
    </section>
  );
}
