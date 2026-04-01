import { Link } from 'react-router-dom';

export default function Messages() {
  return (
    <div>
      <div className="sectionHeader">
        <div className="sectionTitle">Messages</div>
        <div className="sectionHint">Chats</div>
      </div>

      <div className="pageCard" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
        <div className="sectionTitle">No information</div>
        <div className="sectionHint">There are no messages to show on this page.</div>
      </div>
    </div>
  );
}
