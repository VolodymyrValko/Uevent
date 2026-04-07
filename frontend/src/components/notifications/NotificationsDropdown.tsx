import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useNotificationsStore } from '../../store/notificationsStore';
import styles from './NotificationsDropdown.module.scss';

interface Props {
  onClose: () => void;
}

const TYPE_ICON: Record<string, string> = {
  ticket_purchased: '🎟',
  event_reminder:   '⏰',
  organizer_news:   '📣',
  new_visitor:      '👤',
};

const NotificationsDropdown: React.FC<Props> = ({ onClose }) => {
  const { notifications, fetchAll, markRead, markAllRead } = useNotificationsStore();
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleClick = async (id: number, relatedEventId: number | null) => {
    await markRead(id);
    onClose();
    if (relatedEventId) navigate(`/events/${relatedEventId}`);
  };

  const recent = notifications.slice(0, 8);

  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <span className={styles.title}>Notifications</span>
        {notifications.some((n) => !n.isRead) && (
          <button className={styles.markAll} onClick={() => markAllRead()}>Mark all read</button>
        )}
      </div>

      <div className={styles.list}>
        {recent.length === 0 ? (
          <div className={styles.empty}>
            <span>🔔</span>
            <p>No notifications yet</p>
          </div>
        ) : (
          recent.map((n) => (
            <button
              key={n.id}
              className={`${styles.item} ${!n.isRead ? styles.itemUnread : ''}`}
              onClick={() => handleClick(n.id, n.relatedEventId)}
            >
              <span className={styles.icon}>{TYPE_ICON[n.type] ?? '🔔'}</span>
              <div className={styles.content}>
                <p className={styles.notifTitle}>{n.title}</p>
                <p className={styles.body}>{n.body}</p>
                <p className={styles.time}>
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!n.isRead && <span className={styles.dot} />}
            </button>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <Link to="/profile/notifications" className={styles.viewAll} onClick={onClose}>
          View all notifications →
        </Link>
      </div>
    </div>
  );
};

export default NotificationsDropdown;
