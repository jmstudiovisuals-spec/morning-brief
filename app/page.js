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
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState('');
  const lastScriptRef = useRef(null);
 
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
 
  const speak = (text) => {
    if (!window.speechSynthesis) { setStatus('Voix non supportée.'); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'fr-FR';
    utt.rate = 0.92;
    utt.pitch = 0.88;
    const voices = window.speechSynthesis.getVoices();
    const fr = voices.find(v => v.lang.startsWith('fr'));
    if (fr) utt.voice = fr;
    utt.onstart = () => { setPlaying(true); setStatus('Lecture en cours...'); };
    utt.onend = () => { setPlaying(false); setStatus('Brief terminé.'); };
    utt.onerror = () => { setPlaying(false); setStatus('Erreur voix.'); };
    window.speechSynthesis.speak(utt);
  };
 
  const launch = async () => {
    if (!today.trim() && !situation.trim()) {
      setStatus('Indique ton focus ou ta situation du jour.');
      return;
    }
    setLoading(true);
    setScript('');
    setStatus('Génération en cours...');
    try {
      const res = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yesterday, today, situation, persona })
      });
      const data = await res.json();
      if (data.error) { setStatus('Erreur : ' + data.error); setLoading(false); return; }
      setScript(data.script);
      lastScriptRef.current = data.script;
      setStatus('Brief prêt. Appuie sur Écouter.');
    } catch (err) {
      setStatus('Erreur : ' + err.message);
    }
    setLoading(false);
  };
 
  const handlePlay = () => {
    if (lastScriptRef.current) speak(lastScriptRef.current);
  };
 
  const stop = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPlaying(false);
    setStatus('Stoppé.');
  };
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Inter:wght@300;400;500&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
          --bg: #080808; --surface: #0f0f0f;
          --border: #1e1e1e; --orange: #FF4500; --orange-dim: rgba(255,69,0,0.06);
          --orange-border: rgba(255,69,0,0.14); --text: #f0f0f0;
          --muted: #444; --muted2: #2a2a2a;
        }
        body { background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
        .container { width: 100%; max-width: 520px; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .brand img { height: 36px; width: auto; }
        .brand-dot { width: 5px; height: 5px; background: var(--orange); border-radius: 50%; flex-shrink: 0; }
        .brand-sub { font-size: 10px; font-weight: 300; color: var(--muted); letter-spacing: .14em; text-transform: uppercase; }
        .time { font-size: 10px; color: #2e2e2e; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 12px; }
        h1 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 42px; line-height: 1.0; text-transform: uppercase; color: var(--text); margin-bottom: 36px; }
        h1 span { color: var(--orange); }
        label { display: block; font-size: 9px; font-weight: 500; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
        textarea { width: 100%; background: var(--surface); border: 1px solid var(--border); color: var(--text); font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 300; padding: 13px 16px; border-radius: 6px; resize: none; outline: none; line-height: 1.6; margin-bottom: 18px; transition: border-color .2s; }
        textarea:focus { border-color: var(--orange); }
        textarea::placeholder { color: var(--muted2); }
        .situation-field { background: var(--orange-dim); border: 1px solid var(--orange-border); border-radius: 6px; padding: 14px 16px; margin-bottom: 22px; }
        .situation-field label { color: rgba(255,69,0,0.5); margin-bottom: 6px; }
        .situation-field textarea { background: transparent; border: none; padding: 0; margin-bottom: 0; font-size: 13px; }
        .situation-field textarea:focus { border: none; }
        .situation-field textarea::placeholder { color: rgba(255,69,0,0.2); }
        .persona-row { display: flex; gap: 6px; margin-bottom: 26px; }
        .pbtn { background: var(--surface); border: 1px solid var(--border); color: #333; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: .12em; padding: 8px 16px; border-radius: 4px; cursor: pointer; transition: all .15s; text-transform: uppercase; }
        .pbtn:hover { border-color: var(--orange); color: var(--text); }
        .pbtn.active { background: var(--orange); border-color: var(--orange); color: #000; font-weight: 600; }
        .launch { width: 100%; background: var(--orange); border: none; color: #000; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; padding: 18px; border-radius: 6px; cursor: pointer; transition: opacity .2s, transform .1s; }
        .launch:hover { opacity: .88; transform: translateY(-1px); }
        .launch:active { transform: translateY(0); }
        .launch:disabled { opacity: .3; cursor: not-allowed; transform: none; }
        hr { border: none; border-top: 1px solid #141414; margin: 32px 0; }
        .waveform { display: flex; align-items: center; gap: 3px; height: 24px; margin-bottom: 22px; }
        .bar { width: 2px; background: var(--orange); border-radius: 2px; height: 3px; opacity: .5; }
        .bar.playing { animation: wave .7s ease-in-out infinite; opacity: 1; }
        .bar:nth-child(2) { animation-delay: .1s; }
        .bar:nth-child(3) { animation-delay: .2s; }
        .bar:nth-child(4) { animation-delay: .3s; }
        .bar:nth-child(5) { animation-delay: .15s; }
        .bar:nth-child(6) { animation-delay: .25s; }
        .bar:nth-child(7) { animation-delay: .05s; }
        .bar:nth-child(8) { animation-delay: .35s; }
        @keyframes wave { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(5); } }
        .script-box { background: var(--surface); border: 1px solid var(--border); border-left: 2px solid var(--orange); padding: 20px 24px; border-radius: 6px; font-size: 13px; font-weight: 300; line-height: 1.9; color: #888; white-space: pre-wrap; margin-bottom: 16px; }
        .play-btn { width: 100%; background: #000; border: 1px solid var(--orange); color: var(--orange); font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; padding: 16px; border-radius: 6px; cursor: pointer; margin-bottom: 10px; transition: all .15s; }
        .play-btn:hover { background: var(--orange); color: #000; }
        .controls { display: flex; gap: 8px; margin-bottom: 12px; }
        .cbtn { flex: 1; background: var(--surface); border: 1px solid var(--border); color: #333; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: .15em; text-transform: uppercase; padding: 12px; border-radius: 4px; cursor: pointer; transition: all .15s; }
        .cbtn:hover { border-color: var(--orange); color: var(--text); }
        .status { font-size: 10px; color: var(--muted); letter-spacing: .1em; min-height: 16px; text-transform: uppercase; }
        .dot { display: inline-block; width: 5px; height: 5px; background: var(--orange); border-radius: 50%; margin-right: 8px; animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.15; } }
      `}</style>
 
      <div className="container">
        <div className="brand">
          <img src="https://framerusercontent.com/images/7igMTlkIIljhHw0RQXwAf9WMZ4A.png" alt="JMStudio" />
          <div className="brand-dot" />
          <span className="brand-sub">Daily Coach</span>
        </div>
        <div className="time">{time}</div>
        <h1>DAILY<br /><span>BRIEF.</span></h1>
 
        <label>Hier — ce que tu as accompli</label>
        <textarea rows={2} value={yesterday} onChange={e => setYesterday(e.target.value)} placeholder="ex: tournage Naobike, 3 cold DM envoyés..." />
 
        <label>Aujourd'hui — focus principal</label>
        <textarea rows={2} value={today} onChange={e => setToday(e.target.value)} placeholder="ex: finir montage Ronin, relancer Valentin..." />
 
        <div className="situation-field">
          <label>Situation / Question du jour (optionnel)</label>
          <textarea rows={2} value={situation} onChange={e => setSituation(e.target.value)} placeholder="ex: je doute de ma direction, comment gérer ce client..." />
        </div>
 
        <label>Voix</label>
        <div className="persona-row">
          {Object.entries(personaLabels).map(([key, label]) => (
            <button key={key} className={`pbtn${persona === key ? ' active' : ''}`} onClick={() => setPersona(key)}>{label}</button>
          ))}
        </div>
 
        <button className="launch" onClick={launch} disabled={loading}>
          {loading ? 'Génération...' : 'Lancer le brief'}
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
                {!playing && (
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
          </>
        )}
      </div>
    </>
  );
}
 
