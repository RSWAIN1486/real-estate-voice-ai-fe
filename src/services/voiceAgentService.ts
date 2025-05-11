import { UltravoxSession, Medium } from 'ultravox-client';
import { FRONTEND_ONLY_MODE } from '../utils/CONSTANTS';
import { hangUpTool } from './clientTools';
import { store } from '../store/store';

// Add these environment variables at the top of the file
const ULTRAVOX_API_KEY = import.meta.env.VITE_ULTRAVOX_API_KEY;
const ULTRAVOX_AGENT_ID = import.meta.env.VITE_ULTRAVOX_AGENT_ID;

// ... rest of the file 