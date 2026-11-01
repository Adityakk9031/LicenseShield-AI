// Discover + call the newest Gemini models available to this API key
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. List models this key can actually use (flash-preview-ish only)
console.log('── models available to this key ──');
const models = await ai.models.list({ pageSize: 100 });
const names = [];
for await (const m of models) {
  const n = m.name?.replace(/^models\//, '') || '';
  if (n.includes('flash')) names.push(n);
}
[...new Set(names)].sort().forEach((n) => console.log('  ', n));

// 2. Try calling a 3.8 Flash family model
const candidates = ['gemini-3.8-flash', 'gemini-3.8-flash-preview', 'gemini-3.8-flash-latest'];
for (const model of candidates) {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: 'Reply with exactly: PAYLOAD-OK',
      config: { maxOutputTokens: 20 },
    });
    console.log(`✅ ${model} works: "${res.text?.trim()}"`);
    break;
  } catch (err) {
    console.log(`❌ ${model}: ${(err?.message || err).toString().slice(0, 140)}`);
  }
}
