import { useState, useEffect } from 'react';

export default function Home() {
  const [resume, setResume] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
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
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDesc })
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
    <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1 style={{ color: '#2d3748', textAlign: 'center' }}>Resume Keyword Matcher</h1>
      <p style={{ color: '#718096', textAlign: 'center' }}>Beat the ATS bots. Paste your resume and the job description to see your match score instantly.</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>Your Resume:</label>
          <textarea
            value={resume}
            onChange={(e) => setResume(e.target.value)}
            required
            style={{ flex: 1, minHeight: '300px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', resize: 'vertical' }}
            placeholder="Paste your full resume text here..."
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>Job Description:</label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            required
            style={{ flex: 1, minHeight: '300px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', resize: 'vertical' }}
            placeholder="Paste the job description text here..."
          />
        </div>
      </form>
      
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button type="submit" onClick={handleSubmit} disabled={loading} style={{ padding: '12px 30px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
          {loading ? 'Analyzing...' : 'Calculate Match Score'}
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: '20px', textAlign: 'center' }}>Error: {error}</p>}

      {result && (
        <div style={{ marginTop: '40px', background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '10px' }}>Match Score: {result.matchPercentage}%</h2>
            <div style={{ background: '#e2e8f0', height: '20px', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ width: `${result.matchPercentage}%`, background: result.matchPercentage > 70 ? '#48bb78' : '#ecc94b', height: '100%' }}></div>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <h3>Missing Keywords (Found in Job Description, Missing in Resume):</h3>
            <div style={{ filter: !isUnlocked ? 'blur(8px)' : 'none', pointerEvents: !isUnlocked ? 'none' : 'auto' }}>
              {result.missingKeywords && result.missingKeywords.length > 0 ? (
                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                  {result.missingKeywords.map((kw, i) => <li key={i}>{kw}</li>)}
                </ul>
              ) : (
                <p>No missing keywords! You have a perfect match.</p>
              )}
            </div>
            
            {!isUnlocked && (
              <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '25px', border: '2px solid #3182ce', borderRadius: '10px', textAlign: 'center', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '18px' }}>Unlock Full Report</p>
                <p style={{ fontSize: '14px', marginBottom: '20px', color: '#718096' }}>See exactly which keywords you are missing to beat the ATS bots.</p>
                {/* REPLACE THIS WITH YOUR STRIPE LINK */}
                <a href="https://buy.stripe.com/dRm6oJgI5czkbQZ6Z21B602" style={{ background: '#635bff', color: 'white', padding: '12px 25px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', display: 'inline-block' }}>
                  Unlock for $5
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
