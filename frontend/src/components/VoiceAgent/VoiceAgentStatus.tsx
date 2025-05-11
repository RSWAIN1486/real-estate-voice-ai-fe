import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { FRONTEND_ONLY_MODE, ULTRAVOX_BASE_URL } from '../../utils/CONSTANTS';

const VoiceAgentStatus: React.FC = () => {
  return (
    <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Voice Agent Status
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Mode:</Typography>
          <Chip 
            label={FRONTEND_ONLY_MODE ? 'Frontend Only' : 'Backend Proxy'} 
            color={FRONTEND_ONLY_MODE ? 'success' : 'primary'} 
            size="small" 
          />
        </Box>
        
        {FRONTEND_ONLY_MODE && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">API URL:</Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {ULTRAVOX_BASE_URL}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">Agent ID:</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {import.meta.env.VITE_ULTRAVOX_AGENT_ID || 'Not configured'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default VoiceAgentStatus; 