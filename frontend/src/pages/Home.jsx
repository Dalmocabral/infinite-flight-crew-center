import { Flight, Person, Public, Schedule } from "@mui/icons-material"; // Ícones do Material-UI
import {
    AppBar,
    Box,
    Button,
    Container,
    Grid,
    Toolbar,
    Typography
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AxiosInstance from "../components/AxiosInstance"; // Importando AxiosInstance
import FlightStats from "../components/FlightStats"; // Importando o componente

import { motion } from "framer-motion";
import styles from "./Home.module.css";

const Home = () => {
  const [stats, setStats] = useState({ total_flights: 0, total_hours: 0, total_pilots: 0, total_airports: 0 });

  // Plane data storage (not state to avoid re-renders during animation loop)
  const planesRef = useRef([]);
  // Refs to DOM elements
  const planeElementsRef = useRef([]);

  const navigate = useNavigate();

  useEffect(() => {
    // If token exists, redirect to dashboard
    if (localStorage.getItem('token')) {
      navigate('/app/dashboard');
    }

    AxiosInstance.get("/flight-stats/")
      .then((response) => {
        console.log("Flight Stats Data:", response.data);
        setStats(response.data);
      })
      .catch((error) => {
        console.error("Error fetching flight stats:", error);
      });
  }, []);

  // Initialize plane data once
  useEffect(() => {
    const planeCount = 12;
    const radarSize = 450;
    const radarRadius = radarSize / 2;
    const orbits = [radarRadius * 0.2, radarRadius * 0.4, radarRadius * 0.6, radarRadius * 0.8, radarRadius * 1.0];

    // Generate initial plane data
    planesRef.current = Array.from({ length: planeCount }).map((_, i) => ({
      distance: orbits[i % orbits.length],
      angle: Math.random() * Math.PI * 2,
      speed: (0.0003 + Math.random() * 0.0012),
      direction: Math.random() > 0.5 ? 1 : -1,
      isBlue: false
    }));

    // Random blue plane interval
    const intervalId = setInterval(() => {
       const randomIndex = Math.floor(Math.random() * planesRef.current.length);
       planesRef.current.forEach((plane, idx) => {
           plane.isBlue = (idx === randomIndex);
           // Update DOM class directly
           if (planeElementsRef.current[idx]) {
               if (plane.isBlue) planeElementsRef.current[idx].classList.add(styles.blue);
               else planeElementsRef.current[idx].classList.remove(styles.blue);
           }
       });
    }, 4000);

    // Animation Loop
    const sweepDuration = 7000;
    let animationFrameId;
    
    const animate = (time) => {
      const currentSweepAngle = (time / sweepDuration * 360) % 360;
      
      planesRef.current.forEach((plane, i) => {
          if (!planeElementsRef.current[i]) return;

          plane.angle += plane.speed * plane.direction;
          
          const x = Math.cos(plane.angle) * plane.distance;
          const y = Math.sin(plane.angle) * plane.distance;
          
          let planeAngleDeg = (plane.angle * 180 / Math.PI) % 360;
          if (planeAngleDeg < 0) planeAngleDeg += 360;
          
          const rotation = planeAngleDeg + (plane.direction > 0 ? 90 : -90) + 90;
          
          // Direct DOM manipulation for performance (React Ref pattern)
          planeElementsRef.current[i].style.transform = `translate(calc(${radarRadius}px + ${x}px - 8px), calc(${radarRadius}px + ${y}px - 8px)) rotate(${rotation}deg)`;
          
          let cssPlaneAngle = (planeAngleDeg + 90) % 360;
          let diff = (currentSweepAngle - cssPlaneAngle + 360) % 360;
          
          planeElementsRef.current[i].style.opacity = diff < 120 ? Math.max(0.3, 1 - (diff / 120)) : 0.3;
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);

    return () => {
        clearInterval(intervalId);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);


  const isAuthenticated = localStorage.getItem("token"); // Verifica se o usuário está logado

  const handleLoginClick = (e) => {
    e.preventDefault(); // Previne o comportamento padrão do link
    if (isAuthenticated) {
      navigate("/app/dashboard"); // Redireciona para o Dashboard se estiver logado
    } else {
      navigate("/login"); // Caso contrário, vai para a página de Login
    }
  };

  return (
    <Box className={styles.home} sx={{background: 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)'}}>
      {/* Navbar com Material-UI - Glassmorphism */}
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: "rgba(10, 25, 41, 0.7)", 
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "none"
        }}
      >
        <Container maxWidth="xl">
            <Toolbar disableGutters>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontFamily: '"Orbitron", sans-serif', fontWeight: 700, color: '#4dabf5', letterSpacing: { xs: '0px', md: '2px' }, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                INFINITE WORLD TOUR
            </Typography>
            <Button color="inherit" component={Link} to="/wiki/faq" sx={{ mx: { xs: 0.2, md: 1 }, fontFamily: '"Orbitron", sans-serif', fontSize: { xs: '0.65rem', md: '0.875rem' }, letterSpacing: '1px' }}>
                Wiki
            </Button>
            <Button color="inherit" component={Link} to="/about" sx={{ mx: { xs: 0.2, md: 1 }, fontFamily: '"Orbitron", sans-serif', fontSize: { xs: '0.65rem', md: '0.875rem' }, letterSpacing: '1px' }}>
                About
            </Button>
            <Button color="inherit" component={Link} to="/register" sx={{ mx: { xs: 0.2, md: 1 }, fontFamily: '"Orbitron", sans-serif', fontSize: { xs: '0.65rem', md: '0.875rem' }, letterSpacing: '1px' }}>
                Sign Up
            </Button>
            <Button 
                variant="outlined" 
                onClick={handleLoginClick} 
                sx={{ 
                    ml: { xs: 0.5, md: 2 }, 
                    borderColor: '#4dabf5', 
                    color: '#4dabf5',
                    fontFamily: '"Orbitron", sans-serif',
                    "&:hover": { borderColor: '#fff', color: '#fff' },
                    fontSize: { xs: '0.65rem', md: '0.875rem' },
                    padding: { xs: '3px 8px', md: '5px 15px' },
                    letterSpacing: '1px'
                }}
            >
                Login
            </Button>
            </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <main className={styles['hero-section']} style={{ background: 'transparent' }}>
        <div className={styles.container} style={{ zIndex: 2, position: 'relative' }}>
            <motion.div 
                className={styles['hero-content']} 
                style={{ color: 'white', maxWidth: '600px' }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
            >
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontFamily: '"Orbitron", sans-serif', fontWeight: 700, textTransform: "uppercase", fontSize: { xs: '2rem', md: '4rem'}, lineHeight: 1.1, mb: 3, background: '-webkit-linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Infinite World Tour
              </Typography>
              <Typography variant="h5" component="p" sx={{ lineHeight: 1.6, mb: 4, opacity: 0.9, fontSize: { xs: '0.95rem', md: '1.1rem' }, fontWeight: 300 }}>
                Welcome to the Infinite World Tour System, your gateway to exploring the virtual world of aviation in the Infinite Flight simulator! Uncover challenges, earn rewards, and connect with a global community.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 6, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Button 
                  component={Link} 
                  to="/register" 
                  variant="contained" 
                  size="large"
                  sx={{ 
                    fontSize: { xs: '0.85rem', md: '1rem' }, 
                    fontWeight: 'bold', 
                    px: { xs: 3, md: 4 }, 
                    py: { xs: 1, md: 1.5 },
                  }}
                >
                  Join Now
                </Button>
                <Button 
                  onClick={handleLoginClick} 
                  variant="outlined" 
                  size="large"
                  sx={{ 
                    fontSize: { xs: '0.85rem', md: '1rem' }, 
                    fontWeight: 'bold', 
                    px: { xs: 3, md: 4 }, 
                    py: { xs: 1, md: 1.5 },
                  }}
                >
                  Login
                </Button>
              </Box>

              {/* Estatísticas */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 4 }}>
                <Box sx={{ flex: { xs: '1 1 45%', sm: '1 1 45%', md: '1 1 45%' } }}>
                  <FlightStats
                    label="Total Flights"
                    value={stats.total_flights}
                    icon={<Flight fontSize="large" sx={{ color: '#4dabf5' }} />} 
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 45%', sm: '1 1 45%', md: '1 1 45%' } }}>
                  <FlightStats
                    label="Total Hours"
                    value={stats.total_hours}
                    icon={<Schedule fontSize="large" sx={{ color: '#e91e63' }} />} 
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 45%', sm: '1 1 45%', md: '1 1 45%' } }}>
                  <FlightStats
                    label="Total Pilots"
                    value={stats.total_pilots}
                    icon={<Person fontSize="large" sx={{ color: '#00e676' }} />} 
                  />
                </Box>
                <Box sx={{ flex: { xs: '1 1 45%', sm: '1 1 45%', md: '1 1 45%' } }}>
                  <FlightStats
                    label="Airports"
                    value={stats.total_airports}
                    icon={<Public fontSize="large" sx={{ color: '#ff9100' }} />} 
                  />
                </Box>
              </Box>
            </motion.div> 

            <motion.div 
                className={styles['hero-visual']}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
            >
                <div className={styles['radar-wrapper']}>
                    <div className={styles.radar}>
                        <div className={`${styles.circle} ${styles['circle-1']}`}></div>
                        <div className={`${styles.circle} ${styles['circle-2']}`}></div>
                        <div className={`${styles.circle} ${styles['circle-3']}`}></div>
                        <div className={`${styles.circle} ${styles['circle-4']}`}></div>
                        <div className={`${styles.circle} ${styles['circle-5']}`}></div>
                        <div className={styles['center-point']}></div>
                        <div className={styles.sweep}></div>
                        <div id="planes-container">
                          {[...Array(12)].map((_, i) => (
                              <div 
                                key={i} 
                                className={styles.plane} 
                                ref={el => planeElementsRef.current[i] = el}
                              >
                                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M21,16L21,14L13,9L13,3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5L10,9L2,14L2,16L10,13.5L10,18.5L8,20L8,22L11.5,21L15,22L15,20L13,18.5L13,13.5L21,16Z" />
                                </svg>
                              </div>
                          ))}
                        </div>
                    </div>
                </div>                
            </motion.div>
        </div>
        <div className={styles['city-skyline']}></div>
    </main>

    </Box>
  );
};

export default Home;