const express = require('express');
const { HfInference } = require('@huggingface/inference');
const path = require('path');

const app = express();
const hf = new HfInference(process.env.HF_TOKEN); // Your free Hugging Face token from env

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
      model: 'mistralai/Mistral-7B-Instruct-v0.2', // Free model on HF; better quality
      inputs: prompt,
      parameters: { max_new_tokens: 400, temperature: 0.7 }
    });

    let generated = response.generated_text.replace(prompt, '').trim();
    let questions;
    try {
      questions = JSON.parse(generated);
    } catch (e) {
      // Simple fallback if AI output isn't perfect JSON
      questions = [
        { q: 'Fallback Question 1: What is 2+2?', a: '4', marks: 1 },
        { q: 'Fallback Question 2: Define gravity.', a: 'Force pulling objects together.', marks: 2 },
        { q: 'Fallback Question 3: Solve x=5.', a: 'x=5', marks: 1 }
      ];
    }

    res.json(questions.slice(0, 3)); // Send 3 questions
  } catch (error) {
    console.error(error);
    res.status(500).json([{ q: 'Error: AI failed. Try again later.', a: 'N/A', marks: 0 }]);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`StudyPay app running on port ${port}`);
});