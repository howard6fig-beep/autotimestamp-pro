export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  
  // Extract Video ID from URL
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('embed/')) {
      videoId = url.split('embed/')[1].split('?')[0];
    } else {
      return res.status(400).json({ error: 'Invalid YouTube URL format.' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'Could not parse YouTube URL.' });
  }

  try {
    // 1. Fetch the YouTube watch page
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const watchResponse = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await watchResponse.text();
    
    // 2. Find the captionTracks array using bracket counting (Bulletproof)
    const captionStringStart = html.indexOf('"captionTracks":');
    if (captionStringStart === -1) {
      return res.status(404).json({ error: 'No transcript found. (Code: 100)' });
    }
    
    const arrayStart = html.indexOf('[', captionStringStart);
    let bracketCount = 0;
    let arrayEnd = -1;
    
    for (let i = arrayStart; i < html.length; i++) {
      if (html[i] === '[') bracketCount++;
      if (html[i] === ']') bracketCount--;
      if (bracketCount === 0) {
        arrayEnd = i + 1;
        break;
      }
    }
    
    if (arrayEnd === -1) {
      return res.status(404).json({ error: 'No transcript found. (Code: 101)' });
    }
    
    const tracksJson = html.slice(arrayStart, arrayEnd);
    const captionTracks = JSON.parse(tracksJson);
    
    if (captionTracks.length === 0) {
      return res.status(404).json({ error: 'No transcript found.' });
    }
    
    // Prefer English if available
    let transcriptUrl = captionTracks[0].baseUrl;
    const englishTrack = captionTracks.find(track => track.languageCode === 'en');
    if (englishTrack) {
      transcriptUrl = englishTrack.baseUrl;
    }

    // 3. Fetch the actual transcript
    const transcriptResponse = await fetch(transcriptUrl);
    let transcriptText = await transcriptResponse.text();
    
    let transcript = [];
    
    // 4. Try parsing as XML first
    const textRegex = /<text start="([\d.]+)"[^>]*>(.*?)<\/text>/gms;
    let match;
    while ((match = textRegex.exec(transcriptText)) !== null) {
      let text = match[2]
        .replace(/&amp;#39;/g, "'")
        .replace(/&amp;quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;amp;/g, '&')
        .replace(/\n/g, ' ');
        
      transcript.push({
        offset: Math.floor(parseFloat(match[1]) * 1000),
        text: text
      });
    }

    // 5. If XML failed, try parsing as JSON3
    if (transcript.length === 0) {
      try {
        const data = JSON.parse(transcriptText);
        if (data.events) {
          data.events.forEach(event => {
            if (event.segs) {
              let text = event.segs.map(seg => seg.utf8).join('').replace(/\n/g, ' ');
              if (text.trim() !== '') {
                transcript.push({
                  offset: event.tStartMs || 0,
                  text: text
                });
              }
            }
          });
        }
      } catch (e) {
        // Not JSON either
      }
    }

    if (transcript.length === 0) {
      return res.status(404).json({ error: 'Transcript is empty.' });
    }

    // 6. Apply the rule-based clustering algorithm
    let timestamps = '';
    let currentChunk = '';
    let chunkStartTime = 0;
    
    const totalDuration = transcript[transcript.length - 1].offset;
    const isLocked = totalDuration > 600000; // > 10 mins

    transcript.forEach((item, index) => {
      if (item.offset - chunkStartTime >= 60000 || index === 0) {
        if (currentChunk !== '') {
          const titleWords = currentChunk.split(' ').slice(0, 8).join(' ');
          timestamps += `${formatTime(chunkStartTime)} ${titleWords}\n`;
        }
        chunkStartTime = item.offset;
        currentChunk = item.text;
      } else {
        currentChunk += ' ' + item.text;
      }

      // If locked, only output the first 3 timestamps
      if (isLocked && timestamps.split('\n').length > 3 && index !== transcript.length - 1) {
        return;
      }
    });

    if (currentChunk !== '') {
       const titleWords = currentChunk.split(' ').slice(0, 8).join(' ');
       timestamps += `${formatTime(chunkStartTime)} ${titleWords}\n`;
    }

    res.status(200).json({ timestamps, isLocked });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transcript.' });
  }
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
