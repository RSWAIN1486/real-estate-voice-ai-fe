import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_VOICE_ID } from '../../services/voiceAgentService';

export interface VoiceAgentSettings {
  voiceModel: string;
  voice: string;
  temperature: number;
  enableCallRecording: boolean;
  customSystemPrompt: string;
}

// Try to load settings from localStorage
let savedSettings: VoiceAgentSettings | null = null;
try {
  const savedJson = localStorage.getItem('voiceAgentSettings');
  if (savedJson) {
    savedSettings = JSON.parse(savedJson);
    // Only set Emily-English if no voice is set at all
    if (!savedSettings.voice || savedSettings.voice === '') {
      savedSettings.voice = 'Emily-English';
    }
    console.log('Loaded settings from localStorage:', savedSettings);
  }
} catch (e) {
  console.error('Error loading settings from localStorage:', e);
}

// Set initial state from saved settings or defaults
const initialState: VoiceAgentSettings = savedSettings || {
  voiceModel: 'fixie-ai/ultravox-70B',
  voice: 'Emily-English', // Set explicitly to Emily-English instead of using DEFAULT_VOICE_ID
  temperature: 0.7,
  enableCallRecording: false,
  customSystemPrompt: '',
};

// Save the initial state to localStorage if we don't already have saved settings
if (!savedSettings) {
  try {
    localStorage.setItem('voiceAgentSettings', JSON.stringify(initialState));
    console.log('Saved initial settings to localStorage:', initialState);
  } catch (e) {
    console.error('Error saving settings to localStorage:', e);
  }
}

const voiceAgentSettingsSlice = createSlice({
  name: 'voiceAgentSettings',
  initialState,
  reducers: {
    setVoiceModel: (state, action: PayloadAction<string>) => {
      state.voiceModel = action.payload;
      try {
        localStorage.setItem('voiceAgentSettings', JSON.stringify(state));
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
    },
    setVoice: (state, action: PayloadAction<string>) => {
      state.voice = action.payload;
      try {
        localStorage.setItem('voiceAgentSettings', JSON.stringify(state));
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
    },
    setTemperature: (state, action: PayloadAction<number>) => {
      state.temperature = action.payload;
      try {
        localStorage.setItem('voiceAgentSettings', JSON.stringify(state));
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
    },
    setEnableCallRecording: (state, action: PayloadAction<boolean>) => {
      state.enableCallRecording = action.payload;
      try {
        localStorage.setItem('voiceAgentSettings', JSON.stringify(state));
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
    },
    setCustomSystemPrompt: (state, action: PayloadAction<string>) => {
      state.customSystemPrompt = action.payload;
      try {
        localStorage.setItem('voiceAgentSettings', JSON.stringify(state));
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
    },
    resetSettings: (state) => {
      const newState = {
        voiceModel: 'fixie-ai/ultravox-70B',
        voice: 'Emily-English',
        temperature: 0.7,
        enableCallRecording: false,
        customSystemPrompt: '',
      };
      try {
        localStorage.setItem('voiceAgentSettings', JSON.stringify(newState));
      } catch (e) {
        console.error('Error saving settings to localStorage:', e);
      }
      return newState;
    }
  }
});

export const {
  setVoiceModel,
  setVoice,
  setTemperature,
  setEnableCallRecording,
  setCustomSystemPrompt,
  resetSettings
} = voiceAgentSettingsSlice.actions;

export default voiceAgentSettingsSlice.reducer; 