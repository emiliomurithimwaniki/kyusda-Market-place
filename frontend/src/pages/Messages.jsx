import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Messages() {
  const location = useLocation();
  const nav = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const to = params.get('to');
    if (to) {
      nav(`/chat/${to}${location.search}`, { replace: true });
    }
  }, [location, nav]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.getConversations();
        const list = Array.isArray(res?.data?.results)
          ? res.data.results
          : (Array.isArray(res?.data) ? res.data : []);
        if (mounted) setChats(list);
      } catch (err) {
        if (mounted) setError('Unable to load messages. Please check your internet connection and try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const openChat = (c) => {
    const otherId = c?.other_participant?.id;
    if (!otherId) return;
    nav(`/chat/${otherId}`);
  };

  return (
    <div>
      <div className="sectionHeader">
        <div className="sectionTitle">Messages</div>
        <div className="sectionHint">Chats</div>
      </div>

      {loading ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⌛</div>
          <div className="sectionTitle">Loading...</div>
          <div className="sectionHint">Fetching your chats</div>
        </div>
      ) : error ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📶</div>
          <div className="sectionTitle">Network Error</div>
          <div className="sectionHint">{error}</div>
        </div>
      ) : chats.length === 0 ? (
        <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <div className="sectionTitle">No information</div>
          <div className="sectionHint">There are no messages to show on this page.</div>
        </div>
      ) : (
        <div className="pageCard" style={{ padding: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {chats.map((c) => {
              const other = c?.other_participant;
              const last = c?.last_message;
              const hasUnread = !!(last && !last.is_mine && last.is_read === false);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openChat(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 12px',
                    border: '1px solid var(--border)',
                    background: 'white',
                    borderRadius: 16,
                    cursor: 'pointer',
                    marginBottom: 10,
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.95), rgba(124, 58, 237, 0.92))',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    flexShrink: 0,
                  }}>
                    {other?.name ? other.name.charAt(0).toUpperCase() : '👤'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontWeight: 900, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {other?.name || 'Chat'}
                      </div>
                      {last?.created_at ? (
                        <div style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : null}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
                      <div style={{
                        fontSize: 12,
                        color: hasUnread ? 'var(--text)' : 'var(--muted)',
                        fontWeight: hasUnread ? 800 : 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minWidth: 0,
                      }}>
                        {last?.body || 'No messages yet'}
                      </div>
                      {hasUnread ? (
                        <div style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--primary)', flexShrink: 0 }} />
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
