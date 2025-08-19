// pages/events/[id].tsx
// @ts-nocheck
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

export default function EventPage() {
  const router = useRouter();
  const { id } = router.query;

  const [event, setEvent] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('yes');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (error) console.error(error);
      else setEvent(data);
    }
    load();
  }, [id]);

  async function handleRSVP(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');

    if (!name || !email) {
      setMessage('Please enter name and email.');
      return;
    }

    // find or create user
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    let userId;
    if (users && users.length > 0) {
      userId = users[0].id;
    } else {
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert({ name, email })
        .select('id')
        .single();
      if (createErr) {
        setMessage('Error creating user: ' + createErr.message);
        return;
      }
      userId = newUser.id;
    }

    // ✅ enforce lowercase status
    const safeStatus = status.toLowerCase();

    // upsert RSVP
    const { error: rsvpErr } = await supabase
      .from('rsvps')
      .upsert(
        { user_id: userId, event_id: id, status: safeStatus },
        { onConflict: 'user_id,event_id' }
      );

    if (rsvpErr) {
      setMessage('Error saving RSVP: ' + rsvpErr.message);
      return;
    }
    setMessage('RSVP saved — thank you!');
  }

  if (!event) return <div style={{ padding: 20 }}>Loading event…</div>;

  return (
    <div style={{ maxWidth: 700, margin: 'auto', padding: 20 }}>
      <Link href="/">← Back to events</Link>
      <h1>{event.title}</h1>
      <p>
        {event.city} • {event.date}
      </p>
      <p>{event.description}</p>

      <hr style={{ margin: '20px 0' }} />

      <h3>RSVP</h3>
      <form onSubmit={handleRSVP} style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Name
            <br />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Email
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Answer
            <br />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
              }}
            >
              <option value="yes">Yes</option>
              <option value="maybe">Maybe</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          style={{
            padding: '8px 16px',
            background: '#0070f3',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Submit RSVP
        </button>
      </form>

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </div>
  );
}
