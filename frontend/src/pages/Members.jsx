import {
    Box,
    Card, CardContent,
    CircularProgress,
    Container,
    Divider,
    Grid,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';
import Gravatar from '../components/Gravatar';

const Members = () => {
  const [myData, setMyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const GetData = () => {
    AxiosInstance.get('users/')
      .then((res) => {
        setMyData(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Erro ao buscar os dados:', error);
        setLoading(false);
      });
  };

  useEffect(() => {
    GetData();
  }, []);

  return (
    <Container maxWidth="lg">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: "center", my: 5 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: '#fff', textShadow: '0 0 20px rgba(77, 171, 245, 0.4)' }}>
                PILOT ROSTER
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Meet our dedicated crew members flying across the globe.
            </Typography>
        </Box>

        {loading ? (
            <Box display="flex" justifyContent="center">
            <CircularProgress />
            </Box>
        ) : (
            <Grid container spacing={4}>
            {myData.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                 <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                <Link 
                    to={`/app/userdetail/${item.id}`} 
                    style={{ textDecoration: 'none' }} 
                >
                    <Card 
                    sx={{ 
                        width: '100%',
                        textAlign: 'center', 
                        borderRadius: '16px', 
                        p: 2, 
                        height: '100%', 
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(10, 25, 41, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out, border 0.3s',
                        '&:hover': {
                            transform: 'translateY(-10px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                            border: '1px solid rgba(77, 171, 245, 0.5)'
                        }
                    }}
                    >
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mt: 2,
                        mb: 2
                    }}>
                        <Box sx={{ 
                            p: 0.5, 
                            borderRadius: '50%', 
                            border: '2px solid #4dabf5', 
                            boxShadow: '0 0 15px rgba(77, 171, 245, 0.5)' 
                        }}>
                             <Gravatar
                                email={item.email} 
                                size={80} 
                                alt={`Imagem de perfil de ${item.first_name} ${item.last_name}`} 
                                style={{ borderRadius: '50%' }} 
                                />
                        </Box>
                    </Box>
                    <CardContent sx={{ p: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '1.2rem', fontWeight: 'bold', mb: 1, color: '#fff' }}>
                        {item.first_name} {item.last_name}
                        </Typography>
                        <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                         <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                             <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Base:</Typography>
                            <img
                                src={`https://flagcdn.com/w320/${item.country ? item.country.toLowerCase() : ''}.png`}
                                alt={item.country || 'Country'}
                                style={{ width: '24px', borderRadius: '4px' }}
                            />
                        </Box>
                    </CardContent>
                    </Card>
                </Link>
                </motion.div>
                </Grid>
            ))}
            </Grid>
        )}
      </motion.div>
    </Container>
  );
};

export default Members;