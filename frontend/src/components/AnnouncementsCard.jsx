import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import AxiosInstance from './AxiosInstance';

const AnnouncementsCard = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await AxiosInstance.get('/announcements/');
        // Assume API returns a list or an object with 'results' depending on pagination
        const data = response.data.results || response.data;
        setAnnouncements(data);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CampaignIcon sx={{ color: "#f50057", mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            System Updates
          </Typography>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, py: 4 }}>
            <CircularProgress size={30} sx={{ color: '#f50057' }} />
          </Box>
        ) : announcements.length === 0 ? (
           <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 4 }}>No new updates.</Typography>
        ) : (
          <Box sx={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              maxHeight: 350,
              pr: 1,
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: '#3b4252', borderRadius: '4px' }
          }}>
            {announcements.map((announcement) => (
              <Box 
                key={announcement.id}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderLeft: '3px solid #f50057',
                }}
              >
                <Typography sx={{ fontSize: '0.7rem', color: '#929ba8', mb: 0.5 }}>
                  {new Date(announcement.date_posted).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 'bold', mb: 0.5, color: '#fff' }}>
                  {announcement.title}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-line' }}>
                  {announcement.content}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementsCard;
