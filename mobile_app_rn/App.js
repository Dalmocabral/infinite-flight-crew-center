import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';
import Login from './src/components/Login';
import Dashboard from './src/components/Dashboard';

export default function App() {
  const [session, setSession] = useState(null);

  const handleLoginSuccess = (userSession) => {
    setSession(userSession);
  };

  const handleLogout = () => {
    setSession(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {session ? (
        <Dashboard session={session} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060d18',
  },
});
