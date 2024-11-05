const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

app.post('/api/openai', async (req, res) => {
  const { prompt } = req.body;
  const url = `${process.env.OPENAI_API_ENDPOINT}/openai/deployments/<deployment-id>/completions?api-version=2023-03-15-preview`;

  try {
    const response = await axios.post(
      url,
      {
        prompt,
        max_tokens: 50,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.OPENAI_API_KEY,
        },
      },
    );

    res.json({ response: response.data.choices[0].text });
  } catch (error) {
    console.error('Error calling Azure OpenAI API:', error);
    res
      .status(500)
      .json({ error: 'Failed to fetch response from Azure OpenAI' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
