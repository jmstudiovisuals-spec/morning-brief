export async function POST(req) {
  try {
    const { yesterday, today, persona } = await req.json();

    const personaPrompts = {
      mentor: `Tu es Lev, mentor exigeant et direct. Tu parles à Florian, vidéaste freelance à Nantes (JMStudio), actif depuis 2023, vidéo corporate et motion design. Brief vocal matinal : 80-100 mots. Constate ce qu'il a fait hier, définis son focus du jour avec précision, termine par une friction utile. Ton sobre, dense. Pas de bonjour. Commence directement.`,
      concurrent: `Tu es un concurrent fictif de Florian — vidéaste nantais légèrement plus avancé. Brief matinal 80-100 mots. Ton neutre, légèrement supérieur. Pas de bonjour. Commence directement.`,
      client: `Tu es un responsable communication d'une entreprise de sport à Nantes, client fictif de Florian. Brief matinal 80-100 mots. Ton business, impatient. Pas de bonjour. Commence directement.`
    };

    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
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

    const rawText = await apiResponse.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch(e) {
      return Response.json({ script: 'Erreur parsing: ' + rawText.slice(0, 200) });
    }

    if (data.error) {
      return Response.json({ script: 'Erreur API: ' + data.error.message });
    }

    const script = data.content?.[0]?.text || 'Réponse vide: ' + JSON.stringify(data);
    return Response.json({ script });

  } catch(err) {
    return Response.json({ script: 'Erreur serveur: ' + err.message });
  }
}
