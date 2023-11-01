const express = require('express');
const axios = require('axios').default;
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

require('dotenv').config();

const AWS = require('aws-sdk');

import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: apiKey
});

const client = axios.create({
  headers: {
    'Authorization': `Bearer ${apiKey}`,
  }
});

app.use(express.json());
app.use(cors());
client.post('/api/talk-to-gpt', async (req, res) => {

  const completion = await openai.completions.create({
    model: "text-davinci-003",
    prompt: req.body.text,
    max_tokens: 100,
    temperature: 0.5
  })

  let num = (Math.random() * 100000000).toFixed(0);

  const polly = new AWS.Polly({ region: 'us-west-2' });
  const params = {
    OutputFormat: "mp3",
    Text: completion.choices[0].text,
    VoiceId: "Matthew"
  };

  const synthAudio = new Promise((resolve, reject) => {
    polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.AudioStream);
      }
    });
  });

  try {
    const audioStream = await synthAudio;

    const filePath = '../public/voice/';
    const fileName = `${num}.mp3`;

    fs.writeFile(filePath + fileName, audioStream, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`${fileName} was saved!`);
      }
    });

    setTimeout(() => {
      res.status(200).json({ fileName: fileName });
    }, 4500);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate and save the audio file' });
  }
})

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));