import Skeleton from '../Skeleton.jsx';

export default function ProfileSkeleton() {
  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="pageCard" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
        <Skeleton height={120} radius={0} />
        <div style={{ padding: '0 32px 32px', marginTop: -40 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Skeleton width={100} height={100} radius={28} />
            <div style={{ flex: 1, minWidth: 200, paddingBottom: 8 }}>
              <Skeleton width={200} height={18} radius={10} style={{ marginBottom: 10 }} />
              <Skeleton width={260} height={12} radius={10} />
            </div>
            <div style={{ display: 'flex', gap: 12, paddingBottom: 8 }}>
              <Skeleton width={120} height={40} radius={16} />
              <Skeleton width={120} height={40} radius={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="profileLayout">
        <div className="stickySidebar">
          <div className="pageCard" style={{ padding: 24 }}>
            <Skeleton width={140} height={14} radius={10} style={{ marginBottom: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Skeleton height={64} radius={16} />
              <Skeleton height={64} radius={16} />
              <div style={{ gridColumn: '1 / -1' }}>
                <Skeleton height={64} radius={16} />
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Skeleton height={44} radius={16} />
              <Skeleton height={44} radius={16} />
              <Skeleton height={44} radius={16} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="pageCard" style={{ padding: 8 }}>
            <div className="pillRow" style={{ gap: 8, padding: 0 }}>
              <Skeleton height={40} radius={12} width="33%" />
              <Skeleton height={40} radius={12} width="33%" />
              <Skeleton height={40} radius={12} width="33%" />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
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
    </div>
  );
}
