import Skeleton from '../Skeleton.jsx';

export default function ProductCardSkeleton() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <Skeleton height={140} radius={0} />
      <div className="cardBody">
        <Skeleton height={14} radius={10} style={{ marginBottom: 8 }} />
        <Skeleton height={12} radius={10} width="60%" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <Skeleton height={12} radius={10} width="40%" />
          <Skeleton height={12} radius={10} width="30%" />
        </div>
        <div className="btnRow" style={{ marginTop: 12 }}>
          <Skeleton height={34} radius={14} width="48%" />
          <Skeleton height={34} radius={14} width="48%" />
        </div>
      </div>
    </div>
  );
}
