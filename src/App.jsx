import React, { useState } from 'react';
import axios from 'axios';
import { Spinner } from 'react-bootstrap';
import './App.scss';

const App = () => {
  const [text, setText] = useState('');
  const [playLoading, setPlayLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);

  const onFetchAudio = async () => {
    if (text) {
      setPlayLoading(true);
      await axios
        .post(
          `${process.env.REACT_APP_IBM_BASE_URL}/v1/synthesize`,
          {
            text
          },
          {
            auth: {
              username: 'apikey',
              password: process.env.REACT_APP_IBM_API_KEY
            },
            responseType: 'blob',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'audio/wav'
            }
          }
        )
        .then((response) => {
          setAudioPlaying(true);
          const audioUrl = URL.createObjectURL(response.data);
          setAudioSrc(audioUrl);
        })
        .catch((err) => console.error(err))
        .finally(() => setPlayLoading(false));
    }
  };

  const onStopAudio = () => {
    const audio = document.getElementById('audio');
    audio.pause();
    audio.currentTime = 0;
    setAudioPlaying(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <form className="w-75">
          <div className="text-left">
            <label htmlFor="text">Enter text:</label>
            <textarea
              className="form-control"
              id="text"
              rows="4"
              maxLength="50"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="text-right">
            <button
              type="button"
              className="btn btn-light mt-3"
              onClick={audioPlaying ? onStopAudio : onFetchAudio}
            >
              {playLoading && <Spinner size="sm" animation="border" />}
              {!playLoading && (
                <i className={`fa fa-${audioPlaying ? 'stop' : 'play'}`}></i>
              )}
            </button>
          </div>
        </form>
        <audio
          id="audio"
          autoPlay
          onEnded={() => setAudioPlaying(false)}
          src={audioSrc}
          type="audio/wav"
        >
          Your browser does not support the audio element.
        </audio>
      </header>
    </div>
  );
};

export default App;
