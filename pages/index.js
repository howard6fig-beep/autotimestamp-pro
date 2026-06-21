import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Check if Stripe redirected back with unlocked=true
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('unlocked') === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', textAlign: 'center' }}>AutoTimestamp Pro</h1>
      <p style={{ color: '#666', textAlign: 'center' }}>Instantly generate YouTube chapters from any video.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <input
          type="text"
          placeholder="Paste YouTube URL (e.g., https://youtu.be/xyz)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#ff0000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>Error: {error}</p>}

      {result && (
        <div style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative' }}>
          <h3 style={{ marginTop: 0 }}>Your Timestamps:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: '1.6', filter: (!isUnlocked && result.isLocked) ? 'blur(5px)' : 'none' }}>
            {result.timestamps}
          </pre>
          
          {!isUnlocked && result.isLocked && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px', border: '2px solid #ff0000', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>Video is over 10 minutes!</p>
              <p style={{ fontSize: '14px', marginBottom: '15px' }}>Unlock full timestamps for just $3.</p>
              {/* REPLACE THIS WITH YOUR STRIPE LINK LATER */}
              <a href="STRIPE_PAYMENT_LINK_HERE" style={{ background: '#635bff', color: 'white', padding: '10px 20px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
                Unlock for $3
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
