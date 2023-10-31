const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');


import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const AWS = require('aws-sdk');
AWS.config.loadFromPath('awsConfig.json');

app.use(bodyParser.json());
app.use(cors());
app.post('api/talk-to-gpt', async (req, res) => {

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

    fs.writeFile(filePath + fileName, audioStream, function (err) {
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