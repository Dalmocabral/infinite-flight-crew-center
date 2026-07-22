import React, { useEffect, useState, useRef } from 'react';
import { Box, Card, Grid, Typography, LinearProgress, Paper } from '@mui/material';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title
} from "chart.js";
import dayjs from "dayjs";
import greatCircle from '@turf/great-circle';
import { point } from '@turf/helpers';
import { Bar, Doughnut } from "react-chartjs-2";
import AxiosInstance from "../components/AxiosInstance";
import ApiService from "../components/ApiService";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import IconButton from '@mui/material/IconButton';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

const KM_TO_NM = 0.539957;
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * KM_TO_NM;
};

const StatRow = ({ label, range, count, total, color }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {label} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'normal', fontSize: '0.85em', marginLeft: '8px' }}>{range}</span>
                </Typography>
                <Typography variant="body2" sx={{ color: 'white' }}>{count}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={percentage} sx={{ 
                height: 8, 
                borderRadius: 4, 
                backgroundColor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': { backgroundColor: color, borderRadius: 4 }
            }} />
        </Box>
    );
};

const TopStatsWidget = ({ flights, airportsData, logoData, ifLiveries, page }) => {
    let title = "";
    let dataMap = {};

    const getCountryName = (code) => {
        if (!code) return "Unknown";
        try {
            return new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
        } catch (e) {
            return code; // fallback se o código for inválido
        }
    };

    flights.forEach(f => {
        if (page === 1) {
            title = "Top departures";
            const code = airportsData[f.departure_airport]?.country;
            const country = getCountryName(code);
            dataMap[country] = (dataMap[country] || 0) + 1;
        } else if (page === 2) {
            title = "Top arrivals";
            const code = airportsData[f.arrival_airport]?.country;
            const country = getCountryName(code);
            dataMap[country] = (dataMap[country] || 0) + 1;
        } else if (page === 3) {
            title = "Top aircraft";
            const ac = f.aircraft || "Unknown";
            dataMap[ac] = (dataMap[ac] || 0) + 1;
        } else if (page === 4) {
            title = "Top liveries";
            let liveryName = "Default";
            if (f.livery_id) {
                // First try to get it from Infinite Flight API data
                if (ifLiveries && ifLiveries.length > 0) {
                    const match = ifLiveries.find(item => item.id && item.id.toLowerCase() === f.livery_id.toLowerCase());
                    if (match && match.liveryName) liveryName = match.liveryName;
                }
                
                // Fallback to local logoData if IF API doesn't have it or returned "Generic"
                if ((liveryName === "Default" || liveryName === "Generic") && logoData) {
                    const match = logoData.find(item => item.LiveryId && item.LiveryId.toLowerCase() === f.livery_id.toLowerCase());
                    if (match && match.Airline) liveryName = match.Airline;
                }
            }
            dataMap[liveryName] = (dataMap[liveryName] || 0) + 1;
        }
    });

    const sortedData = Object.entries(dataMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const maxCount = sortedData.length > 0 ? sortedData[0][1] : 1;

    return (
        <Card sx={{ p: 2, height: '100%', backgroundColor: '#212936', color: 'white', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
                <Box textAlign="center">
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ fontSize: '1rem' }}>{title}</Typography>
                    <Typography variant="caption" sx={{ color: '#8e9eab', display: 'block', mt: -0.5 }}>{flights.length} flights</Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {sortedData.map(([label, count], index) => (
                    <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.2 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pr: 1 }}>
                                <span style={{ opacity: 0.4, marginRight: '10px', fontSize: '0.75rem' }}>{index + 1}</span>
                                {label}
                            </Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', opacity: 0.7 }}>{count}</Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 4, backgroundColor: 'transparent', borderRadius: 2 }}>
                            <Box sx={{ width: `${(count / maxCount) * 100}%`, height: '100%', backgroundColor: '#00b0ff', borderRadius: 2 }} />
                        </Box>
                    </Box>
                ))}
            </Box>
        </Card>
    );
};

