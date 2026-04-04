'use client';
import { useState, useEffect, useRef } from 'react';
 
const personaLabels = {
  mentor: 'Mentor froid',
  concurrent: 'Concurrent',
  client: 'Client exigeant'
};
 
export default function Home() {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [persona, setPersona] = useState('mentor');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState('');
  const audioRef = useRef(null);
  const lastAudioRef = useRef(null);
 
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
      const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      const h = String(now.getHours()).padStart(2,'0');
      const m = String(now.getMinutes()).padStart(2,'0');
      setTime(`${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} — ${h}:${m}`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);
 
  const playAudio = (base64) => {
    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
    audioRef.current = audio;
    lastAudioRef.current = base64;
    audio.onplay = () => { setPlaying(true); setStatus('Lecture en cours...'); };
    audio.onended = () => { setPlaying(false); setStatus('Brief terminé.'); };
    audio.onerror = () => { setPlaying(false); setStatus('Erreur audio.'); };
    audio.play();
  };
 
  const launch = async () => {
    if (!today.trim()) { setStatus('Indique ton focus du jour.'); return; }
    setLoading(true);
    setScript('');
    setStatus('Génération en cours...');
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yesterday, today, persona })
      });
      const data = await res.json();
      if (data.error) { setStatus('Erreur : ' + data.error); setLoading(false); return; }
      setScript(data.script);
      if (data.audio) { setStatus('Chargement audio...'); playAudio(data.audio); }
    } catch (err) {
      setStatus('Erreur : ' + err.message);
    }
    setLoading(false);
  };
 
  const stop = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlaying(false);
    setStatus('Stoppé.');
  };
 
  const replay = () => { if (lastAudioRef.current) playAudio(lastAudioRef.current); };
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --bg: #0a0a0a; --surface: #111; --border: #1f1f1f;
          --orange: #ff5c00; --orange-dim: rgba(255,92,0,0.15);
          --text: #e8e8e0; --muted: #555; --muted2: #333;
        }
        body { background: var(--bg); color: var(--text); font-family: 'DM Mono', monospace; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .container { width: 100%; max-width: 560px; }
        .time { font-size: 11px; color: var(--muted); letter-spacing: .15em; text-transform: uppercase; margin-bottom: 8px; }
        h1 { font-family: 'DM Serif Display', serif; font-size: 36px; line-height: 1.1; margin-bottom: 40px; }
        h1 em { font-style: italic; color: var(--orange); }
        label { display: block; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        textarea { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; padding: 14px 16px; border-radius: 4px; resize: none; outline: none; line-height: 1.6; margin-bottom: 20px; transition: border-color .2s; }
        textarea:focus { border-color: var(--orange); }
        textarea::placeholder { color: var(--muted2); }
        .persona-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        .pbtn { background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: .1em; padding: 8px 14px; border-radius: 2px; cursor: pointer; transition: all .15s; text-transform: uppercase; }
        .pbtn:hover { border-color: var(--orange); color: var(--text); }
        .pbtn.active { background: var(--orange-dim); border-color: var(--orange); color: var(--orange); }
        .launch { width: 100%; background: var(--orange); border: none; color: #000; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; letter-spacing: .2em; text-transform: uppercase; padding: 18px; border-radius: 4px; cursor: pointer; transition: opacity .2s; }
        .launch:hover { opacity: .85; }
        .launch:disabled { opacity: .4; cursor: not-allowed; }
        hr { border: none; border-top: 1px solid var(--border); margin: 28px 0; }
        .waveform { display: flex; align-items: center; gap: 3px; height: 32px; margin-bottom: 20px; }
        .bar { width: 3px; background: var(--orange); border-radius: 2px; height: 4px; transition: height .1s; }
        .bar.playing { animation: wave .8s ease-in-out infinite; }
        .bar:nth-child(2) { animation-delay: .1s; }
        .bar:nth-child(3) { animation-delay: .2s; }
        .bar:nth-child(4) { animation-delay: .3s; }
        .bar:nth-child(5) { animation-delay: .15s; }
        .bar:nth-child(6) { animation-delay: .25s; }
        .bar:nth-child(7) { animation-delay: .05s; }
        .bar:nth-child(8) { animation-delay: .35s; }
        @keyframes wave { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(4); } }
        .script-box { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--orange); padding: 20px; border-radius: 4px; font-size: 13px; line-height: 1.8; color: #ccc; white-space: pre-wrap; margin-bottom: 20px; }
        .controls { display: flex; gap: 10px; margin-bottom: 12px; }
        .cbtn { flex: 1; background: var(--surface); border: 1px solid var(--border); color: var(--text); font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: .15em; text-transform: uppercase; padding: 12px; border-radius: 4px; cursor: pointer; transition: border-color .2s; }
        .cbtn:hover { border-color: var(--orange); }
        .status { font-size: 11px; color: var(--muted); letter-spacing: .1em; min-height: 16px; }
        .dot { display: inline-block; width: 6px; height: 6px; background: var(--orange); border-radius: 50%; margin-right: 8px; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.2; } }
      `}</style>
 
      <div className="container">
        <div className="time">{time}</div>
        <h1>Morning<br /><em>Brief</em></h1>
 
        <label>Hier — ce que tu as fait</label>
        <textarea rows={2} value={yesterday} onChange={e => setYesterday(e.target.value)} placeholder="ex: tournage Naobike, prospection 3 contacts..." />
 
        <label>Aujourd'hui — focus principal</label>
        <textarea rows={2} value={today} onChange={e => setToday(e.target.value)} placeholder="ex: finir montage Ronin, envoyer 5 cold DM..." />
 
        <label>Persona</label>
        <div className="persona-row">
          {Object.entries(personaLabels).map(([key, label]) => (
            <button key={key} className={`pbtn${persona === key ? ' active' : ''}`} onClick={() => setPersona(key)}>{label}</button>
          ))}
        </div>
 
        <button className="launch" onClick={launch} disabled={loading}>
          {loading ? '⏳ Génération...' : '▶ Lancer le brief'}
        </button>
 
        {(script || status) && (
          <>
            <hr />
            <div className="waveform">
              {[...Array(8)].map((_, i) => <div key={i} className={`bar${playing ? ' playing' : ''}`} />)}
            </div>
            {script && (
              <>
                <div className="script-box">{script}</div>
                <div className="controls">
                  <button className="cbtn" onClick={replay}>↻ Rejouer</button>
                  <button className="cbtn" onClick={stop}>◼ Stop</button>
                </div>
              </>
            )}
            <div className="status">
              {(loading || playing) && <span className="dot" />}
              {status}
            </div>
          </>
        )}
      </div>
    </>
  );
}
 
 
