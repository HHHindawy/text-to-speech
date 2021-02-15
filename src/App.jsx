import React, { useRef, useState } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Spinner } from 'react-bootstrap';
import logo from './styles/assets/logo.svg';
import './App.scss';

const App = () => {
  // Assume a maximum number of items to be stored in localStorage not to fload it.
  const MAX_NUM_OF_ITEMS = 15;

  const [text, setText] = useState('');
  const [playLoading, setPlayLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState(null);

  const audioRef = useRef(null);

  const cleanText = () => {
    // Remove punctuation.
    let efficientText = text.replace(/[.,'"?/#!$%^&*;:{}=\-_`~()]/g, '');
    // Replace multiple spaces/tabs/newlines with a single space.
    efficientText = efficientText.replace(/\s\s+/g, ' ');
    // Ignore case and trim spaces.
    return efficientText.trim().toLowerCase();
  };

  const onPlayAudio = () => {
    if (text) {
      setPlayLoading(true);
      try {
        const audioKey = cleanText();
        const savedAudio = localStorage.getItem(audioKey);
        if (savedAudio) {
          // Play audio saved in localStorage.
          playSaved(audioKey, savedAudio);
        } else {
          // Request a new audio.
          fetchAudio(audioKey);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const fetchAudio = async (audioKey) => {
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
            Accept: 'audio/ogg'
          }
        }
      )
      .then((response) => {
        setAudioPlaying(true);
        const audioReader = new FileReader();
        audioReader.readAsDataURL(response.data);
        audioReader.onload = () => {
          // Store in localStorage or replace the least recently used audio if limit reached.
          if (localStorage.length >= MAX_NUM_OF_ITEMS) {
            localStorage.removeItem(getLeastRecentlyUsedKey());
          }

          localStorage.setItem(
            audioKey,
            JSON.stringify({
              audio: audioReader.result,
              lastUsed: moment().format('x'),
              text
            })
          );
          setAudioSrc(audioReader.result);
        };
        audioReader.onerror = (error) => console.error(error);
      })
      .catch((err) => console.error(err))
      .finally(() => setPlayLoading(false));
  };

  const getLeastRecentlyUsedKey = () => {
    return Object.keys(localStorage).reduce((key1, key2) =>
      JSON.parse(localStorage.getItem(key2)).lastUsed <
      JSON.parse(localStorage.getItem(key1)).lastUsed
        ? key2
        : key1
    );
  };

  const onStopAudio = () => {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setAudioPlaying(false);
    setAudioSrc(null);
  };

  const playSaved = async (audioKey, audioObject, replaceText = false) => {
    setAudioPlaying(true);
    const parsedAudioObject = JSON.parse(audioObject);
    // Replace text if playing text from history.
    if (replaceText) setText(parsedAudioObject.text);

    const encodedAudioURL = parsedAudioObject.audio;
    setAudioSrc(encodedAudioURL);

    // Update last used time for audio in localStorage.
    localStorage.setItem(
      audioKey,
      JSON.stringify({
        ...parsedAudioObject,
        lastUsed: moment().format('x')
      })
    );
    setPlayLoading(false);
  };

  const renderHistory = () => {
    const items = [];
    for (let key in localStorage) {
      if (!localStorage.getItem(key)) {
        continue;
      }
      items.push({ key, value: localStorage.getItem(key) });
    }

    return items.map((item) => (
      <button
        key={item.key}
        type="button"
        disabled={playLoading || audioPlaying}
        className="list-group-item list-group-item-action btn-sm history-list-item"
        onClick={() => playSaved(item.key, item.value, true)}
      >
        {JSON.parse(item.value).text}
      </button>
    ));
  };

  return (
    <div className="app">
      <div className="header">
        Text To Speech
        <img src={logo} alt="logo" className="header-logo" />
      </div>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-12 col-lg-3 history mb-5">
            <div className="history-title mb-2">History</div>
            <div className="list-group history-list">{renderHistory()}</div>
          </div>

          <div className="col-md-12 col-lg-9">
            <form className="form">
              <div className="text-left">
                <label htmlFor="text" className="form-title">
                  Enter text:
                </label>
                <textarea
                  className="form-control"
                  id="text"
                  disabled={playLoading || audioPlaying}
                  rows="10"
                  maxLength="50"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  disabled={!text}
                  className="btn btn-light mt-3"
                  onClick={audioPlaying ? onStopAudio : onPlayAudio}
                >
                  {playLoading && <Spinner size="sm" animation="border" />}
                  {!playLoading && (
                    <i
                      className={`fa fa-${audioPlaying ? 'stop' : 'play'}`}
                    ></i>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        autoPlay
        onEnded={onStopAudio}
        src={audioSrc}
        type="audio/ogg"
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

export default App;
