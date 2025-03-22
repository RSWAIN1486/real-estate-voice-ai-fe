import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Slider,
  TextField,
  Button,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material';
import {
  Save as SaveIcon,
} from '@mui/icons-material';
import { RootState } from '../../store/store';
import {
  setVoiceModel,
  setVoice,
  setTemperature,
  setEnableCallRecording,
  setCustomSystemPrompt,
} from '../../store/slices/voiceAgentSettingsSlice';
import voiceAgentService, { SYSTEM_PROMPT, DEFAULT_VOICE_OPTIONS, VoiceOption, fetchAvailableVoices, DEFAULT_VOICE_ID } from '../../services/voiceAgentService';

const voiceModels = [
  { value: 'fixie-ai/ultravox-70B', label: 'Ultravox 70B' },
  { value: 'fixie-ai/ultravox-13B', label: 'Ultravox 13B' },
];

interface VoiceAgentSettingsProps {
  open: boolean;
  onClose: () => void;
}

const VoiceAgentSettings: React.FC<VoiceAgentSettingsProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.voiceAgentSettings) || {
    voiceModel: 'fixie-ai/ultravox-70B',
    voice: DEFAULT_VOICE_ID, // Use the constant from voiceAgentService
    temperature: 0.7,
    enableCallRecording: false,
    customSystemPrompt: '',
  };
  
  // Use a ref to track if the prompt has been initialized
  const hasInitializedPrompt = useRef(false);
  
  // State for available voices
  const [voices, setVoices] = useState<VoiceOption[]>(DEFAULT_VOICE_OPTIONS);
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Fetch available voices when the component mounts
  useEffect(() => {
    const getVoices = async () => {
      setLoadingVoices(true);
      try {
        console.log('Current voice setting before fetch:', settings.voice);
        const fetchedVoices = await fetchAvailableVoices();
        setVoices(fetchedVoices);
        
        // Only set Emily-English if no voice is currently set
        if (!settings.voice || settings.voice === '') {
          const emilyVoice = fetchedVoices.find(v => 
            v.value === 'Emily-English' || v.label === 'Emily-English'
          );
          
          if (emilyVoice) {
            console.log('No voice set, using Emily-English as default:', emilyVoice);
            dispatch(setVoice(emilyVoice.value));
          } else if (fetchedVoices.length > 0) {
            console.log('Emily-English not found, using first available voice:', fetchedVoices[0]);
            dispatch(setVoice(fetchedVoices[0].value));
          }
        }
      } catch (error) {
        console.error('Failed to fetch voices:', error);
        
        // Only set a default if no voice is currently selected
        if (!settings.voice || settings.voice === '') {
          const defaultEmily = DEFAULT_VOICE_OPTIONS.find(v => 
            v.value === 'Emily-English' || v.label === 'Emily-English'
          );
          
          if (defaultEmily) {
            console.log('Using default Emily-English voice as fallback');
            dispatch(setVoice(defaultEmily.value));
          }
        }
      } finally {
        setLoadingVoices(false);
      }
    };
    
    if (open) {
      getVoices();
    }
  }, [open, dispatch, settings.voice]);

  // Prepopulate the custom system prompt only once when the component first mounts
  useEffect(() => {
    if (open && !hasInitializedPrompt.current) {
      hasInitializedPrompt.current = true;
      if (!settings.customSystemPrompt) {
        dispatch(setCustomSystemPrompt(SYSTEM_PROMPT));
      }
    }
  }, [open, dispatch, settings.customSystemPrompt]);

  const handleTemperatureChange = (_event: Event, newValue: number | number[]) => {
    dispatch(setTemperature(newValue as number));
  };

  const handleSave = () => {
    // Save settings without forcing any specific voice
    onClose();
  };

  const resetSystemPrompt = () => {
    // This explicitly resets to the real estate prompt
    dispatch(setCustomSystemPrompt(SYSTEM_PROMPT));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Voice Agent Settings</Typography>
          <IconButton onClick={handleSave} color="primary">
            <SaveIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Voice Model Selection */}
          <FormControl fullWidth>
            <Typography variant="subtitle2" gutterBottom>
              Voice Model
            </Typography>
            <Select
              value={settings.voiceModel}
              onChange={(e) => dispatch(setVoiceModel(e.target.value))}
            >
              {voiceModels.map((model) => (
                <MenuItem key={model.value} value={model.value}>
                  {model.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Voice Selection */}
          <FormControl fullWidth>
            <Typography variant="subtitle2" gutterBottom>
              Voice
            </Typography>
            {loadingVoices ? (
              <Box display="flex" alignItems="center" py={1}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body2">Loading available voices...</Typography>
              </Box>
            ) : (
              <>
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
                    Current voice ID: {settings.voice || 'none'}, Available voices: {voices.length}
                  </Typography>
                )}
                <Select
                  value={settings.voice || ''}
                  onChange={(e) => dispatch(setVoice(e.target.value))}
                  disabled={loadingVoices}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <em>Select a voice</em>;
                    }
                    
                    const selectedVoice = voices.find(v => v.value === selected);
                    return selectedVoice ? selectedVoice.label : selected;
                  }}
                >
                  {voices.length === 0 && (
                    <MenuItem disabled value="">
                      <em>No voices available</em>
                    </MenuItem>
                  )}
                  {voices.map((voice) => (
                    <MenuItem key={voice.value} value={voice.value}>
                      {voice.label}
                      {voice.description && (
                        <Typography variant="caption" color="textSecondary" component="span" sx={{ ml: 1 }}>
                          - {voice.description}
                        </Typography>
                      )}
                    </MenuItem>
                  ))}
                </Select>
              </>
            )}
          </FormControl>

          {/* Temperature Slider */}
          <div>
            <Typography variant="subtitle2" gutterBottom>
              Temperature
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Lower values make responses more focused and deterministic, higher values make them more creative and varied.
            </Typography>
            <Slider
              value={settings.temperature}
              onChange={handleTemperatureChange}
              min={0}
              max={1}
              step={0.1}
              marks
              valueLabelDisplay="auto"
            />
          </div>

          {/* Call Recording Switch */}
          <FormControlLabel
            control={
              <Switch
                checked={settings.enableCallRecording}
                onChange={(e) => dispatch(setEnableCallRecording(e.target.checked))}
              />
            }
            label="Enable Call Recording"
          />

          {/* Custom System Prompt */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Custom System Prompt
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={8}
              value={settings.customSystemPrompt}
              onChange={(e) => dispatch(setCustomSystemPrompt(e.target.value))}
              placeholder="Enter a custom system prompt for the voice agent"
            />
            <Box display="flex" justifyContent="flex-end" mt={1}>
              <Button 
                size="small" 
                onClick={resetSystemPrompt}
                color="secondary"
              >
                Reset to Default
              </Button>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VoiceAgentSettings; 