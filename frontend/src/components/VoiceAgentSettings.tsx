import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, FormControl, Select, MenuItem, TextField, Button, Stack } from '@mui/material';
import * as voiceAgentService from '../services/voiceAgentService';
import { RootState } from '../store/store';
import { setVoice, setCustomSystemPrompt } from '../store/slices/voiceAgentSettingsSlice';
import { SYSTEM_PROMPT, VoiceOption } from '../services/voiceAgentService';

interface VoiceAgentSettingsProps {
  open: boolean;
}

const VoiceAgentSettings: React.FC<VoiceAgentSettingsProps> = ({ open }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.voiceAgentSettings);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);

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
            dispatch(setVoice('Emily-English'));
          } else {
            // If Emily-English isn't available, use the first one
            console.log('Emily-English not found, using first available voice:', voices[0].value);
            dispatch(setVoice(voices[0].value));
          }
        }
        setAvailableVoices(voices);
      }
    } catch (error) {
      console.error('Error fetching voices:', error);
      // In case of error, ensure we have a valid voice set
      if (!settings.voice || settings.voice === '') {
        console.log('Error fetching voices, manually setting Emily-English as fallback');
        dispatch(setVoice('Emily-English'));
      }
    }
  }, [dispatch, open, settings.voice]);

  useEffect(() => {
    if (open) {
      getVoices();
      
      // Initialize custom system prompt if empty
      if (!settings.customSystemPrompt) {
        dispatch(setCustomSystemPrompt(SYSTEM_PROMPT));
      }
    }
  }, [open, getVoices, dispatch, settings.customSystemPrompt]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Voice Selection
          </Typography>
          <FormControl fullWidth>
            <Select
              value={settings.voice || ''}
              onChange={(e) => dispatch(setVoice(e.target.value))}
            >
              {availableVoices.map((voice) => (
                <MenuItem key={voice.value} value={voice.value}>
                  {voice.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Custom System Prompt
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={8}
            value={settings.customSystemPrompt || ''}
            onChange={(e) => dispatch(setCustomSystemPrompt(e.target.value))}
            placeholder="Enter a custom system prompt for the voice agent"
          />
          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Button 
              size="small" 
              onClick={() => dispatch(setCustomSystemPrompt(SYSTEM_PROMPT))}
              color="secondary"
            >
              Reset to Default
            </Button>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default VoiceAgentSettings; 