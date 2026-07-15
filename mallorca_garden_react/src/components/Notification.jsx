export default function NotificationContainer({ notifications }) {
    return (
        <div className="notification-container">
            {notifications.map(n => (
                <div key={n.id} className={`notification ${n.type}`}>
                    <span className="notification-icon">{n.type === 'success' ? 'OK' : 'Error'}</span>
                    <span className="notification-message">{n.message}</span>
                </div>
            ))}
        </div>
    );
}