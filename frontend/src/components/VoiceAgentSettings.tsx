import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { voiceAgentService } from '../services/voiceAgentService';
import { voiceAgentSettingsActions } from '../actions/voiceAgentSettingsActions';

const VoiceAgentSettings = () => {
  const dispatch = useDispatch();
  const settings = useSelector(state => state.voiceAgentSettings);
  const open = useSelector(state => state.voiceAgentSettings.open);

  const getVoices = useCallback(async () => {
    try {
      console.log('⭐ Fetching available voices...');
      console.log('Current voice setting before fetch:', settings.voice);
      
      // Always set voice to Emily-English if the component is opened
      if (open) {
        console.log('Component is open, will attempt to set Emily-English');
        const voices = await voiceAgentService.fetchAvailableVoices();
        console.log('Fetched voices:', voices);
        
        if (voices.length > 0) {
          // Look for Emily-English
          const emilyVoice = voices.find(voice => voice.value === 'Emily-English');
          
          if (emilyVoice) {
            console.log('Found Emily-English voice, setting as default');
            dispatch(voiceAgentSettingsActions.setVoice('Emily-English'));
          } else {
            // If Emily-English isn't available, use the first one
            console.log('Emily-English not found, using first available voice:', voices[0].value);
            dispatch(voiceAgentSettingsActions.setVoice(voices[0].value));
          }
        }
        setAvailableVoices(voices);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      // In case of error, ensure we have a valid voice set
      if (!settings.voice || settings.voice === '') {
        console.log('Error fetching voices, manually setting Emily-English as fallback');
        dispatch(voiceAgentSettingsActions.setVoice('Emily-English'));
      }
    }
  }, [dispatch, open]);

  useEffect(() => {
    if (open) {
      getVoices();
      
      // Initialize custom system prompt if empty
      if (!settings.customSystemPrompt) {
        dispatch(voiceAgentSettingsActions.setCustomSystemPrompt(DEFAULT_CUSTOM_SYSTEM_PROMPT));
      }
    }
  }, [open, getVoices, dispatch, settings.customSystemPrompt]);

  return (
    // Rest of the component code...
  );
};

export default VoiceAgentSettings; 