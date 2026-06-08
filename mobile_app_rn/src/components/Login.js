import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';

const DEFAULT_BACKEND = 'http://localhost:8000';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    
    try {
      const response = await axios.post(`${DEFAULT_BACKEND}/login/`, {
        email: email,
        password: password,
      }, { timeout: 8000 });
      
      const data = response.data;
      if (data.token) {
        const session = {
          token: data.token,
          username_ifc: data.user?.usernameIFC || data.user?.first_name || 'Piloto',
          full_name: `${data.user?.first_name || ''} ${data.user?.last_name || ''}`.trim(),
        };
        onLoginSuccess(session);
      } else {
        setErrorMsg('Resposta inválida do servidor');
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const body = error.response.data;
        setErrorMsg(body.error || body.non_field_errors?.[0] || 'Credenciais inválidas');
      } else {
        setErrorMsg(`Servidor indisponível: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✈</Text>
      <Text style={styles.title}>IF CREW CENTER</Text>
      <Text style={styles.subtitle}>Virtual Co-Pilot</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor="#ffffff60"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor="#ffffff60"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#060d18" />
          ) : (
            <Text style={styles.buttonText}>ENTRAR</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.divider} />
        <Text style={styles.helperText}>Use as mesmas credenciais do site IF Crew Center</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060d18',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  icon: {
    fontSize: 52,
    color: '#4dabf5',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0d1b2a',
    padding: 20,
    borderRadius: 12,
  },
  input: {
    backgroundColor: '#060d18',
    color: 'white',
    borderWidth: 1,
    borderColor: '#4dabf5',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    fontSize: 14,
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4dabf5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#060d18',
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  helperText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    textAlign: 'center',
  },
});
