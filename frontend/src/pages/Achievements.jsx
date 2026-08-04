import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Tooltip } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LockIcon from '@mui/icons-material/Lock';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AxiosInstance from '../components/AxiosInstance';

const Achievements = () => {
    const [achievements, setAchievements] = useState([]);
    const [userAchievements, setUserAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [achRes, userAchRes] = await Promise.all([
                    AxiosInstance.get('/achievements/'),
                    AxiosInstance.get('/achievements/user_achievements/')
                ]);
                
                setAchievements(achRes.data);
                setUserAchievements(userAchRes.data.map(ua => ua.achievement.id));
            } catch (error) {
                console.error("Error fetching achievements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress sx={{ color: '#4dabf5' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEventsIcon sx={{ fontSize: 40, color: '#FFD700' }} />
                My Achievements
            </Typography>

            <Grid container spacing={3}>
                {achievements.map((ach) => {
                    const isUnlocked = userAchievements.includes(ach.id);

                    return (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={ach.id}>
                            <Card sx={{ 
                                height: '100%', 
                                backgroundColor: isUnlocked ? 'rgba(10, 25, 41, 0.9)' : 'rgba(10, 25, 41, 0.4)',
                                border: isUnlocked ? '1px solid #FFD700' : '1px solid rgba(255,255,255,0.1)',
                                opacity: isUnlocked ? 1 : 0.6,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-5px)',
                                    boxShadow: isUnlocked ? '0 8px 20px rgba(255,215,0,0.2)' : 'none'
                                }
                            }}>
                                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                    {isUnlocked ? (
                                        <EmojiEventsIcon sx={{ fontSize: 60, color: '#FFD700', mb: 2, filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.5))' }} />
                                    ) : (
                                        <LockIcon sx={{ fontSize: 60, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                                    )}
                                    
                                    <Typography variant="h6" sx={{ color: isUnlocked ? '#FFD700' : 'rgba(255,255,255,0.5)', fontWeight: 'bold', mb: 1 }}>
                                        {ach.name}
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, minHeight: '40px' }}>
                                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                            {isUnlocked ? ach.description : '???'}
                                        </Typography>
                                        {!isUnlocked && (
                                            <Tooltip title={ach.description} arrow placement="top">
                                                <InfoOutlinedIcon sx={{ ml: 1, fontSize: 16, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#FFD700' } }} />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    
                                    {!isUnlocked && (
                                        <Box sx={{ width: '100%', mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Progress</Typography>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                                    {Math.floor(((ach.current_progress || 0) / ach.target_value) * 100)}% ({ach.current_progress || 0} / {ach.target_value})
                                                </Typography>
                                            </Box>
                                            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                <div style={{ 
                                                    width: `${Math.min(100, ((ach.current_progress || 0) / ach.target_value) * 100)}%`, 
                                                    height: '100%', 
                                                    backgroundColor: '#FFD700',
                                                    transition: 'width 0.5s ease-in-out'
                                                }} />
                                            </div>
                                        </Box>
                                    )}
                                    
                                    <Box sx={{
                                        display: 'inline-block',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '10px',
                                        backgroundColor: isUnlocked ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                                        color: isUnlocked ? '#FFD700' : 'rgba(255,255,255,0.3)',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold'
                                    }}>
                                        +{ach.xp_reward} XP
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};

export default Achievements;
