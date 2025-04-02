import React from 'react';
import { Box, Typography, Paper, Avatar } from '@mui/material';
import { Medium } from 'ultravox-client';
import { Transcript } from '../../store/slices/voiceAgentSlice';

interface VoiceAgentTranscriptProps {
  transcripts: Transcript[];
}

const VoiceAgentTranscript: React.FC<VoiceAgentTranscriptProps> = ({ transcripts }) => {
  return (
    <Box sx={{ p: 2 }}>
      {transcripts.map((transcript, index) => (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: transcript.speaker === 'agent' ? 'row' : 'row-reverse',
            mb: 2,
          }}
        >
          <Avatar
            sx={{
              bgcolor: transcript.speaker === 'agent' ? 'primary.main' : 'secondary.main',
              mr: transcript.speaker === 'agent' ? 1 : 0,
              ml: transcript.speaker === 'agent' ? 0 : 1,
              width: 40,
              height: 40,
            }}
          >
            {transcript.speaker === 'agent' ? 'A' : 'U'}
          </Avatar>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              maxWidth: '80%',
              borderRadius: 2,
              backgroundColor: transcript.speaker === 'agent' ? '#e3f2fd' : '#f5f5f5',
              borderTopLeftRadius: transcript.speaker === 'agent' ? 0 : 16,
              borderTopRightRadius: transcript.speaker === 'agent' ? 16 : 0,
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {transcript.text}
            </Typography>
            {transcript.medium === Medium.VOICE && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                via {transcript.medium}
              </Typography>
            )}
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export default VoiceAgentTranscript; 