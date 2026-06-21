import { YoutubeTranscript } from 'youtube-transcript';

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
    // Fetch transcript (100% Free, no API key needed)
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({ error: 'No transcript found. Ensure the video has captions.' });
    }

    // Rule-based clustering algorithm (Zero AI cost)
    let timestamps = '';
    let currentChunk = '';
    let chunkStartTime = 0;
    let wordCount = 0;
    
    // Check if video is longer than 10 minutes (600 seconds)
    const totalDuration = transcript[transcript.length - 1].offset + transcript[transcript.length - 1].duration;
    const isLocked = totalDuration > 600000; // > 10 mins (in ms)

    transcript.forEach((item, index) => {
      // Start a new chunk roughly every 60 seconds or if it's the first item
      if (item.offset - chunkStartTime >= 60000 || index === 0) {
        if (currentChunk !== '') {
          // Add title case to current chunk (first 5 words)
          const titleWords = currentChunk.split(' ').slice(0, 8).join(' ');
          timestamps += `${formatTime(chunkStartTime)} ${titleWords}\n`;
        }
        chunkStartTime = item.offset;
        currentChunk = item.text;
      } else {
        currentChunk += ' ' + item.text;
      }

      // If locked, only output the first 3 timestamps to show proof it works
      if (isLocked && timestamps.split('\n').length > 3 && index !== transcript.length - 1) {
        return;
      }
    });

    // Add final chunk
    if (currentChunk !== '') {
       const titleWords = currentChunk.split(' ').slice(0, 8).join(' ');
       timestamps += `${formatTime(chunkStartTime)} ${titleWords}\n`;
    }

    res.status(200).json({ timestamps, isLocked });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transcript. Video may have disabled captions.' });
  }
}

// Helper function to format milliseconds to MM:SS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
