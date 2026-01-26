const express = require('express');
const { HfInference } = require('@huggingface/inference');
const path = require('path');

const app = express();

// Use the new router endpoint (required in 2026)
const hf = new HfInference(process.env.HF_TOKEN, {
  apiUrl: 'https://router.huggingface.co/hf-inference'  // New unified endpoint
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-questions', async (req, res) => {
  const { board, subject, topic } = req.body;
  try {
    const prompt = `Generate exactly 3 exam-style questions for ${board} ${subject} on the topic "${topic}". Each question must include: the question text, the correct answer, and marks (1-5). Output ONLY a valid JSON array like: [{"q": "Question text", "a": "Correct answer", "marks": 3}, ...]. No extra text before or after the JSON.`;

    const response = await hf.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2',
      inputs: prompt,
      parameters: { max_new_tokens: 400, temperature: 0.7 }
    });

    let generated = response.generated_text.trim();
    // Clean up any prompt echo or extras
    generated = generated.replace(/.*?\[/s, '[').replace(/\].*?$/, ']').trim();

    let questions;
    try {
      questions = JSON.parse(generated);
    } catch (parseError) {
      console.error('JSON parse failed:', parseError);
      // Very basic fallback
      questions = [
        { q: `Fallback Q1 for ${topic}`, a: 'Sample answer', marks: 2 },
        { q: `Fallback Q2 for ${topic}`, a: 'Another answer', marks: 3 },
        { q: `Fallback Q3 for ${topic}`, a: 'Final answer', marks: 1 }
      ];
    }

    res.json(questions.slice(0, 3));
  } catch (error) {
    console.error('HF error:', error.message);
    res.status(500).json([{ q: 'AI generation failed (router issue?). Try again.', a: 'N/A', marks: 0 }]);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`StudyPay running on port ${port}`);
});