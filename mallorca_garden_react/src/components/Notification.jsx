import { useState, useCallback } from 'react';

let notificationId = 0;

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);

    const addNotification = useCallback((message, type = 'success') => {
        const id = ++notificationId;
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);

    return { notifications, addNotification };
}

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
