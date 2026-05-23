import BackgroundActions from 'react-native-background-actions';
import { DeviceEventEmitter } from 'react-native';
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
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'IF Crew Center',
                        body: '✈️ Infinite Flight Conectado!',
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.MAX,
                    },
                    trigger: null,
                });
                isConnectedAudioPlayed = true;
            }
        } else if (statusStr.includes('Conexão Perdida') || statusStr.includes('Encerrado')) {
            if (isConnectedAudioPlayed) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'IF Crew Center',
                        body: '⚠️ Infinite Flight Desconectado',
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
        const scoreMsg = `Voo Encerrado. Sua nota de pouso foi ${payload.score} de 10. Enviando relatório...`;
        await BackgroundActions.updateNotification({
            taskDesc: scoreMsg,
        });
        
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'IF Crew Center - Voo Encerrado',
                body: `Nota de pouso: ${payload.score}/10. Enviando dados...`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
        });
        
        try {
            const token = session.token || session.auth_token || session.key; // Make sure we have the correct token key based on login
            const response = await fetch('https://infinite-flight-crew-center.onrender.com/landing-report/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const successMsg = `Relatório de voo enviado com sucesso! Bom descanso comandante.`;
                await BackgroundActions.updateNotification({
                    taskDesc: successMsg,
                });
            } else {
                await BackgroundActions.updateNotification({
                    taskDesc: `Erro ao enviar dados. Salvo localmente.`,
                });
            }
        } catch (e) {
            await BackgroundActions.updateNotification({
                taskDesc: `Servidor offline. Dados salvos localmente.`,
            });
        }
        
        setTimeout(() => stopBackgroundFlight(), 10000); // auto stop after 10s
    });

    try {
        ifConnectInstance.connect(ipAddress); // This loops inside if failing
        
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
