import BackgroundActions from 'react-native-background-actions';
import { DeviceEventEmitter } from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import { IFConnectV2 } from './IFConnect';
import { FlightTracker } from './FlightTracker';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

let ifConnectInstance = null;
let flightTrackerInstance = null;
let isRunning = false;

// Audio player function for background thread
const playAudioAlert = async (text) => {
    try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
        const { sound } = await Audio.Sound.createAsync({ uri: url });
        await sound.playAsync();
    } catch (e) {
        console.log('Erro ao tocar audio:', e);
    }
};

const backgroundTask = async (taskDataArguments) => {
    const { ipAddress, session } = taskDataArguments;
    
    ifConnectInstance = new IFConnectV2();
    flightTrackerInstance = new FlightTracker(ifConnectInstance);
    isRunning = true;
    
    await BackgroundActions.updateNotification({
        taskDesc: 'Iniciando módulo de rastreamento...',
        progressBar: { max: 100, value: 0 },
    });
    
    let isConnectedAudioPlayed = false;
    
    const subStatus = DeviceEventEmitter.addListener('IFC_STATUS', async (statusStr) => {
        await BackgroundActions.updateNotification({
            taskDesc: statusStr,
        });
        
        if (statusStr === 'Conexão bem sucedida!') {
            if (!isConnectedAudioPlayed) {
                // Tenta notificação (pode falhar se não tiver permissão)
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'IF Crew Center',
                        body: '✈️ Infinite Flight Conectado!',
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.MAX,
                    },
                    trigger: null,
                });
                
                // Toca áudio de voz forçado (funciona mesmo com notificações bloqueadas)
                await playAudioAlert('Infinite Flight Connected. Have a nice flight.');
                
                isConnectedAudioPlayed = true;
            }
        } else if (statusStr.includes('Perdida') || statusStr.includes('Encerrado')) {
            if (flightTrackerInstance && !flightTrackerInstance.flight_reported && flightTrackerInstance.touchdown_count > 0 && (flightTrackerInstance.status === "LANDING" || flightTrackerInstance.status === "TAXI")) {
                console.log("[BG] Conexão perdida após pouso. Forçando finalização do voo.");
                flightTrackerInstance.status = "FINISHED";
                flightTrackerInstance.finalizeFlight();
            }
            if (isConnectedAudioPlayed) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'IF Crew Center',
                        body: '🔌 Infinite Flight Desconectado',
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.HIGH,
                    },
                    trigger: null,
                });
                isConnectedAudioPlayed = false;
            }
        }
    });
    
    const subFinish = DeviceEventEmitter.addListener('FLIGHT_FINISHED', async (payload) => {
        const scoreMsg = `Flight completed. Landing score: ${payload.score} out of 10. Sending report...`;
        
        await BackgroundActions.updateNotification({
            taskDesc: scoreMsg,
        });
        
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Flight Completed',
                body: `🛬 Score: ${payload.score}/10. Sending report...`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.MAX,
            },
            trigger: null,
        });
        
        // Voice alert in English
        await playAudioAlert(`Flight completed. Your landing score is ${payload.score} out of 10.`);
        
        try {
            const token = session.token || session.auth_token || session.key; 
            const response = await fetch('https://infinite-flight-crew-center.onrender.com/landing-report/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                console.log('\n=========================================');
                console.log('✅ NOTA ENVIADA PARA O SITE COM SUCESSO! ✅');
                console.log('=========================================\n');
                const successMsg = `Report successfully sent to Crew Center!`;
                await BackgroundActions.updateNotification({
                    taskDesc: successMsg,
                });
                await playAudioAlert('Report successfully sent.');
            } else {
                await BackgroundActions.updateNotification({
                    taskDesc: `Error sending report. Saved locally.`,
                });
            }
        } catch (e) {
            await BackgroundActions.updateNotification({
                taskDesc: `Server offline. Report saved locally.`,
            });
        }
        
        setTimeout(() => stopBackgroundFlight(), 10000); // auto stop after 10s
    });

    const subForceSend = DeviceEventEmitter.addListener('FORCE_SEND_REAL_SCORE', () => {
        if (flightTrackerInstance) {
            console.log('[BACKGROUND] Forçando envio do score real...');
            flightTrackerInstance.flight_reported = false; // Reset to allow sending
            flightTrackerInstance.finalizeFlight();
        }
    });

    // Request notification permission (Android 13+)
    try {
        await Notifications.requestPermissionsAsync();
    } catch (e) {
        console.warn('[BG] Permission request error:', e);
    }
    
    try {
        // Await TCP connection to Infinite Flight
        await ifConnectInstance.connect(ipAddress);
        
        // Wait for manifest to be loaded (IF sends manifest then closes socket)
        if (Object.keys(ifConnectInstance.manifest).length === 0) {
            await new Promise((resolve) => {
                const manifestSub = DeviceEventEmitter.addListener('MANIFEST_LOADED', () => {
                    manifestSub.remove();
                    resolve();
                });
                // Timeout after 30s to avoid hanging forever
                setTimeout(() => { manifestSub.remove(); resolve(); }, 30000);
            });
        }
        
        // Main telemetry polling loop
        while (isRunning && BackgroundActions.isRunning()) {
            ifConnectInstance.pollTelemetry();
            await sleep(1000);
        }
    } catch (e) {
        console.warn('Background task error:', e);
    }
    
    subStatus.remove();
    subFinish.remove();
    if (ifConnectInstance) ifConnectInstance.disconnect();
    isRunning = false;
};

const options = {
    taskName: 'IFCrewCenterFlight',
    taskTitle: 'IF Crew Center',
    taskDesc: 'Preparando voo...',
    taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
    },
    color: '#060d18',
    linkingURI: 'ifcrewcenter://flight', 
    parameters: {
        ipAddress: '127.0.0.1',
        session: null
    },
};

export const startBackgroundFlight = async (ipAddress, session) => {
    options.parameters.ipAddress = ipAddress;
    options.parameters.session = session;
    await BackgroundActions.start(backgroundTask, options);
};

export const stopBackgroundFlight = async () => {
    isRunning = false;
    await BackgroundActions.stop();
};

export const isBackgroundFlightRunning = () => {
    return BackgroundActions.isRunning();
};
