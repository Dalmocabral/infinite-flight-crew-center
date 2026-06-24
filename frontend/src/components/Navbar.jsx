import {
    EmojiEvents as AwardsIcon,
    Brightness4 as DarkModeIcon,
    Dashboard as DashboardIcon,
    Flight as FlightsIcon,
    Group as GroupIcon,
    Brightness7 as LightModeIcon,
    Logout as LogoutIcon,
    Map as MapIcon,
    Menu as MenuIcon,
    Public as PublicIcon,
    PhoneAndroid as PhoneAndroidIcon,
    MenuBook as MenuBookIcon
} from '@mui/icons-material';
import {
    AppBar,
    Avatar,
    Box,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Switch,
    ThemeProvider,
    Toolbar,
    Typography
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../auth';
import AxiosInstance from '../components/AxiosInstance';
import Gravatar from '../components/Gravatar';
import { darkTheme, lightTheme } from '../theme';
import Notifications from './Notifications'; // Importando o componente Notifications

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/app/dashboard' },
  { text: 'Members', icon: <GroupIcon />, path: '/app/members' },
  { text: 'World Tour', icon: <AwardsIcon />, path: '/app/awards' },
  { text: 'My Flights', icon: <FlightsIcon />, path: '/app/my-flights' },
  { text: 'My World Tour', icon: <PublicIcon />, path: '/app/my-awards' },
  { text: 'Map', icon: <MapIcon />, path: '/app/map' },
  { text: 'App Manual', icon: <PhoneAndroidIcon />, path: '/app/manual' },
  { text: 'SkyScore Wiki', icon: <MenuBookIcon />, path: '/wiki/official-guide' },
];

const DrawerContent = ({ darkMode, handleThemeChange, navigate, location, handleLogout }) => (
  <div>
    <Toolbar />
    <List>
      {menuItems.map((item) => (
        <ListItem
          button
          key={item.text}
          onClick={() => navigate(item.path)}
          selected={location.pathname === item.path}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
      <ListItem>
        <ListItemIcon>{darkMode ? <LightModeIcon /> : <DarkModeIcon />}</ListItemIcon>
        <Switch checked={darkMode} onChange={handleThemeChange} sx={{ ml: 1 }} />
      </ListItem>
    </List>
    <Divider />
    <List>
      <ListItem button onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItem>
    </List>
  </div>
);

const Navbar = () => {
  const [userData, setUserData] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState({ utcTime: '', localTime: '' });

  const getFormattedTime = () => {
    const now = new Date();

    // Formata o horário UTC
    const utcTime = now.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Formata o horário local
    const localTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    return { utcTime, localTime };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const GetUserData = () => {
    AxiosInstance.get('users/me/')
      .then((res) => {
        setUserData(res.data);
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
      });
  };

  useEffect(() => {
    GetUserData();
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              noWrap
              component="div"
              sx={{ flexGrow: 1, fontFamily: '"Open Sans", sans-serif' }}
            >
              Infinite World Tour System | {currentTime.utcTime} UTC | {currentTime.localTime} Local
            </Typography>

            {/* Integrando o componente Notifications */}
            <Notifications />

            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Gravatar
                  email={userData?.email || 'user@example.com'}
                  size={40}
                  alt={`Profile image of ${userData?.first_name || 'User'}`}
                  style={{ borderRadius: '50%' }}
                />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleMenuClose}>
                  <Avatar src={userData?.gravatar_url} />
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {userData?.first_name} {userData?.last_name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {userData?.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => navigate('/app/profile/edit')}>
                  Edit
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            <DrawerContent
              darkMode={darkMode}
              handleThemeChange={handleThemeChange}
              navigate={navigate}
              location={location}
              handleLogout={handleLogout}
            />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <DrawerContent
              darkMode={darkMode}
              handleThemeChange={handleThemeChange}
              navigate={navigate}
              location={location}
              handleLogout={handleLogout}
            />
          </Drawer>
        </Box>

{/* Main content removed from here to be handled by Layout */}
      </Box>
    </ThemeProvider>
  );
};

export default Navbar;