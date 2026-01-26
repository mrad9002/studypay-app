const express = require('express');
const { InferenceClient } = require('@huggingface/inference');
const path = require('path');

const app = express();

const client = new InferenceClient({
  apiKey: process.env.HF_TOKEN  // Your free token
  // No need for explicit baseURL – client defaults to router.huggingface.co in latest versions
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-questions', async (req, res) => {
  const { board, subject, topic } = req.body;
  try {
    const prompt = `Generate exactly 3 exam-style questions for ${board} ${subject} on the topic "${topic}". Each must have: question text, correct answer, marks (1-5). Output ONLY valid JSON array: [{"q": "question", "a": "answer", "marks": number}, ...] No extra text.`;

    // Use new client syntax – model with :fastest to route optimally on free tier
    const response = await client.textGeneration({
      model: 'mistralai/Mistral-7B-Instruct-v0.2:fastest',  // Or try 'gpt2:fastest' for ultra-reliable fallback
      inputs: prompt,
      parameters: {
        max_new_tokens: 400,
        temperature: 0.7,
        return_full_text: false  // Avoid echoing prompt
      }
    });

    let generated = response.generated_text.trim();

    let questions;
    try {
      // Clean common extras
      generated = generated.match(/\[.*\]/s)?.[0] || generated;
      questions = JSON.parse(generated);
    } catch (parseErr) {
      console.error('Parse error:', parseErr);
      questions = [
        { q: `Sample Q1: Explain ${topic}`, a: 'Sample answer', marks: 2 },
        { q: `Sample Q2: Solve for ${topic}`, a: 'x=42', marks: 3 },
        { q: `Sample Q3: Define ${topic}`, a: 'Definition here', marks: 1 }
      ];
    }

    res.json(questions.slice(0, 3));
  } catch (error) {
    console.error('Inference error:', error.message);
    res.status(500).json([{ q: 'AI error – try again or different topic.', a: 'N/A', marks: 0 }]);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`StudyPay running on port ${port}`);
});