export async function POST(req) {
  try {
    const { yesterday, today, persona } = await req.json();

    const personaPrompts = {
      mentor: `Tu es Lev, mentor exigeant et direct. Tu parles à Florian, vidéaste freelance à Nantes (JMStudio), actif depuis 2023, vidéo corporate et motion design. Brief vocal matinal : 80-100 mots. Constate ce qu'il a fait hier, définis son focus du jour avec précision, termine par une friction utile. Ton sobre, dense. Pas de bonjour. Commence directement.`,
      concurrent: `Tu es un concurrent fictif de Florian — vidéaste nantais légèrement plus avancé. Brief matinal 80-100 mots. Ton neutre, légèrement supérieur. Pas de bonjour. Commence directement.`,
      client: `Tu es un responsable communication d'une entreprise de sport à Nantes, client fictif de Florian. Brief matinal 80-100 mots. Ton business, impatient. Pas de bonjour. Commence directement.`
    };

    // Génération du script via Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        system: personaPrompts[persona] || personaPrompts.mentor,
        messages: [{ role: 'user', content: `Hier : ${yesterday || 'rien'}.\nAujourd'hui : ${today}.` }]
      })
    });

    const claudeData = await claudeRes.json();
    if (claudeData.error) return Response.json({ error: 'Claude: ' + claudeData.error.message });
    const script = claudeData.content?.[0]?.text;
    if (!script) return Response.json({ error: 'Script vide' });

    // Synthèse vocale via ElevenLabs — voix "Adam" (masculine neutre)
    const voiceId = 'pNInz6obpgDQGcFmaJgB';
    const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      return Response.json({ script, error: 'ElevenLabs: ' + errText.slice(0, 100) });
    }

    const audioBuffer = await elevenRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return Response.json({ script, audio: audioBase64 });

  } catch(err) {
    return Response.json({ error: 'Erreur serveur: ' + err.message });
  }
}
