// src/components/ClipPreview.jsx
import React, { useState } from 'react';
import { generateCinematicClip } from '../cinematicOS';

export default function ClipPreview() {
  const [showId, setShowId] = useState('SistersOfTheDiaspora');
  const [castId, setCastId] = useState('');
  const [episodeId, setEpisodeId] = useState('');
  const [clip, setClip] = useState(null);

  const handleGenerate = async () => {
    const result = await generateCinematicClip({ castId, episodeId, showId });
    setClip(result);
  };

  return (
    <div>
      <select onChange={e => setShowId(e.target.value)}>
        <option>SistersOfTheDiaspora</option>
        <option>SayWallahiEdition</option>
      </select>
      <input placeholder="Cast ID" onChange={e => setCastId(e.target.value)} />
      <input placeholder="Episode ID" onChange={e => setEpisodeId(e.target.value)} />
      <button onClick={handleGenerate}>Generate Clip</button>

      {clip && (
        <div>
          <h3>{clip.scene}</h3>
          <p>{clip.overlay}</p>
          <audio controls src={`/public/assets/${clip.soundtrack}`} />
        </div>
      )}
    </div>
  );
}
