import Skeleton from '../Skeleton.jsx';

export default function ProductDetailsSkeleton() {
  return (
    <div>
      <div className="sectionHeader" style={{ marginTop: 0 }}>
        <div>
          <div className="sectionTitle"><Skeleton width={220} height={18} radius={10} /></div>
          <div className="sectionHint" style={{ marginTop: 6 }}><Skeleton width={120} height={12} radius={10} /></div>
        </div>
      </div>

      <div className="pageCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <Skeleton height={280} radius={0} />
      </div>

      <div className="pageCard" style={{ padding: 24 }}>
        <Skeleton width={140} height={28} radius={12} style={{ marginBottom: 10 }} />
        <Skeleton width={100} height={12} radius={10} style={{ marginBottom: 20 }} />

        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 10 }}>
          <Skeleton width={90} height={12} radius={10} />
          <Skeleton width={90} height={12} radius={10} />
        </div>

        <Skeleton width="100%" height={12} radius={10} style={{ marginBottom: 8 }} />
        <Skeleton width="95%" height={12} radius={10} style={{ marginBottom: 8 }} />
        <Skeleton width="85%" height={12} radius={10} style={{ marginBottom: 20 }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <Skeleton width="100%" height={48} radius={16} />
          <Skeleton width={48} height={48} radius={16} />
        </div>
      </div>

      <div className="pageCard" style={{ padding: 20, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
          <div>
            <Skeleton width={120} height={14} radius={10} style={{ marginBottom: 6 }} />
            <Skeleton width={60} height={10} radius={10} />
          </div>
          <Skeleton width={110} height={34} radius={14} />
        </div>
      </div>

      <div style={{ marginTop: 32 }}>
        <div className="sectionHeader">
          <div>
            <div className="sectionTitle"><Skeleton width={180} height={16} radius={10} /></div>
            <div className="sectionHint" style={{ marginTop: 6 }}><Skeleton width={100} height={12} radius={10} /></div>
          </div>
        </div>
        <div className="grid">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="card" style={{ overflow: 'hidden' }}>
              <Skeleton height={140} radius={0} />
              <div className="cardBody">
                <Skeleton height={14} radius={10} style={{ marginBottom: 8 }} />
                <Skeleton height={12} radius={10} width="60%" style={{ marginBottom: 10 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <Skeleton height={12} radius={10} width="40%" />
                  <Skeleton height={12} radius={10} width="30%" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
