import React from 'react';
import { Box, Typography, Paper, Button, Divider, Grid } from '@mui/material';
import { Download as DownloadIcon, Android as AndroidIcon, Apple as AppleIcon } from '@mui/icons-material';

const AppManual = () => {
  return (
    <Box sx={{ p: 3, maxWidth: 900, margin: '0 auto' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        Manual do Aplicativo de Rastreamento
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Para que serve o App?
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          Bem-vindo ao manual do **SkyScore**, o nosso aplicativo oficial focado em analisar e pontuar a qualidade do seu voo em simuladores mobile.
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          A principal função do SkyScore é atuar como um "Juiz Virtual", fornecendo um rigoroso **Rate de Pontuação de Pouso**. Ele funciona em segundo plano no seu celular ou tablet enquanto você voa, avaliando silenciosamente a sua telemetria — como a Força G no toque, o Desvio do Eixo da pista, a estabilidade na aproximação final e a sua Velocidade Vertical (VS).
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Como utilizar:
        </Typography>
        <ol style={{ paddingLeft: '20px', color: 'inherit' }}>
          <li><Typography variant="body1" color="text.secondary">Certifique-se de que seu Infinite Flight está rodando e conectado na mesma rede Wi-Fi.</Typography></li>
          <li><Typography variant="body1" color="text.secondary">Abra o aplicativo tracker e faça login com a mesma conta deste site.</Typography></li>
          <li><Typography variant="body1" color="text.secondary">Clique em "Iniciar Monitoramento". O App achará o simulador automaticamente.</Typography></li>
          <li><Typography variant="body1" color="text.secondary">Realize seu voo normalmente. Assim que você pousar e desligar os motores, as notas serão enviadas para o painel.</Typography></li>
        </ol>
      </Paper>

      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Downloads (Em Breve)
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <AndroidIcon sx={{ fontSize: 50, color: '#3DDC84', mb: 2 }} />
            <Typography variant="h6" gutterBottom>Android</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Baixe a versão para Android via arquivo APK diretamente no seu dispositivo.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<DownloadIcon />} 
              disabled
              fullWidth
            >
              Baixar APK (Em breve)
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
            <AppleIcon sx={{ fontSize: 50, color: '#000000', mb: 2 }} />
            <Typography variant="h6" gutterBottom>iOS (iPhone/iPad)</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              A versão de iOS estará disponível via TestFlight ou na App Store futuramente.
            </Typography>
            <Button 
              variant="outlined" 
              color="inherit" 
              startIcon={<DownloadIcon />} 
              disabled
              fullWidth
            >
              Baixar iOS (Em breve)
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AppManual;
