// pages/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  city: string;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('events')
        .select('id,title,description,date,city')
        .gte('date', today)
        .order('date', { ascending: true });

      if (error) {
        console.error('Supabase error', error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h1>Upcoming Events</h1>
      {loading && <p>Loading…</p>}
      {!loading && events.length === 0 && <p>No upcoming events.</p>}
      {events.map((ev) => (
        <div
          key={ev.id}
          style={{
            border: '1px solid #eee',
            padding: 12,
            marginBottom: 10,
            borderRadius: 6,
          }}
        >
          <h2>
            <Link href={`/events/${ev.id}`}>{ev.title}</Link>
          </h2>
          <p>
            {ev.city} • {ev.date}
          </p>
          <p>{ev.description}</p>
          <p>
            <Link href={`/events/${ev.id}`}>RSVP →</Link>
          </p>
        </div>
      ))}
    </div>
  );
}
