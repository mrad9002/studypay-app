const express = require('express');
const fetch = require('node-fetch'); // Add this dependency for Groq calls
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/generate-questions', async (req, res) => {
  const { syllabus, grade, subject, topic } = req.body;
  try {
    const prompt = `You are an expert exam question writer for Cambridge and Edexcel syllabi.
Create a question paper with 5 questions (mix MCQ, short answer) for:
- Syllabus: ${syllabus}
- Grade: ${grade}
- Subject: ${subject}
- Topic: ${topic}

Output ONLY JSON:
{
  "title": "Question Paper - ${subject} ${topic}",
  "questions": [
    {"number": 1, "text": "Question text", "type": "mcq/short", "marks": 2, "options": ["A", "B", "C", "D"] if mcq, "answer": "Correct answer", "markscheme": "Marking notes"}
  ]
}
No extra text.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Free model on Groq
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    let generated = data.choices[0].message.content.trim();

    let paper;
    try {
      paper = JSON.parse(generated);
    } catch (e) {
      paper = {
        title: `Fallback Paper for ${subject} - ${topic}`,
        questions: [
          { number: 1, text: `What is a key concept in ${topic}?`, type: 'short', marks: 2, answer: 'Sample answer', markscheme: 'Award 2 marks for correct definition' },
          { number: 2, text: `Solve simple problem on ${topic}.`, type: 'short', marks: 3, answer: 'Sample solution', markscheme: '1 mark for method, 2 for answer' },
          { number: 3, text: `Multiple choice on ${topic}: A, B, C, D`, type: 'mcq', marks: 1, options: ['A', 'B', 'C', 'D'], answer: 'B', markscheme: 'Correct choice B' },
          { number: 4, text: `Explain ${topic}.`, type: 'short', marks: 4, answer: 'Detailed explanation', markscheme: '2 marks for key points, 2 for example' },
          { number: 5, text: `Another question on ${topic}.`, type: 'short', marks: 2, answer: 'Answer here', markscheme: 'Full marks for accuracy' }
        ]
      };
    }

    res.json(paper);
  } catch (error) {
    console.error(error);
    res.status(500).json({ title: 'Error', questions: [] });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
