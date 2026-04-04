'use client';
import { useState, useEffect, useRef } from 'react';
 
const personaLabels = {
  mentor: 'Mentor',
  concurrent: 'Concurrent',
  client: 'Client'
};
 
export default function Home() {
  const [yesterday, setYesterday] = useState('');
  const [today, setToday] = useState('');
  const [situation, setSituation] = useState('');
  const [persona, setPersona] = useState('mentor');
  const [script, setScript] = useState('');
  const [audioData, setAudioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState('');
  const audioRef = useRef(null);
 
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
    audio.onplay = () => { setPlaying(true); setStatus('Lecture en cours...'); };
    audio.onended = () => { setPlaying(false); setStatus('Brief terminé.'); };
    audio.onerror = () => { setPlaying(false); setStatus('Erreur audio.'); };
    audio.play();
  };
 
  const launch = async () => {
    if (!today.trim() && !situation.trim()) {
      setStatus('Indique ton focus ou ta situation du jour.');
      return;
    }
    setLoading(true);
    setScript('');
    setAudioData(null);
    setStatus('Analyse en cours...');
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yesterday, today, situation, persona })
      });
      const data = await res.json();
      if (data.error && !data.script) { setStatus('Erreur : ' + data.error); setLoading(false); return; }
      setScript(data.script);
      setAudioData(data.audio || null);
      setStatus(data.audio ? 'Brief prêt.' : 'Brief généré — audio indisponible.');
    } catch (err) {
      setStatus('Erreur : ' + err.message);
    }
    setLoading(false);
  };
 
  const handlePlay = () => { if (audioData) playAudio(audioData); };
 
  const stop = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlaying(false);
    setStatus('Stoppé.');
  };
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --bg: #080808; --surface: #0d0d0d; --surface2: #121212;
          --border: #1a1a1a; --orange: #FF4500;
          --orange-dim: rgba(255,69,0,0.05); --orange-border: rgba(255,69,0,0.12);
          --text: #f0f0f0; --muted: #3a3a3a; --muted2: #222; --muted3: #666;
        }
        body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
        .container { width: 100%; max-width: 500px; }
 
        .header { margin-bottom: 44px; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        .brand img { height: 36px; width: auto; }
        .brand-dot { width: 5px; height: 5px; background: var(--orange); border-radius: 50%; flex-shrink: 0; }
        .brand-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; color: var(--text); }
 
        .app-title { margin-bottom: 4px; }
        .app-title-main { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 48px; line-height: 1.0; text-transform: uppercase; color: var(--text); letter-spacing: -.01em; }
        .app-title-sub { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 300; color: var(--muted3); letter-spacing: .2em; text-transform: uppercase; margin-top: 8px; }
        .time { font-size: 10px; color: var(--muted); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 6px; }
 
        .section { margin-bottom: 16px; }
        label { display: block; font-size: 9px; font-weight: 500; letter-spacing: .2em; text-transform: uppercase; color: var(--muted3); margin-bottom: 7px; }
        textarea { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 300; padding: 13px 16px; border-radius: 8px; resize: none; outline: none; line-height: 1.6; transition: border-color .2s, background .2s; }
        textarea:focus { border-color: var(--orange); background: var(--surface2); }
        textarea::placeholder { color: var(--muted2); }
 
        .situation-field { background: var(--orange-dim); border: 1px solid var(--orange-border); border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
        .situation-field label { color: rgba(255,69,0,0.45); }
        .situation-field textarea { background: transparent; border: none; padding: 0; font-size: 13px; }
        .situation-field textarea:focus { background: transparent; border: none; }
        .situation-field textarea::placeholder { color: rgba(255,69,0,0.18); }
 
        .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .persona-row { display: flex; gap: 6px; }
        .pbtn { background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: .1em; padding: 7px 14px; border-radius: 4px; cursor: pointer; transition: all .15s; text-transform: uppercase; }
        .pbtn:hover { border-color: var(--orange); color: var(--text); }
        .pbtn.active { background: var(--orange); border-color: var(--orange); color: #000; font-weight: 600; }
 
        .launch { width: 100%; background: var(--orange); border: none; color: #000; font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; padding: 18px; border-radius: 8px; cursor: pointer; transition: opacity .2s, transform .1s; }
        .launch:hover { opacity: .85; transform: translateY(-1px); }
        .launch:active { transform: translateY(0); }
        .launch:disabled { opacity: .25; cursor: not-allowed; transform: none; }
 
        .output { margin-top: 36px; }
        .divider { border: none; border-top: 1px solid var(--border); margin-bottom: 28px; }
 
        .waveform { display: flex; align-items: center; gap: 3px; height: 20px; margin-bottom: 20px; }
        .bar { width: 2px; background: var(--orange); border-radius: 2px; height: 3px; opacity: .4; }
        .bar.playing { animation: wave .7s ease-in-out infinite; opacity: 1; }
        .bar:nth-child(2) { animation-delay: .1s; }
        .bar:nth-child(3) { animation-delay: .2s; }
        .bar:nth-child(4) { animation-delay: .3s; }
        .bar:nth-child(5) { animation-delay: .15s; }
        .bar:nth-child(6) { animation-delay: .25s; }
        .bar:nth-child(7) { animation-delay: .05s; }
        .bar:nth-child(8) { animation-delay: .35s; }
        @keyframes wave { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(6); } }
 
        .script-box { background: var(--surface); border: 1px solid var(--border); border-left: 2px solid var(--orange); padding: 20px 24px; border-radius: 8px; font-size: 13px; font-weight: 300; line-height: 1.9; color: var(--muted3); white-space: pre-wrap; margin-bottom: 14px; }
 
        .play-btn { width: 100%; background: transparent; border: 1px solid var(--orange); color: var(--orange); font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; padding: 16px; border-radius: 8px; cursor: pointer; margin-bottom: 10px; transition: all .2s; }
        .play-btn:hover { background: var(--orange); color: #000; }
 
        .controls { display: flex; gap: 8px; margin-bottom: 12px; }
        .cbtn { flex: 1; background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: .15em; text-transform: uppercase; padding: 12px; border-radius: 6px; cursor: pointer; transition: all .15s; }
        .cbtn:hover { border-color: var(--orange); color: var(--text); }
 
        .status { font-size: 10px; color: var(--muted); letter-spacing: .1em; min-height: 16px; text-transform: uppercase; }
        .dot { display: inline-block; width: 5px; height: 5px; background: var(--orange); border-radius: 50%; margin-right: 8px; animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.1; } }
      `}</style>
 
      <div className="container">
        <div className="header">
          <div className="brand">
            <img src="https://framerusercontent.com/images/7igMTlkIIljhHw0RQXwAf9WMZ4A.png" alt="JMStudio" />
            <div className="brand-dot" />
            <span className="brand-name">UpMate</span>
          </div>
          <div className="time">{time}</div>
          <div className="app-title">
            <div className="app-title-main">Ton conseil.<br />Ton entourage.</div>
            <div className="app-title-sub">Le meilleur de chaque esprit — synthétisé pour toi</div>
          </div>
        </div>
 
        <div className="section">
          <label>Hier — ce que tu as accompli</label>
          <textarea rows={2} value={yesterday} onChange={e => setYesterday(e.target.value)} placeholder="ex: tournage Naobike, 3 cold DM envoyés..." />
        </div>
 
        <div className="section">
          <label>Aujourd'hui — focus principal</label>
          <textarea rows={2} value={today} onChange={e => setToday(e.target.value)} placeholder="ex: finir montage Ronin, relancer Valentin..." />
        </div>
 
        <div className="situation-field">
          <label>Situation / Question du jour (optionnel)</label>
          <textarea rows={2} value={situation} onChange={e => setSituation(e.target.value)} placeholder="ex: je doute de ma direction, comment gérer ce client difficile..." />
        </div>
 
        <div className="row">
          <label style={{margin:0}}>Voix</label>
          <div className="persona-row">
            {Object.entries(personaLabels).map(([key, label]) => (
              <button key={key} className={`pbtn${persona === key ? ' active' : ''}`} onClick={() => setPersona(key)}>{label}</button>
            ))}
          </div>
        </div>
 
        <button className="launch" onClick={launch} disabled={loading}>
          {loading ? 'Analyse en cours...' : 'Lancer le brief'}
        </button>
 
        {(script || status) && (
          <div className="output">
            <div className="divider" />
            <div className="waveform">
              {[...Array(8)].map((_, i) => <div key={i} className={`bar${playing ? ' playing' : ''}`} />)}
            </div>
            {script && (
              <>
                <div className="script-box">{script}</div>
                {audioData && !playing && (
                  <button className="play-btn" onClick={handlePlay}>Ecouter le brief</button>
                )}
                {playing && (
                  <div className="controls">
                    <button className="cbtn" onClick={handlePlay}>Rejouer</button>
                    <button className="cbtn" onClick={stop}>Stop</button>
                  </div>
                )}
              </>
            )}
            <div className="status">
              {(loading || playing) && <span className="dot" />}
              {status}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
 
 
