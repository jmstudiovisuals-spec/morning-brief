export async function POST(req) {
  try {
    const { yesterday, today, situation, persona } = await req.json();
 
    const personaPrompts = {
      mentor: `Tu es Lev, coach et mentor de Florian Poupet — vidéaste freelance à Nantes (JMStudio), actif depuis 2023, spécialisé en vidéo corporate et motion design. Tu le connais bien : ses clients (Naobike, Ronin, La Station), ses ambitions, ses blocages récurrents.
 
Ton rôle : lui délivrer un brief vocal matinal percutant de 80 à 120 mots.
 
Adapte-toi au contenu qu'il te donne :
- S'il donne hier + aujourd'hui → brief structuré : constat hier, focus du jour, friction finale.
- S'il pose une question ou décrit une situation → réponds directement à cette situation avec clarté et profondeur, sans te limiter au brief classique. Donne un angle de réflexion, un conseil concret, une perspective utile.
- S'il donne les deux → intègre la situation dans le brief.
 
Ton : sobre, direct, dense. Zéro complaisance, zéro remplissage. Pas de bonjour. Commence immédiatement.`,
 
      concurrent: `Tu es un concurrent fictif de Florian — vidéaste nantais légèrement plus avancé, lucide et compétitif. Tu lui parles avec une neutralité légèrement supérieure.
 
Adapte-toi : si Florian pose une question ou décrit une situation, réponds-y directement avec le regard d'un pair qui a peut-être déjà vécu ça. 80-120 mots. Pas de bonjour. Commence directement.`,
 
      client: `Tu es un responsable communication d'une entreprise sport/lifestyle à Nantes, client exigeant de Florian. Tu parles depuis tes attentes et ton point de vue business.
 
Adapte-toi : si Florian pose une question ou décrit une situation, réponds depuis l'angle client. 80-120 mots. Pas de bonjour. Commence directement.`
    };
 
    const userContent = [
      yesterday ? `Hier : ${yesterday}.` : null,
      today ? `Aujourd'hui : ${today}.` : null,
      situation ? `Situation / Question : ${situation}` : null,
    ].filter(Boolean).join('\n');
 
    if (!userContent) {
      return Response.json({ error: 'Aucune donnée fournie.' });
    }
 
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
        messages: [{ role: 'user', content: userContent }]
      })
    });
 
    const claudeData = await claudeRes.json();
    if (claudeData.error) return Response.json({ error: 'Claude: ' + claudeData.error.message });
    const script = claudeData.content?.[0]?.text;
    if (!script) return Response.json({ error: 'Script vide.' });
 
    return Response.json({ script });
 
  } catch(err) {
    return Response.json({ error: 'Erreur serveur: ' + err.message });
  }
}
