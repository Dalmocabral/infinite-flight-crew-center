import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, DeviceEventEmitter, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import * as Notifications from 'expo-notifications';
import { startBackgroundFlight, stopBackgroundFlight } from '../utils/BackgroundTask';
import dgram from 'react-native-udp';

export default function Dashboard({ session, onLogout }) {
  const [isConnected, setIsConnected] = useState(false);
  const [telemetry, setTelemetry] = useState({ vs: 0, gs: 0, alt: 0, g_force: 1, engines_off: true });
  const [ipAddress, setIpAddress] = useState('127.0.0.1');
  const [ifcStatus, setIfcStatus] = useState('Aguardando...');
  
  const ifConnectRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
    
    // UDP Auto-discovery
    let socket;
    try {
      socket = dgram.createSocket('udp4');
      socket.bind(15000);
      socket.once('listening', function() {
        console.log('[UDP] Escutando porta 15000 (Buscando Simulador)...');
      });
      socket.on('message', function(msg, rinfo) {
        if (rinfo && rinfo.address) {
          setIpAddress(rinfo.address);
        }
      });
    } catch (e) {
      console.warn('Erro ao configurar UDP:', e);
    }
    
    const sub = DeviceEventEmitter.addListener('TELEMETRY_UPDATE', (data) => {
      setTelemetry(data);
    });
    
    const subStatus = DeviceEventEmitter.addListener('IFC_STATUS', (statusStr) => {
        setIfcStatus(statusStr);
    });

    const subFinish = DeviceEventEmitter.addListener('FLIGHT_FINISHED', (payload) => {
        console.log('[DASHBOARD] Voo finalizado com nota', payload.score);
    });

    return () => {
      sub.remove();
      subStatus.remove();
      subFinish.remove();
      if (timerRef.current) clearInterval(timerRef.current);
      if (socket) socket.close();
    };
  }, []);

  const handleToggleConnection = async () => {
    if (isConnected) {
      await stopBackgroundFlight();
      setIsConnected(false);
      setIfcStatus('Aguardando...');
    } else {
      try {
        await startBackgroundFlight(ipAddress, session);
        setIsConnected(true);
        setIfcStatus('Procurando Simulador...');
      } catch (e) {
        Alert.alert('Erro', 'Erro ao iniciar background: ' + e.message);
      }
    }
  };

  const handleForceSend = () => {
    Alert.alert(
      "Finalizar Voo",
      "Deseja realmente forçar o encerramento e envio do relatório agora?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Finalizar", 
          onPress: () => {
            DeviceEventEmitter.emit('FORCE_FINALIZE_FLIGHT');
            Alert.alert("Sucesso", "Comando de finalização enviado!");
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.brandText}>IF CREW CENTER</Text>
          <Text style={styles.userName}>{session?.username_ifc || 'Piloto'}</Text>
          <Text style={styles.fullName}>{session?.full_name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />
      
      <Text style={[styles.statusText, { color: isConnected ? '#4caf50' : '#f44336' }]}>
        ● {isConnected ? 'MONITORAMENTO ATIVO' : 'MONITORAMENTO DESATIVADO'}
      </Text>
      
      {isConnected && (
        <Text style={{ color: ifcStatus === 'Conexão bem sucedida!' ? '#4caf50' : '#ffeb3b', marginBottom: 16, fontSize: 13, fontWeight: 'bold' }}>
          Status do Jogo: {ifcStatus === 'Conexão bem sucedida!' ? 'CONECTADO AO JOGO' : ifcStatus}
        </Text>
      )}
      
      {!isConnected && (
        <TextInput 
          style={styles.ipInput}
          value={ipAddress}
          onChangeText={setIpAddress}
          placeholder="IP do aparelho (ex: 192.168.1.10)"
          placeholderTextColor="#ffffff60"
        />
      )}
      
      <TouchableOpacity 
        style={[styles.startButton, isConnected && styles.stopButton]} 
        onPress={handleToggleConnection}
      >
        <Text style={styles.startButtonText}>
          {isConnected ? '■ PARAR MONITORAMENTO' : '▶ INICIAR MONITORAMENTO'}
        </Text>
      </TouchableOpacity>
      
      {isConnected && (
        <TouchableOpacity 
          style={[styles.startButton, { backgroundColor: '#ff9800' }]} 
          onPress={handleForceSend}
        >
          <Text style={styles.startButtonText}>
            🏁 ENCERRAR VOO MANUALMENTE
          </Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.helperText}>
        Digite o IP do aparelho rodando o Infinite Flight (127.0.0.1 se for no mesmo).
      </Text>
      
      <View style={styles.hudContainer}>
        <Text style={styles.hudTitle}>{Math.round(telemetry.vs)} FPM</Text>
        <View style={styles.hudRow}>
          <Text style={styles.hudItem}>GS: {Math.round(telemetry.gs)} KTS</Text>
          <Text style={styles.hudItem}>ALT: {Math.round(telemetry.alt)} FT</Text>
          <Text style={styles.hudItem}>G: {telemetry.g_force.toFixed(2)}</Text>
        </View>
        <Text style={[styles.hudItem, { marginTop: 10, fontWeight: 'bold', color: telemetry.engines_off ? '#f44336' : '#4caf50' }]}>
          MOTORES: {telemetry.engines_off ? 'DESLIGADOS' : 'LIGADOS'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#060d18', alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { flex: 1 },
  brandText: { color: '#4dabf5', fontSize: 11, fontWeight: 'bold' },
  userName: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  fullName: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 12 },
  logoutButton: { backgroundColor: '#0d1b2a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: '#4dabf5', fontSize: 12, fontWeight: 'bold' },
  divider: { height: 1, width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.1)', marginVertical: 16 },
  statusText: { fontWeight: 'bold', fontSize: 13, marginBottom: 16 },
  ipInput: { width: '100%', backgroundColor: '#0d1b2a', color: 'white', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' },
  startButton: { backgroundColor: '#4dabf5', width: '100%', height: 52, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginBottom: 8 },
  stopButton: { backgroundColor: '#f44336' },
  startButtonText: { color: '#060d18', fontWeight: 'bold', fontSize: 14 },
  helperText: { color: 'rgba(255, 255, 255, 0.3)', fontSize: 11, textAlign: 'center', marginBottom: 20 },
  hudContainer: { width: '100%', backgroundColor: '#0d1b2a', borderRadius: 12, padding: 16, alignItems: 'center' },
  hudTitle: { color: 'white', fontSize: 44, fontWeight: 'bold', marginBottom: 10 },
  hudRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  hudItem: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 },
});
