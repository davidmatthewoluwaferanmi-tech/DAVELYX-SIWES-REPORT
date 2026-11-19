const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Generation service is not configured.' });

  const body = req.body || {};
  const fields = body.fields || {};
  const packageType = String(fields.package_type || '');
  const logbook = String(fields.logbook || '').trim();
  const customNote = String(fields.custom_note || '').trim();
  if (!['logbook_only', 'report_only', 'bundle'].includes(packageType)) return res.status(400).json({ error: 'Please select a package.' });
  if (!logbook) return res.status(400).json({ error: 'Please enter your logbook, we cannot invent work for you.' });
  if (logbook.length > 50000 || customNote.length > 12000) return res.status(413).json({ error: 'The submitted text is too long.' });

  let prompt;
  try { prompt = fs.readFileSync(path.join(process.cwd(), 'siwes-prompt.txt'), 'utf8').trim(); }
  catch { return res.status(503).json({ error: 'The generator prompt file is unavailable.' }); }
  if (!prompt || prompt === 'PASTE_MASTER_PROMPT_HERE') return res.status(503).json({ error: 'The master prompt has not been installed yet.' });

  const variables = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, String(value ?? '').slice(0, key === 'logbook' ? 50000 : 4000)]));
  variables.package_type = packageType;
  variables.logbook = logbook;
  variables.custom_note = customNote;
  const packageInstructions = packageType === 'bundle'
    ? 'For this bundle, structure the response in this order: PART A — Logbook; PART B — Report; Consistency Check. Use only submitted experience; do not fabricate activities.'
    : packageType === 'logbook_only'
      ? 'Generate only the logbook deliverable.'
      : 'Generate only the technical report deliverable, using the supplied logbook as source material.';
  const serialized = JSON.stringify(variables);
  const expandedPrompt = prompt.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => variables[key] || '');
  const userContent = `${packageInstructions}\n\nORDER DATA (JSON):\n${serialized}\n\nPROMPT WITH AVAILABLE VARIABLES:\n${expandedPrompt}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: prompt }, { role: 'user', content: userContent }], temperature: 0.4, max_tokens: 8000 })
    });
    const result = await response.json();
    if (!response.ok) return res.status(502).json({ error: 'Document generation failed. Please try again later.' });
    const markdown = result.choices?.[0]?.message?.content;
    if (!markdown) return res.status(502).json({ error: 'The generator returned an empty document.' });
    return res.status(200).json({ markdown });
  } catch (error) {
    console.error('OpenAI generation request failed:', error);
    return res.status(502).json({ error: 'Document generation failed. Please try again later.' });
  }
};
