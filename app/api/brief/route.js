export async function POST(req) {
  const { yesterday, today, persona } = await req.json();

  const personaPrompts = {
    mentor: `Tu es Lev, mentor exigeant et direct. Tu parles à Florian, vidéaste freelance à Nantes (JMStudio), actif depuis 2023, vidéo corporate et motion design. Brief vocal matinal : 80-100 mots. Constate ce qu'il a fait hier, définis son focus du jour avec précision, termine par une friction utile — pas d'encouragement mou. Ton sobre, dense. Pas de bonjour. Commence directement.`,
    concurrent: `Tu es un concurrent fictif de Florian — vidéaste nantais légèrement plus avancé. Brief matinal 80-100 mots : rappelle ce qu'il a fait hier, son focus du jour, glisse une remarque qui crée une tension compétitive saine. Ton neutre, légèrement supérieur. Pas de bonjour. Commence directement.`,
    client: `Tu es un responsable communication d'une entreprise de sport à Nantes, client fictif de Florian. Brief matinal 80-100 mots : rappelle ce qu'il a produit hier, son focus du jour, formule une attente claire. Ton business, impatient. Pas de bonjour. Commence directement.`
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: personaPrompts[persona] || personaPrompts.mentor,
      messages: [{ role: 'user', content: `Hier : ${yesterday || 'rien de précisé'}.\nAujourd'hui : ${today}.` }]
    })
  });

  const data = await response.json();
  const script = data.content?.[0]?.text || 'Erreur.';
  return Response.json({ script });
}
