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
  const synthRef = useRef(null);

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
    utt.onerror = () => { setPlaying(false); setStatus('Erreur voix — lis le script.'); };
    window.speechSynthesis.speak(utt);
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
      setScript(data.script);
      setTimeout(() => speak(data.script), 300);
    } catch (err) {
      setStatus('Erreur : ' + err.message);
    }
    setLoading(false);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
    setStatus('Stoppé.');
  };

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
        bod
