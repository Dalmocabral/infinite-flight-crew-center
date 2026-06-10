import BackgroundActions from 'react-native-background-actions';
import { DeviceEventEmitter } from 'react-native';
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

// Áudio removido a pedido do usuário

const backgroundTask = async (taskDataArguments) => {
    const { ipAddress, session } = taskDataArguments;
    
    ifConnectInstance = new IFConnectV2();
    flightTrackerInstance = new FlightTracker(ifConnectInstance);
    isRunning = true;
    
    await BackgroundActions.updateNotification({
        taskDesc: 'Iniciando módulo de rastreamento...',
        progressBar: { max: 100, value: 0 },
    });
    
    let hasNotifiedConnected = false;
    
    const subStatus = DeviceEventEmitter.addListener('IFC_STATUS', async (statusStr) => {
        await BackgroundActions.updateNotification({
            taskDesc: statusStr,
        });
        
        if (statusStr === 'Conexão bem sucedida!') {
            if (!hasNotifiedConnected) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'IF Crew Center',
                        body: '✈️ Infinite Flight Conectado! Tenha um ótimo voo.',
                        sound: true,
                        priority: Notifications.AndroidNotificationPriority.MAX,
                    },
                    trigger: null,
                });
                hasNotifiedConnected = true; // Garante que avisa apenas UMA vez por voo!
            }
        } else if (statusStr.includes('Perdida') || statusStr.includes('Encerrado')) {
            if (flightTrackerInstance && !flightTrackerInstance.flight_reported && flightTrackerInstance.touchdown_count > 0 && (flightTrackerInstance.status === "LANDING" || flightTrackerInstance.status === "TAXI")) {
                console.log("[BG] Conexão perdida após pouso. Forçando finalização do voo.");
                flightTrackerInstance.status = "FINISHED";
                flightTrackerInstance.finalizeFlight();
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
        
        // URL do servidor local para onde o aplicativo deve enviar os dados do voo
        const baseUrl = 'http://localhost:8000';
        try {
            const token = session.token || session.auth_token || session.key; 
            const response = await fetch(`${baseUrl}/landing-report/`, {
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

    const subForceSend = DeviceEventEmitter.addListener('FORCE_FINALIZE_FLIGHT', () => {
        if (flightTrackerInstance) {
            console.log('[BACKGROUND] Forçando encerramento manual do voo...');
            if (!flightTrackerInstance.flight_reported) {
                flightTrackerInstance.status = "FINISHED";
                flightTrackerInstance.finalizeFlight();
            }
        }
    });

    // Request notification permission (Android 13+)
    try {
        await Notifications.requestPermissionsAsync();
    } catch (e) {
        console.warn('[BG] Permission request error:', e);
    }
    
    try {
        // Conexão assíncrona NÃO BLOQUEANTE para que o loop continue rodando automaticamente
        ifConnectInstance.connect(ipAddress).catch(e => console.warn('Connection error:', e));
        
        // Loop principal de telemetria
        while (isRunning && BackgroundActions.isRunning()) {
            if (ifConnectInstance && ifConnectInstance.connected) {
                ifConnectInstance.pollTelemetry();
            }
            await sleep(200); // Polling 5 vezes mais rápido (5Hz) para não perder o pico de Força G
        }
    } catch (e) {
        console.warn('Background task error:', e);
    }
    
    subStatus.remove();
    subFinish.remove();
    subForceSend.remove();
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
    linkingURI: 'com.dalmocabral.ifcrewcenter://', // Deve bater EXATAMENTE com o scheme do AndroidManifest.xml
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
