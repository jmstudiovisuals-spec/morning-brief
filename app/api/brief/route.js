

import { list } from '@vercel/blob';
 
const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB max par image
 
async function fetchContextFromBlob() {
  try {
    const { blobs } = await list();
 
    const contextParts = await Promise.all(
      blobs.slice(0, 12).map(async (blob) => {
        try {
          const name = blob.pathname.toLowerCase();
          const res = await fetch(blob.downloadUrl);
          const arrayBuffer = await res.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
 
          // PDF
          if (name.endsWith('.pdf')) {
            if (bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
              return null;
            }
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            return {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 }
            };
          }
 
          // Images — ignore si trop lourdes
          if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp')) {
            if (arrayBuffer.byteLength > MAX_IMAGE_SIZE) return null;
            const mediaType = name.endsWith('.png') ? 'image/png' :
                              name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            const base64 = Buffer.from(arrayBuffer).toString('base64');
            return {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 }
            };
          }
 
          return null;
        } catch (e) {
          return null;
        }
      })
    );
 
    return contextParts.filter(Boolean);
  } catch (e) {
    return [];
  }
}
 
export async function POST(req) {
  try {
    const { yesterday, today, situation, persona } = await req.json();
 
    const userContent = [
      yesterday ? `Hier : ${yesterday}.` : null,
      today ? `Aujourd'hui : ${today}.` : null,
      situation ? `Situation / Question : ${situation}` : null,
    ].filter(Boolean).join('\n');
 
    if (!userContent) {
      return Response.json({ error: 'Aucune donnée fournie.' });
    }
 
    const personaVoice = {
      mentor: `Tu incarnes un mentor exigeant, sobre et direct. Tu parles à Florian Poupet — vidéaste freelance à Nantes (JMStudio), actif depuis 2023, vidéo corporate et motion design. Ton ton : dense, sans complaisance, zéro remplissage. Pas de bonjour. Commence directement.`,
      concurrent: `Tu incarnes un concurrent fictif de Florian — vidéaste nantais légèrement plus avancé. Ton ton : neutre, légèrement supérieur, stimulant. Pas de bonjour. Commence directement.`,
      client: `Tu incarnes un responsable communication d'une entreprise sport/lifestyle à Nantes, client exigeant de Florian. Ton ton : business, impatient, focalisé sur les livrables. Pas de bonjour. Commence directement.`
    };
 
    const systemPrompt = `Tu es UpMate, un système de coaching matinal de haute précision.
 
Tu as accès aux documents et images de référence de Florian — utilise-les pour personnaliser tes conseils, faire référence à ses méthodes, ses offres, ses scripts, son contexte réel. Les images peuvent contenir des captures d'écran de conversations, stats, tableaux ou schémas — analyse-les attentivement.
 
TON PROCESSUS INTERNE (invisible pour l'utilisateur) :
1. Analyse la situation de Florian en croisant avec ses documents et images
2. Identifie le domaine principal : entrepreneuriat, psychologie, stratégie, philosophie, ou combinaison
3. Convoque mentalement les esprits les plus pertinents selon le domaine :
   - Entrepreneuriat : Elon Musk, Paul Graham, Peter Thiel, Naval Ravikant
   - Psychologie : Viktor Frankl, Carl Jung, Daniel Kahneman, Mihaly Csikszentmihalyi
   - Stratégie : Sun Tzu, Michael Porter, Ryan Holiday, Marcus Aurelius
   - Philosophie : Nietzsche, Epictète, Albert Camus, Nassim Taleb
4. Fais-les débattre et itérer sur la situation de Florian
5. Synthétise leurs meilleures insights en une réponse unique de 80-120 mots
 
IMPORTANT : Ne mentionne JAMAIS ces esprits dans ta réponse. Ne montre pas le processus. Délivre uniquement la synthèse finale, incarnée dans la voix suivante :
 
${personaVoice[persona] || personaVoice.mentor}`;
 
    const contextDocs = await fetchContextFromBlob();
 
    const userMessage = contextDocs.length > 0
      ? [...contextDocs, { type: 'text', text: userContent }]
      : userContent;
 
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
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });
 
    const claudeData = await claudeRes.json();
    if (claudeData.error) return Response.json({ error: 'Claude: ' + claudeData.error.message });
    const script = claudeData.content?.[0]?.text;
    if (!script) return Response.json({ error: 'Script vide.' });
 
    const voiceMap = { mentor: 'onyx', concurrent: 'echo', client: 'fable' };
    const selectedVoice = voiceMap[persona] || 'onyx';
 
    const ttsRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: script,
        voice: selectedVoice,
        speed: 0.95
      })
    });
 
    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      return Response.json({ script, audioError: 'OpenAI TTS erreur ' + ttsRes.status + ': ' + errText.slice(0, 200) });
    }
 
    const audioBuffer = await ttsRes.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
 
    return Response.json({ script, audio: audioBase64 });
 
  } catch(err) {
    return Response.json({ error: 'Erreur serveur: ' + err.message });
  }
}