const Analytics = () => {
    const mapRef = useRef(null);
    const [flights, setFlights] = useState([]);
    const [airportsData, setAirportsData] = useState({});
    const [logoData, setLogoData] = useState([]);
    const [ifLiveries, setIfLiveries] = useState([]);
    
    // Day vs Night specific logic
    const [userIfFlights, setUserIfFlights] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userRes = await AxiosInstance.get('users/me/');
                if (userRes.data && userRes.data.usernameIFC) {
                    const statusRes = await ApiService.userStatusByUsername(userRes.data.usernameIFC);
                    if (statusRes && statusRes.userId) {
                        const ifFlights = await ApiService.getUserFlights(statusRes.userId);
                        setUserIfFlights(ifFlights || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching user IF flights:", error);
            }
        };
        fetchUserData();
    }, []);

    let totalDayTime = 0;
    let totalNightTime = 0;
    userIfFlights.forEach(f => {
        totalDayTime += (f.dayTime || 0);
        totalNightTime += (f.nightTime || 0);
    });
    const totalIfTime = totalDayTime + totalNightTime;
    const dayPercent = totalIfTime > 0 ? Math.round((totalDayTime / totalIfTime) * 100) : 0;
    const nightPercent = totalIfTime > 0 ? Math.round((totalNightTime / totalIfTime) * 100) : 0;

    const mapContainer = useRef(null);
    const [distanceStats, setDistanceStats] = useState({ short: 0, medium: 0, long: 0, ultra: 0, total: 0 });

    useEffect(() => {
        const fetchFlights = async () => {
            try {
                const response = await AxiosInstance.get("/dashboard/");
                const sortedFlights = response.data.sort(
                    (a, b) => new Date(b.registration_date) - new Date(a.registration_date)
                );
                setFlights(sortedFlights);
            } catch (error) {
                console.error("Error fetching flights:", error);
            }
        };

        const fetchAirports = async () => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/Dalmocabral/Airport/refs/heads/master/airports.json');
                const data = await response.json();
                setAirportsData(data);
            } catch (error) {
                console.error('Error fetching airports data:', error);
            }
        };

        const fetchLogosAndLiveries = async () => {
            try {
                const logos = await ApiService.getAirplaneLogoData();
                setLogoData(logos);
            } catch (error) {
                console.error('Error fetching logos data:', error);
            }
            try {
                const liveries = await ApiService.getAircraftLiveries();
                setIfLiveries(liveries);
            } catch (error) {
                console.error('Error fetching IF liveries data:', error);
            }
        };

        fetchFlights();
        fetchAirports();
        fetchLogosAndLiveries();
    }, []);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const flightsLast30Days = flights.filter(
        f => f.status === 'Approved' && new Date(f.registration_date) >= thirtyDaysAgo
    );

    useEffect(() => {
        const recent30Flights = flights.filter(f => f.status === 'Approved').slice(0, 30);
        
        if (Object.keys(airportsData).length > 0 && recent30Flights.length > 0 && mapContainer.current) {
            if (!mapRef.current) {
                mapRef.current = L.map(mapContainer.current, { zoomControl: false, attributionControl: false }).setView([20, 0], 2);
                L.tileLayer('https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=oLMznTPIDCPrc3mGZdoh').addTo(mapRef.current);
            }

            mapRef.current.eachLayer((layer) => {
                if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
                    mapRef.current.removeLayer(layer);
                }
            });

            let short = 0, medium = 0, long = 0, ultra = 0;

            recent30Flights.forEach(flight => {
                const dep = airportsData[flight.departure_airport];
                const arr = airportsData[flight.arrival_airport];
                
                if (dep && arr) {
                    const dist = calculateDistance(dep.lat, dep.lon, arr.lat, arr.lon);
                    let lineColor = '#2ecc71';
                    
                    if (dist < 1000) { short++; lineColor = '#2ecc71'; }
                    else if (dist < 2500) { medium++; lineColor = '#f1c40f'; }
                    else if (dist < 5000) { long++; lineColor = '#ff5722'; }
                    else { ultra++; lineColor = '#e74c3c'; }

                    let durationSecs = 0;
                    if (flight.flight_duration && typeof flight.flight_duration === 'string') {
                        const parts = flight.flight_duration.split(':');
                        if (parts.length >= 2) {
                            durationSecs = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + (parts.length === 3 ? parseInt(parts[2]) : 0);
                        }
                    } else if (typeof flight.flight_duration === 'number') {
                        durationSecs = flight.flight_duration;
                    }

                    const hours = Math.floor(durationSecs / 3600);
                    const minutes = Math.floor((durationSecs % 3600) / 60);
                    const formattedDuration = `${hours > 0 ? hours + 'h ' : ''}${minutes}m`;
                    const formattedDate = dayjs(flight.registration_date).format('MMM D, YYYY');

                    const tooltipHtml = `
                        <div style="font-family: inherit; min-width: 200px;">
                            <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 4px;">${flight.flight_icao} ${flight.flight_number}</div>
                            <div style="color: #ff5252; font-size: 0.9em; margin-bottom: 6px; font-weight: bold;">
                                ${flight.departure_airport} ➔ ${flight.arrival_airport}
                            </div>
                            <div style="color: #e0e0e0; font-size: 0.85em; margin-bottom: 2px;">
                                ${flight.aircraft}
                            </div>
                            <div style="color: #b0bec5; font-size: 0.85em;">
                                ${formattedDate} · ${formattedDuration} · ${flight.network || 'N/A'} · ${flight.xp || 0} XP
                            </div>
                        </div>
                    `;

                    let latLngs = [];
                    if (dep.lat === arr.lat && dep.lon === arr.lon) {
                        latLngs = [[dep.lat, dep.lon]];
                    } else {
                        try {
                            const greatCircleLine = greatCircle(point([dep.lon, dep.lat]), point([arr.lon, arr.lat]));
                            latLngs = greatCircleLine.geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        } catch (e) {
                            latLngs = [[dep.lat, dep.lon], [arr.lat, arr.lon]];
                        }
                    }

                    const line = L.polyline(latLngs, { color: lineColor, weight: 2, opacity: 0.6 }).addTo(mapRef.current);
                    line.bindTooltip(tooltipHtml, { sticky: true, className: 'flight-tooltip' });

                    L.circleMarker([dep.lat, dep.lon], { radius: 2.5, color: '#ffffff', weight: 1, fillColor: '#000000', fillOpacity: 1 }).addTo(mapRef.current);
                    L.circleMarker([arr.lat, arr.lon], { radius: 2.5, color: '#ffffff', weight: 1, fillColor: '#000000', fillOpacity: 1 }).addTo(mapRef.current);
                }
            });

            setDistanceStats({ short, medium, long, ultra, total: recent30Flights.length });
        }
    }, [flights, airportsData]);

    const approvedFlights = flights.filter(f => f.status === 'Approved');
    const totalApproved = approvedFlights.length;
    const uniqueRoutes = new Set(approvedFlights.map(f => `${f.departure_airport}-${f.arrival_airport}`)).size;
    
    const totalDurationSecs = approvedFlights.reduce((acc, f) => {
        if (f.flight_duration && typeof f.flight_duration === 'string') {
            const parts = f.flight_duration.split(':');
            if (parts.length >= 2) {
                const h = parseInt(parts[0]) || 0;
                const m = parseInt(parts[1]) || 0;
                const s = parts.length === 3 ? (parseInt(parts[2]) || 0) : 0;
                return acc + (h * 3600) + (m * 60) + s;
            }
        } else if (typeof f.flight_duration === 'number') {
            return acc + f.flight_duration;
        }
        return acc;
    }, 0);

    const avgDurationSecs = totalApproved > 0 ? totalDurationSecs / totalApproved : 0;
    const avgHours = Math.floor(avgDurationSecs / 3600);
    const avgMinutes = Math.floor((avgDurationSecs % 3600) / 60);
    const avgTimeDisplay = avgHours > 0 ? `${avgHours}h ${avgMinutes}m` : `${avgMinutes}m`;

    const flightsByDay = flightsLast30Days.reduce((acc, flight) => {
        const dateStr = dayjs(flight.registration_date).format("MMM DD");
        acc[dateStr] = (acc[dateStr] || 0) + 1;
        return acc;
    }, {});

    const barChartData = {
        labels: Object.keys(flightsByDay),
        datasets: [{ label: "Flights per Day (Approved)", data: Object.values(flightsByDay), backgroundColor: "#4dabf5", borderColor: "#2196f3", borderWidth: 1 }],
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
            x: { grid: { color: 'rgba(255,255,255,0.1)' } }
        },
        plugins: { legend: { labels: { color: 'white' } } }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <style>
                {`
                .flight-tooltip {
                    background-color: #1a1a2e !important;
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    border-radius: 8px !important;
                    color: white !important;
                    padding: 12px !important;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
                }
                .flight-tooltip::before {
                    border-top-color: #1a1a2e !important;
                    border-bottom-color: #1a1a2e !important;
                }
                `}
            </style>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, color: 'white' }}>
                Logbook & Analytics
            </Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 0, minHeight: 300, position: 'relative', overflow: 'hidden' }}>
                        <Box ref={mapContainer} sx={{ width: '100%', height: '350px', backgroundColor: '#1a1a1a' }} />
                        <Box sx={{
                            position: 'absolute',
                            top: 15,
                            right: 15,
                            display: 'flex',
                            gap: 2,
                            zIndex: 1000
                        }}>
                            <Paper sx={{ backgroundColor: 'rgba(26, 32, 44, 0.9)', backdropFilter: 'blur(4px)', color: 'white', px: 2, py: 1, borderRadius: 2, textAlign: 'center', minWidth: 80, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{totalApproved}</Typography>
                                <Typography variant="caption" sx={{ color: '#8e9eab', letterSpacing: 1, fontSize: '0.7rem' }}>FLIGHTS</Typography>
                            </Paper>
                            <Paper sx={{ backgroundColor: 'rgba(26, 32, 44, 0.9)', backdropFilter: 'blur(4px)', color: 'white', px: 2, py: 1, borderRadius: 2, textAlign: 'center', minWidth: 80, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{uniqueRoutes}</Typography>
                                <Typography variant="caption" sx={{ color: '#8e9eab', letterSpacing: 1, fontSize: '0.7rem' }}>ROUTES</Typography>
                            </Paper>
                            <Paper sx={{ backgroundColor: 'rgba(26, 32, 44, 0.9)', backdropFilter: 'blur(4px)', color: 'white', px: 2, py: 1, borderRadius: 2, textAlign: 'center', minWidth: 80, border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{avgTimeDisplay}</Typography>
                                <Typography variant="caption" sx={{ color: '#8e9eab', letterSpacing: 1, fontSize: '0.7rem' }}>AVG TIME</Typography>
                            </Paper>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgba(10, 25, 41, 0.7)' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'white' }}>
                            Distance Overview (Last 30)
                        </Typography>
                        <StatRow label="Short-haul" range="< 1,000 nm" count={distanceStats.short} total={distanceStats.total} color="#2ecc71" />
                        <StatRow label="Medium-haul" range="1,000–2,500 nm" count={distanceStats.medium} total={distanceStats.total} color="#f1c40f" />
                        <StatRow label="Long-haul" range="2,500–5,000 nm" count={distanceStats.long} total={distanceStats.total} color="#ff9800" />
                        <StatRow label="Ultra-long" range="5,000+ nm" count={distanceStats.ultra} total={distanceStats.total} color="#e74c3c" />
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                    <TopStatsWidget flights={approvedFlights} airportsData={airportsData} logoData={logoData} ifLiveries={ifLiveries} page={1} />
                </Grid>
                <Grid item xs={12} md={3}>
                    <TopStatsWidget flights={approvedFlights} airportsData={airportsData} logoData={logoData} ifLiveries={ifLiveries} page={2} />
                </Grid>
                <Grid item xs={12} md={3}>
                    <TopStatsWidget flights={approvedFlights} airportsData={airportsData} logoData={logoData} ifLiveries={ifLiveries} page={3} />
                </Grid>
                <Grid item xs={12} md={3}>
                    <TopStatsWidget flights={approvedFlights} airportsData={airportsData} logoData={logoData} ifLiveries={ifLiveries} page={4} />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card sx={{ p: 3, minHeight: 400 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                            Flight Activity (30 Days)
                        </Typography>
                        <Box sx={{ height: 320 }}>
                            <Bar data={barChartData} options={barChartOptions} />
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10, 25, 41, 0.7)' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
                            Your Day vs Night Flights
                        </Typography>
                        
                        <Box sx={{ width: 180, height: 180, mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img src="/sun_moon.png" alt="Day vs Night" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </Box>

                        <Grid container spacing={2} sx={{ width: '100%', px: 1 }}>
                            <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255,193,7,0.3)', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ color: '#ffc107', fontWeight: 'bold' }}>{dayPercent}%</Typography>
                                    <Typography variant="caption" sx={{ color: 'white' }}>DAY</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Box sx={{ textAlign: 'center', p: 1.5, backgroundColor: 'rgba(144, 202, 249, 0.1)', border: '1px solid rgba(144,202,249,0.3)', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ color: '#90caf9', fontWeight: 'bold' }}>{nightPercent}%</Typography>
                                    <Typography variant="caption" sx={{ color: 'white' }}>NIGHT</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                        {userIfFlights.length === 0 && (
                            <Typography variant="caption" sx={{ mt: 2, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                                Searching recent IF logbook...
                            </Typography>
                        )}
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Analytics;
