import {
    Avatar,
    Box,
    Button,
    CircularProgress,
    Container,
    LinearProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AxiosInstance from '../components/AxiosInstance';

const MyAwards = () => {
  const [awards, setAwards] = useState([]);
  const [userAwards, setUserAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const awardsResponse = await AxiosInstance.get('/awards/');
        setAwards(awardsResponse.data);

        const userAwardsResponse = await AxiosInstance.get('/user-awards/');
        setUserAwards(userAwardsResponse.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const combinedData = awards.map((award) => {
    const userAward = userAwards.find((ua) => ua.award === award.id);
    return {
      ...award,
      progress: userAward ? userAward.progress : 0,
      start_date: userAward ? userAward.start_date : null,
      end_date: userAward ? userAward.end_date : null,
    };
  });

  const filteredData = combinedData.filter((award) => award.progress > 0);

  const handleDetailsClick = (award) => {
    navigate(`/app/awards/awardDetail/${award.id}`, { state: { award } });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="h6" color="error" align="center" sx={{ mt: 5 }}>
        Error: {error}
      </Typography>
    );
  }

  return (
    <Container maxWidth="lg">
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" align="center" gutterBottom sx={{ my: 4, fontWeight: 'bold', color: '#fff', textShadow: '0 0 10px rgba(77, 171, 245, 0.5)' }}>
          MY WORLD TOURS
        </Typography>

        <Paper sx={{ width: '100%', mb: 4, overflow: 'hidden', p: 0, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Table>
                <TableHead>
                <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tour</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Completion Date</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', width: '30%' }}>Progress</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Action</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {filteredData.map((award) => (
                    <TableRow key={award.id} hover>
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            src={award.link_image}
                            alt={award.name}
                            variant="rounded"
                            sx={{ mr: 2, width: 48, height: 48 }}
                        />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{award.name}</Typography>
                        </Box>
                    </TableCell>
                    <TableCell>
                        {award.start_date ? new Date(award.start_date).toLocaleDateString() : 'Not started'}
                    </TableCell>
                    <TableCell>
                        {award.end_date ? new Date(award.end_date).toLocaleDateString() : 'In progress'}
                    </TableCell>
                    <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={award.progress} sx={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)' }} color={award.progress === 100 ? 'success' : 'primary'} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">{`${Math.round(award.progress)}%`}</Typography>
                        </Box>
                        </Box>
                    </TableCell>
                    <TableCell align="right">
                        <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleDetailsClick(award)}
                        sx={{ borderColor: '#4dabf5', color: '#4dabf5', '&:hover': { borderColor: '#fff', color: '#fff' } }}
                        >
                        Details
                        </Button>
                    </TableCell>
                    </TableRow>
                ))}
                {filteredData.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                You haven't started any World Tours yet.
                            </Typography>
                            <Button variant="text" onClick={() => navigate('/app/awards')} sx={{ mt: 1 }}>Browse Tours</Button>
                        </TableCell>
                     </TableRow>
                )}
                </TableBody>
            </Table>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default MyAwards;