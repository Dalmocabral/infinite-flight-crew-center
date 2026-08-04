import React, { useState, useEffect } from 'react';
import { Box, Typography, Modal, Backdrop, Fade, Button } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Confetti from 'react-confetti';
import AxiosInstance from './AxiosInstance';

const AchievementPopup = () => {
    const [queue, setQueue] = useState([]);
    const [currentAch, setCurrentAch] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isFlipping, setIsFlipping] = useState(false);
    const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchUnread = async () => {
            if (isOpen) return; // Don't fetch while showing
            try {
                const res = await AxiosInstance.get('/achievements/unread/');
                if (res.data && res.data.length > 0) {
                    setQueue(res.data);
                }
            } catch (error) {
                console.error("Error fetching unread achievements:", error);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [isOpen]);

    useEffect(() => {
        if (queue.length > 0 && !isOpen) {
            startSequence();
        }
    }, [queue, isOpen]);

    const handleSkip = () => {
        setQueue([]);
        setIsOpen(false);
        setTimeout(() => {
            setCurrentAch(null);
        }, 500);
    };

    const startSequence = async () => {
        setIsOpen(true);
        for (let i = 0; i < queue.length; i++) {
            const popupData = queue[i];
            setCurrentAch(popupData);
            
            AxiosInstance.post('/achievements/mark_read/', { ids: [popupData.id] })
                .catch(err => console.error("Error marking as read", err));
            
            // Wait to show the card
            await new Promise(r => setTimeout(r, 6000));
            
            if (i < queue.length - 1) {
                setIsFlipping(true);
                await new Promise(r => setTimeout(r, 300)); // Half of flip
                // It will swap data on next iteration, then flip back
            }
        }
        
        // Done with all
        if (queue.length > 0) { // Check if we haven't skipped
            setIsOpen(false);
            setTimeout(() => {
                setCurrentAch(null);
                setQueue([]);
            }, 500); // Wait for fade out
        }
    };

    // When currentAch changes but we are flipping, we flip back
    useEffect(() => {
        if (isFlipping && currentAch) {
            setIsFlipping(false);
        }
    }, [currentAch]);

    if (!currentAch) return null;

    const ach = currentAch.achievement;

    return (
        <Modal
            open={isOpen}
            closeAfterTransition
            BackdropComponent={Backdrop}
            BackdropProps={{ timeout: 500, sx: { backgroundColor: 'rgba(0,0,0,0.7)' } }}
        >
            <Fade in={isOpen}>
                <Box>
                    <Confetti
                        width={windowDimensions.width}
                        height={windowDimensions.height}
                        recycle={false}
                        numberOfPieces={500}
                        gravity={0.15}
                        style={{ zIndex: 9999 }}
                        key={currentAch.id} // Re-trigger confetti for each achievement
                    />
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: `translate(-50%, -50%) ${isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)'}`,
                    transition: 'transform 0.3s ease-in-out',
                    width: { xs: '90%', sm: 400 },
                    maxWidth: 400,
                    bgcolor: 'rgba(10, 25, 41, 0.95)',
                    border: '2px solid #FFD700',
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
                    borderRadius: '16px',
                    p: { xs: 3, sm: 4 },
                    textAlign: 'center',
                    color: 'white',
                    outline: 'none'
                }}>
                    <EmojiEventsIcon sx={{ fontSize: { xs: 60, sm: 80 }, color: '#FFD700', mb: 2, filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.8))' }} />
                    <Typography variant="h5" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, fontWeight: 'bold', color: '#FFD700', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                        Achievement Unlocked!
                    </Typography>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' }, fontWeight: 'bold', mb: 1.5 }}>
                        {ach.name}
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                        {ach.description}
                    </Typography>
                    <Box sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        color: '#FFD700',
                        fontWeight: 'bold',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        mb: 3
                    }}>
                        +{ach.xp_reward} XP
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button 
                            variant="outlined" 
                            size="small"
                            onClick={handleSkip}
                            sx={{ 
                                color: 'rgba(255,255,255,0.5)', 
                                borderColor: 'rgba(255,255,255,0.2)',
                                '&:hover': {
                                    borderColor: 'rgba(255,255,255,0.5)',
                                    color: 'white'
                                }
                            }}
                        >
                            Skip Animation
                        </Button>
                    </Box>
                </Box>
                </Box>
            </Fade>
        </Modal>
    );
};

export default AchievementPopup;
