import { createTheme } from '@mui/material/styles';

// Custom dark/aviation theme
const aviationTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4dabf5', // Light blue
    },
    secondary: {
      main: '#f50057', // Pink/Red accent
    },
    background: {
      default: '#0a1929', // Deep blue
      paper: 'rgba(10, 25, 41, 0.7)', // Glass effect base
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    success: {
      main: '#2ecc71',
      contrastText: '#fff',
    },
    warning: {
      main: '#f1c40f',
      contrastText: '#000',
    },
    error: {
      main: '#e74c3c',
    },
  },
  typography: {
    fontFamily: '"Orbitron", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '0.1em' },
    h2: { fontWeight: 700, letterSpacing: '0.1em' },
    h3: { fontWeight: 700, letterSpacing: '0.1em' },
    h4: { fontWeight: 700, letterSpacing: '0.1em' },
    h5: { 
      fontWeight: 700, 
      letterSpacing: '0.1em',
      textShadow: '0 0 10px rgba(77, 171, 245, 0.5)', // Neon glow effect
    },
    h6: { fontWeight: 600, letterSpacing: '0.05em' },
    button: {
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#6b6b6b #2b2b2b",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#2b2b2b",
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#6b6b6b",
            minHeight: 24,
            border: "2px solid #2b2b2b",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#959595",
          },
          "&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner": {
            backgroundColor: "#2b2b2b",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.5)',
              boxShadow: '0 0 8px rgba(77, 171, 245, 0.2)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4dabf5',
              boxShadow: '0 0 15px rgba(77, 171, 245, 0.4)',
            },
          },
          '& .MuiInputLabel-root': {
            color: 'rgba(255, 255, 255, 0.7)',
          },
          '& .MuiInputBase-input': {
            color: '#fff',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '25px',
          padding: '10px 24px',
          textTransform: 'none',
          fontSize: '1rem',
          transition: 'all 0.3s ease',
        },
        contained: {
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
          color: 'white',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
            boxShadow: '0 6px 10px 4px rgba(33, 203, 243, .4)',
            transform: 'translateY(-2px)',
          },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.5)',
          color: '#fff',
          '&:hover': {
             borderColor: '#4dabf5',
             color: '#4dabf5',
             backgroundColor: 'rgba(77, 171, 245, 0.1)',
          }
        }
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default gradient on dark mode
        },
        rounded: {
            borderRadius: '16px',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 25, 41, 0.6)', 
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(77, 171, 245, 0.3)',
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
        head: {
          color: '#4dabf5',
          fontWeight: 700,
          backgroundColor: 'rgba(10, 25, 41, 0.8) !important',
        },
        body: {
          color: '#fff',
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(4px)',
          fontWeight: 600,
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 25, 41, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'none',
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0a1929',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }
    }
  },
});

export default aviationTheme;
