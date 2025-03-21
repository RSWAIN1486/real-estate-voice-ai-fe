import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Medium } from 'ultravox-client';

// Different statuses for the voice agent
export enum VoiceAgentStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ACTIVE = 'active',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  COMPLETED = 'completed',
  ENDING = 'ending'
}

// Transcript interface
export interface Transcript {
  text: string;
  isFinal: boolean;
  speaker: string;
  medium: Medium;
}

// Voice agent state interface
export interface VoiceAgentState {
  isActive: boolean; // Add isActive property
  status: VoiceAgentStatus;
  callId?: string;
  joinUrl?: string;
  error: string | null;
  transcripts: Transcript[];
}

const initialState: VoiceAgentState = {
  isActive: false,
  status: VoiceAgentStatus.IDLE,
  transcripts: [],
  error: null
};

const voiceAgentSlice = createSlice({
  name: 'voiceAgent',
  initialState,
  reducers: {
    setActive: (state, action: PayloadAction<boolean>) => {
      state.isActive = action.payload;
    },
    setCallInfo: (state, action: PayloadAction<{ callId: string; joinUrl: string }>) => {
      state.callId = action.payload.callId;
      state.joinUrl = action.payload.joinUrl;
    },
    setStatus: (state, action: PayloadAction<VoiceAgentStatus>) => {
      state.status = action.payload;
    },
    addTranscript: (state, action: PayloadAction<{
      text: string;
      isFinal: boolean;
      speaker: 'user' | 'agent';
      medium: Medium;
    }>) => {
      const newTranscript = action.payload;
      
      // Check if this is a duplicate by comparing text and speaker
      const isDuplicate = state.transcripts.some(
        t => t.text === newTranscript.text && t.speaker === newTranscript.speaker
      );
      
      // Only add if it's not a duplicate
      if (!isDuplicate) {
        state.transcripts.push(newTranscript);
      }
    },
    clearTranscripts: (state) => {
      state.transcripts = [];
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetAgent: (state) => {
      return initialState;
    }
  },
});

export const { 
  setActive, 
  setCallInfo, 
  setStatus, 
  addTranscript, 
  clearTranscripts, 
  setError,
  resetAgent 
} = voiceAgentSlice.actions;
export default voiceAgentSlice.reducer; 