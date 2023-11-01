<template>
  <section>
    <div class="btn-container">
      <button
        type="button"
        class="btn btn-primary"
        @click="handleSpeech()"
      >
        Talk to GPT
      </button>
    </div>
    <div class="display-container">
      <div v-if="action" class="action">
        {{ action }}
      </div>
      <div v-if="output" class="output">
        <b>Question:</b> {{ output }}
      </div>
    </div>

    <div>
      <div v-if="audioSrc">
        <audio :src="audioSrc" id="player" ref="player" type="audio/mpeg" controls hidden></audio>
      </div>
      <canvas ref="canvas"></canvas>
    </div>
  </section>
</template>

<script>
import { ref, onMounted } from "vue";
import { useAVLine, useAVBars } from "vue-audio-visual";
import axios from "axios";

export default {
  name: 'App',

  setup() {
    const player = ref(null)
    const canvas = ref(null)
    let audioSrc = ref(null)
    let action = ref('')
    let output = ref('')

    useAVLine(player, canvas, {
      src: audioSrc,
      canvasWidth: 1000,
      canvasHeight: 1000,
      canvWidth: 100,
      barWidth: 5,
      barColor: 'lime'
    })
    onMounted(() => {
      getMicrophone()
    })

    const getMicrophone = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(stream) {
        console.log('Page accessed microphone successfully!');
        if (audioSrc.value) {
          stream = audioSrc.value
        }
      })
      .catch(function(err) {
        console.log('You did not let the page access the microphone', err);
      });
  }

    const handleSpeech = () => {
      var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
      var recognition = new SpeechRecognition();

      recognition.onstart = () => { action.value = "Listening for inquiry..." };
      console.log(recognition, Error)
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if(event.error == 'no-speech') {
          action.value = "No speech was detected. Try again.";
          console.log(action.value, audioSrc.value, player.value)  
        };
      }
        
      recognition.onspeechend = () => {
        action.value = "You were quiet for a while so voice recognition turned itself off.";
        recognition.stop();
      }
      
      recognition.onresult = async (event) => {
        var transcript = event.results[0][0].transcript;
        output.value = transcript

        try {
          let res = await axios.post('http://localhost:5000/api/talk-to-gpt', {
            text: transcript,
          })

          if (res.data) {
            action.value = "GPT-3 is thinking..."
            audioSrc.value = res.data
            if (player.value) {
            setTimeout(() => { player.value.play() }, 500)
            }
          }
        } catch (err) {
          console.log(err)
        }
      };

      recognition.start();
    }

    return {
      handleSpeech,
      player,
      canvas,
      audioSrc,
      action,
      output
    }
  }
}
 


</script>

<style>
body {
  background-color: rgb(23, 23, 23);
}

canvas {
    padding: 0;
    margin: auto;
    display: block;
    width: 800px;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
}
.btn-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
button {
  padding: 8px 13px;
  border-radius: 5px;
  background-color: rgb(81, 148, 81);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  cursor: pointer;
}
.display-container {
  width: 100%;
  text-align: center;
  color: white;
}
.action {
  margin-top: 10px;
  margin-bottom: 10px;
}
.output {
  max-width: 500px;
  padding: 20px;
  border-radius: 10px;
  border: 1px dotted white;
  display: inline-block;
}
</style>
