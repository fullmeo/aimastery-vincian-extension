// ===== REAPER CONTROLLER MOBILE APP =====
// React Native App pour contrôler Reaper

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Slider } from '@react-native-community/slider';
import io from 'socket.io-client';

// INSTALLATION REQUISE:
/*
npm install react-native
npm install @react-native-community/slider
npm install socket.io-client react-native-vector-icons
npm install react-native-haptic-feedback
*/

interface Track {
  id: number;
  name: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  selected: boolean;
}

interface ReaperState {
  playing: boolean;
  recording: boolean;
  position: number;
  tempo: number;
  tracks: Track[];
}

const ReaperController: React.FC = () => {
  // 🔌 CONNEXION WEBSOCKET
  const [socket, setSocket] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [serverIP, setServerIP] = useState('192.168.1.100'); // IP du PC Reaper

  // 🎛️ ÉTAT REAPER
  const [reaperState, setReaperState] = useState<ReaperState>({
    playing: false,
    recording: false,
    position: 0,
    tempo: 120,
    tracks: [
      { id: 1, name: 'Track 1', volume: 0.8, muted: false, solo: false, selected: false },
      { id: 2, name: 'Track 2', volume: 0.6, muted: false, solo: false, selected: false },
      { id: 3, name: 'Track 3', volume: 0.7, muted: true, solo: false, selected: false },
      { id: 4, name: 'Track 4', volume: 0.9, muted: false, solo: false, selected: false },
    ]
  });

  // ✨ VINCIAN ANALYSIS (intégration AIMastery)
  const [vincianData, setVincianData] = useState<any>(null);

  // 🔗 CONNEXION AU SERVEUR
  useEffect(() => {
    const newSocket = io(`http://${serverIP}:3000`);
    
    newSocket.on('connect', () => {
      console.log('📱 Connected to Reaper Bridge');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('📱 Disconnected from Reaper Bridge');
      setConnected(false);
    });

    newSocket.on('reaper-update', (data) => {
      console.log('📨 Reaper update:', data);
      // Mettre à jour l'état local
      handleReaperUpdate(data);
    });

    newSocket.on('vincian-update', (data) => {
      console.log('✨ Vincian update:', data);
      setVincianData(data);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [serverIP]);

  // 📡 ENVOYER COMMANDE À REAPER
  const sendCommand = (command: string, params: any = {}) => {
    if (socket && connected) {
      socket.emit('reaper-command', { command, params });
      
      // Haptic feedback
      // HapticFeedback.trigger('impactLight');
    } else {
      Alert.alert('❌ Non connecté', 'Veuillez vous connecter au serveur Reaper');
    }
  };

  // 🎛️ TRAITEMENT MISES À JOUR REAPER
  const handleReaperUpdate = (data: any) => {
    // Parser les messages OSC de Reaper et mettre à jour l'interface
    if (data.address === '/play') {
      setReaperState(prev => ({ ...prev, playing: data.args[0] === 1 }));
    }
    // Ajouter d'autres cas selon les messages OSC
  };

  // 🎮 CONTRÔLES TRANSPORT
  const TransportControls = () => (
    <View style={styles.transportContainer}>
      <TouchableOpacity 
        style={[styles.transportButton, reaperState.recording && styles.recording]}
        onPress={() => sendCommand('record')}
      >
        <Text style={styles.transportText}>●</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.transportButton, reaperState.playing && styles.playing]}
        onPress={() => sendCommand('play')}
      >
        <Text style={styles.transportText}>▶</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.transportButton}
        onPress={() => sendCommand('stop')}
      >
        <Text style={styles.transportText}>■</Text>
      </TouchableOpacity>
    </View>
  );

  // 🎚️ MIXER TRACKS
  const TrackMixer = () => (
    <ScrollView horizontal style={styles.mixerContainer}>
      {reaperState.tracks.map(track => (
        <View key={track.id} style={styles.trackStrip}>
          {/* Nom de la track */}
          <Text style={styles.trackName}>{track.name}</Text>
          
          {/* Fader de volume */}
          <View style={styles.faderContainer}>
            <Slider
              style={styles.volumeFader}
              minimumValue={0}
              maximumValue={1}
              value={track.volume}
              orientation="vertical"
              onValueChange={(value) => {
                sendCommand('volume', { track: track.id, volume: value });
                // Mise à jour locale immédiate
                setReaperState(prev => ({
                  ...prev,
                  tracks: prev.tracks.map(t => 
                    t.id === track.id ? { ...t, volume: value } : t
                  )
                }));
              }}
              minimumTrackTintColor="#ff6b35"
              maximumTrackTintColor="#333"
              thumbStyle={{ backgroundColor: '#ffd700' }}
            />
            <Text style={styles.volumeValue}>{Math.round(track.volume * 100)}</Text>
          </View>
          
          {/* Boutons Mute/Solo */}
          <TouchableOpacity 
            style={[styles.muteButton, track.muted && styles.muted]}
            onPress={() => sendCommand('mute', { track: track.id, mute: !track.muted })}
          >
            <Text style={styles.buttonText}>M</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.soloButton, track.solo && styles.soloed]}
            onPress={() => sendCommand('solo', { track: track.id, solo: !track.solo })}
          >
            <Text style={styles.buttonText}>S</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  // ✨ VINCIAN CONTROLS (intégration AIMastery)
  const VincianControls = () => (
    <View style={styles.vincianContainer}>
      <Text style={styles.sectionTitle}>✨ Vincian Analysis</Text>
      
      {vincianData && (
        <View style={styles.vincianData}>
          <Text style={styles.vincianText}>
            Code Health: {Math.round(vincianData.codeHealthScore * 100)}%
          </Text>
          <Text style={styles.vincianText}>
            Patterns: {vincianData.audioPatterns?.length || 0}
          </Text>
          <Text style={styles.vincianText}>
            Tempo Adapté: {vincianData.adaptedTempo || reaperState.tempo} BPM
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.vincianButton}
        onPress={() => {
          // Simuler des données Vincian (en attendant l'intégration VS Code)
          const mockVincianData = {
            codeHealthScore: Math.random(),
            audioPatterns: [
              { name: 'async/await', frequency: 5 },
              { name: 'error handling', frequency: 3 }
            ],
            adaptedTempo: Math.floor(120 + Math.random() * 40)
          };
          socket.emit('vincian-analysis', mockVincianData);
        }}
      >
        <Text style={styles.vincianButtonText}>🧬 Analyser Code → Audio</Text>
      </TouchableOpacity>
    </View>
  );

  // 📊 STATUS BAR
  const StatusBar = () => (
    <View style={styles.statusContainer}>
      <View style={[styles.connectionStatus, { backgroundColor: connected ? '#00ff88' : '#ff6b35' }]}>
        <Text style={styles.statusText}>
          {connected ? '🟢 Connecté' : '🔴 Déconnecté'}
        </Text>
      </View>
      <Text style={styles.statusText}>Tempo: {reaperState.tempo} BPM</Text>
      <Text style={styles.statusText}>Position: {Math.floor(reaperState.position)}s</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1a1a2e" barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.title}>🎛️ AIMastery Reaper Control</Text>
        <StatusBar />
      </View>

      <ScrollView style={styles.content}>
        <TransportControls />
        <TrackMixer />
        <VincianControls />
      </ScrollView>
    </SafeAreaView>
  );
};

// 🎨 STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd700',
    textAlign: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  
  // Transport Controls
  transportContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 20,
  },
  transportButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  playing: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  recording: {
    backgroundColor: '#ff6b35',
    borderColor: '#ff6b35',
  },
  transportText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Mixer
  mixerContainer: {
    marginBottom: 30,
  },
  trackStrip: {
    width: 80,
    marginRight: 10,
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  trackName: {
    color: '#ffd700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  faderContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeFader: {
    width: 30,
    height: 180,
    transform: [{ rotate: '-90deg' }],
  },
  volumeValue: {
    color: 'white',
    fontSize: 10,
    marginTop: 10,
  },
  muteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  muted: {
    backgroundColor: '#ff6b35',
  },
  soloButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  soloed: {
    backgroundColor: '#00ff88',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Vincian Controls
  vincianContainer: {
    backgroundColor: '#16213e',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700',
    textAlign: 'center',
    marginBottom: 15,
  },
  vincianData: {
    marginBottom: 15,
  },
  vincianText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 5,
  },
  vincianButton: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  vincianButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Status
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionStatus: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
  },
});

export default ReaperController;