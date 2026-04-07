import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Event } from '../../types';
import { resolvePosterUrl } from '../../utils/posters';
import styles from './EventCard.module.scss';

interface Props {
  event: Event;
}

const EventCard: React.FC<Props> = ({ event }) => {
  const { t } = useTranslation();
  const isFree = Number(event.price) === 0;
  const isSoldOut = event.ticketsSold >= event.maxTickets;
  const posterSrc = resolvePosterUrl(event.poster);

  return (
    <Link to={`/events/${event.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={posterSrc} alt={event.title} className={styles.image} loading="lazy" />
        <span className={`badge badge--${event.format} ${styles.formatBadge}`}>
          {event.format}
        </span>
        {isSoldOut && <span className={styles.soldOut}>{t('events.card.soldOut')}</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.date}>
            {format(new Date(event.date), 'MMM d, yyyy')}
          </span>
          <span className={styles.dot}>·</span>
          <span className={styles.location} title={event.location}>
            {event.location.split(',')[0]}
          </span>
        </div>

        <h3 className={styles.title}>{event.title}</h3>

        {event.company && (
          <p className={styles.organizer}>by {event.company.name}</p>
        )}

        <div className={styles.footer}>
          <span className={isFree ? `badge badge--free` : styles.price}>
            {isFree ? t('events.card.free') : `$${Number(event.price).toFixed(2)}`}
          </span>
          <span className={styles.tickets}>
            {t('events.card.ticketsLeft', { count: event.maxTickets - event.ticketsSold })}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
