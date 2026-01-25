import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Card, CardContent, CardMedia, Chip, Container, Grid, InputAdornment, TextField, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';

const Awards = () => {
  const [awards, setAwards] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const navigate = useNavigate();

  const fetchAwards = async () => {
    try {
      const response = await AxiosInstance.get('/awards/');
      setAwards(response.data);
    } catch (error) {
      console.error('Erro ao buscar prêmios:', error);
    }
  };

  React.useEffect(() => {
    fetchAwards();
  }, []);

  const handleDetailsClick = (award) => {
    navigate(`/app/awards/awardDetail/${award.id}`, { state: { award } });
  };

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: "center", my: 5 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#fff', textShadow: '0 0 20px rgba(77, 171, 245, 0.4)' }}>
                WORLD TOURS
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: '600px', mx: 'auto' }}>
                Explore our curated collection of World Tours. Complete legs, earn badges, and prove your piloting skills around the globe.
            </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
            <TextField
                placeholder="Search tours..."
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'rgba(255,255,255,0.7)' }} />
                        </InputAdornment>
                    ),
                    sx: { color: 'white' }
                }}
                sx={{ 
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                }}
            />
        </Box>

      <Grid container spacing={4} justifyContent="center">
        {awards
          .filter((award) =>
            award.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((award, index) => (
            <Grid item key={award.id} xs={12} sm={6} md={4}>
                 <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                <Card 
                    sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        backgroundColor: 'rgba(10, 25, 41, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                        '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(77, 171, 245, 0.5)'
                        }
                    }}
                >
                <CardMedia
                    component="img"
                    height="180"
                    image={award.link_image}
                    alt={award.name}
                    sx={{ objectFit: 'cover' }}
                    />
                    <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                    <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#fff', mb: 2 }}>
                        {award.name}
                    </Typography>
                    
                    <Chip 
                        label={`${award.total_legs} Legs`} 
                        sx={{ 
                            backgroundColor: 'rgba(33, 150, 243, 0.2)', 
                            color: '#4dabf5', 
                            fontWeight: 'bold', 
                            border: '1px solid rgba(33, 150, 243, 0.3)',
                            mb: 3
                        }} 
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={() => handleDetailsClick(award)}
                        sx={{ 
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            fontWeight: 'bold',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        }}
                    >
                        VIEW DETAILS
                    </Button>
                    </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
      </Grid>
      </motion.div>
    </Container>
  );
};

export default Awards;