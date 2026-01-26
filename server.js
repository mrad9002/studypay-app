const express = require('express');
const { InferenceClient } = require('@huggingface/inference');
const path = require('path');

const app = express();

const client = new InferenceClient({
  apiKey: process.env.HF_TOKEN  // Your free Hugging Face token – double-check it's correct in Render env
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-questions', async (req, res) => {
  const { board, subject, topic } = req.body;
  try {
    const prompt = `Generate exactly 3 exam-style questions for ${board} ${subject} on the topic "${topic}". 
Each question must include: the question text, the correct answer, and marks (1-5). 
Output ONLY a valid JSON array like this: 
[{"q": "Question text here", "a": "Correct answer here", "marks": 3}, ...]
No extra text, explanations, or code blocks before or after the JSON.`;

    const response = await client.textGeneration({
      model: 'gpt2',  // Reliable free model – no suffix needed
      inputs: prompt,
      parameters: {
        max_new_tokens: 350,
        temperature: 0.7,
        return_full_text: false
      }
    });

    let generated = response.generated_text.trim();

    // Aggressive cleanup: extract JSON array if wrapped
    const jsonMatch = generated.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      generated = jsonMatch[0];
    }

    let questions;
    try {
      questions = JSON.parse(generated);
      // Validate shape
      if (!Array.isArray(questions) || questions.length === 0) throw new Error('Not an array');
    } catch (parseErr) {
      console.error('Parse failed:', parseErr, 'Raw:', generated);
      // Strong fallback
      questions = [
        { q: `What is a basic concept in ${topic}?`, a: 'Basic definition here.', marks: 2 },
        { q: `Solve a simple problem related to ${topic}.`, a: 'Answer: example solution.', marks: 3 },
        { q: `Explain ${topic} in one sentence.`, a: 'Explanation sentence.', marks: 1 }
      ];
    }

    res.json(questions.slice(0, 3));
  } catch (error) {
    console.error('Inference error:', error.message);
    res.status(500).json([{ q: 'AI generation failed – likely token or quota issue. Try again later.', a: 'N/A', marks: 0 }]);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`StudyPay running on port ${port}`);
});
