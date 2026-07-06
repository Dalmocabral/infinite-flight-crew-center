import React from 'react';
import { Card, CardContent, Typography, Box, Chip, CircularProgress, Link } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import { useEvents } from '../hooks/useEvents';

const formatEventDate = (startStr, endStr) => {
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : null;
    
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const startDay = String(start.getUTCDate()).padStart(2, '0');
    const startMonth = months[start.getUTCMonth()];
    
    const startHour = String(start.getUTCHours()).padStart(2, '0');
    const startMin = String(start.getUTCMinutes()).padStart(2, '0');
    
    if (!endStr) return `${startDay}${startMonth} • All day`;
    
    const endDay = String(end.getUTCDate()).padStart(2, '0');
    const endMonth = months[end.getUTCMonth()];
    const endHour = String(end.getUTCHours()).padStart(2, '0');
    const endMin = String(end.getUTCMinutes()).padStart(2, '0');
    
    if (startDay === endDay && startMonth === endMonth) {
       return `${startDay}${startMonth} ${startHour}:${startMin}-${endHour}:${endMin}Z`;
    }
    
    return `${startDay}${startMonth} ${startHour}:${startMin}Z - ${endDay}${endMonth} ${endHour}:${endMin}Z`;
};

const EventsCard = () => {
  const { events, isLoading } = useEvents();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EventIcon sx={{ color: "#4dabf5", mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Community Events
          </Typography>
          {!isLoading && (
            <Chip 
              label={events.length} 
              size="small" 
              sx={{ ml: 2, bgcolor: 'rgba(255,255,255,0.1)', color: '#aaa', fontWeight: 'bold' }} 
            />
          )}
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, py: 4 }}>
            <CircularProgress size={30} sx={{ color: '#4dabf5' }} />
          </Box>
        ) : events.length === 0 ? (
           <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 4 }}>No upcoming events found.</Typography>
        ) : (
          <Box sx={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              maxHeight: 350,
              pr: 1,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: '#3b4252', borderRadius: '4px' }
          }}>
            {events.map((event) => (
              <Box 
                key={event.id}
                onClick={() => window.open(event.url, '_blank')}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#929ba8', fontFamily: 'monospace' }}>
                    {formatEventDate(event.startsAt, event.endsAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {event.tags.some(t => t.includes('expert')) && (
                      <Chip label="EXPERT" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 'bold', bgcolor: '#1a4d33', color: '#4ade80', border: '1px solid #236544' }} />
                    )}
                    {event.tags.some(t => t.includes('training')) && (
                      <Chip label="TRAINING" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 'bold', bgcolor: '#4d3f1a', color: '#eab308', border: '1px solid #655223' }} />
                    )}
                    {event.tags.some(t => t.includes('casual')) && (
                      <Chip label="CASUAL" size="small" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 'bold', bgcolor: '#2a1645', color: '#a855f7', border: '1px solid #3d1b6e' }} />
                    )}
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#e5e9f0', lineHeight: 1.3 }}>
                  {event.title}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsCard;
