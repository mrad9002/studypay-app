const express = require('express');
const { InferenceClient } = require('@huggingface/inference');
const path = require('path');

const app = express();

const client = new InferenceClient({
  apiKey: process.env.HF_TOKEN
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-questions', async (req, res) => {
  const { board, subject, topic } = req.body;
  const key = `${board}_${subject}_${topic}`.replace(/\s/g, '_');
  const staticDB = {
    'Cambridge_IGCSE_Mathematics_Algebra': [
      { q: 'What is the quadratic formula?', a: 'x = [-b ± sqrt(b²-4ac)] / 2a', marks: 3 },
      { q: 'Simplify 3x + 5x - 2x', a: '6x', marks: 1 },
      { q: 'Factor 4x² - 9', a: '(2x-3)(2x+3)', marks: 2 }
    ],
    // Add remixed for other topics (e.g., from public syllabi, not copied)
    'Edexcel_IGCSE_Physics_Forces': [
      { q: 'What is Newton\'s second law?', a: 'F = ma', marks: 2 },
      { q: 'Calculate speed if distance=10m, time=2s', a: '5 m/s', marks: 2 },
      { q: 'Define inertia', a: 'Tendency to resist change in motion', marks: 3 }
    ]
    // Expand with 5-10 per popular topic
  };

  try {
    const prompt = `Create 3 unique exam-style questions for ${board} ${subject} on ${topic}. Each: question, answer, marks 1-5. JSON array only: [{"q": "...", "a": "...", "marks": n}, ...] No extra text.`;

    const response = await client.textGeneration({
      model: 'Qwen/Qwen2-0.5B-Instruct',  // Free-tier safe in 2026
      inputs: prompt,
      parameters: { max_new_tokens: 350, temperature: 0.7, return_full_text: false }
    });

    let generated = response.generated_text.trim();
    const jsonMatch = generated.match(/$$   [\s\S]*   $$/);
    if (jsonMatch) generated = jsonMatch[0];

    let questions = JSON.parse(generated);
    res.json(questions.slice(0, 3));
  } catch (error) {
    console.error('AI fail:', error.message);
    // Remix fallback – static or sample
    const fallback = staticDB[key] || [
      { q: `Remixed Q1 for ${topic}`, a: 'Sample A', marks: 2 },
      { q: `Remixed Q2 for ${topic}`, a: 'Sample B', marks: 3 },
      { q: `Remixed Q3 for ${topic}`, a: 'Sample C', marks: 1 }
    ];
    res.json(fallback);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`StudyPay running on port ${port}`);
});
