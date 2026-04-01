import { useEffect, useRef, useState } from 'react';

export default function Chat() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function send() {
    const body = text.trim();
    if (!body) return;
    setMessages((m) => [...m, { id: Date.now(), mine: true, body, ts: new Date().toISOString() }]);
    setText('');
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', height: 'calc(100svh - 140px)', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <div className="pageCard" style={{ padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>👤</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Chat</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="iconBtn" style={{ width: 36, height: 36 }}>📞</button>
          <button className="iconBtn" style={{ width: 36, height: 36 }}>⋮</button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chatMessages" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 ? (
          <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
            <div className="sectionTitle">No information</div>
            <div className="sectionHint">There are no messages to show on this page.</div>
          </div>
        ) : null}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="chatInputRow" style={{ padding: '16px 0' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            className="input"
            style={{ width: '100%', height: 50, paddingLeft: 44, paddingRight: 44, borderRadius: 25, border: '1px solid var(--border)', background: 'white' }}
            placeholder="Write your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <div style={{ position: 'absolute', left: 14, top: 14, fontSize: 18, cursor: 'pointer' }}>📎</div>
          <div style={{ position: 'absolute', right: 14, top: 14, fontSize: 18, cursor: 'pointer' }}>😊</div>
        </div>
        <button className="btn btnPrimary" style={{ width: 50, height: 50, borderRadius: '50%', padding: 0 }} onClick={send}>
          🚀
        </button>
      </div>
    </div>
  );
}
