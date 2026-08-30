import { useState } from 'react';
import { useRoomStore } from '../store/UseRoomStore';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import SocketService from '../services/socket';
import socket from '../services/socket';

const API_URL = process.env.API_URL;
export const HomeScreen = ({ navigation }: any) => {
  const [targetUrl, setTargetUrl] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const setRoomData = useRoomStore(state => state.setRoomData);

  const handleCreateRoom = async () => {
    if (!targetUrl) {
      Alert.alert('hata', 'geçerli bir link deneyin');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/scrape`, {
        url: targetUrl,
      });
      const { headers, streamUrl } = response.data;
      SocketService.connect();

      SocketService.socket?.emit(
        'create_room',
        { streamUrl, headers },
        (res: { success: boolean; roomId: string }) => {
          setLoading(true);
          if (res.success) {
            setRoomData({
              roomId: res.roomId,
              streamUrl: streamUrl,
              isHost: true,
              headers,
            });
            navigation.navigate('Room');
          } else {
            Alert.alert('hata', 'oda oluşturulamadı');
          }
        },
      );
    } catch (error) {
      setLoading(false);
      Alert.alert('Hata', 'Film kaynağı çekilemedi. Linki kontrol edin.');
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode) {
      Alert.alert('hata', 'oda kodunu yanlış gitdin');
      return;
    }
    setLoading(true);
    SocketService.connect();
    SocketService.socket?.emit(
      'join_room',
      { roomId: joinCode.toUpperCase() },
      (res: { success: boolean; room: any; messages?: string }) => {
        setLoading(false);
        if (res.success && res.room) {
          setRoomData({
            roomId: joinCode.toUpperCase(),
            streamUrl: res.room.streamUrl,
            headers: res.room.headers,
            isHost: false,
          });
          navigation.navigate('Room');
        } else {
          Alert.alert('hata', 'oda giriş yapılamadı');
        }
      },
    );
  };

  return (
    <View style={Styles.container}>
      <Text style={Styles.title}>CineDate 🍿</Text>

      <View style={Styles.card}>
        <Text style={Styles.cardTitle}>Filim Seansı başlat</Text>
        <TextInput
          style={Styles.inpurt}
          placeholder="6 Haneli Oda Kodu (Örn: X8A92M)"
          placeholderTextColor="#888"
          maxLength={6}
          value={joinCode}
          onChangeText={setJoinCode}
        ></TextInput>
        <TouchableOpacity
          style={Styles.button}
          onPress={handleCreateRoom}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={Styles.buttonText}>Oda Oluştur</Text>
          )}
        </TouchableOpacity>
      </View>
      <Text style={Styles.divider}>— VEYA —</Text>

      {/* Odaya Katıl Bölümü */}
      <View style={Styles.card}>
        <Text style={Styles.cardTitle}>Odaya Katıl</Text>
        <TextInput
          style={Styles.inpurt}
          placeholder="6 Haneli Oda Kodu (Örn: X8A92M)"
          placeholderTextColor="#888"
          value={joinCode}
          onChangeText={setJoinCode}
          autoCapitalize="characters"
          maxLength={6}
        />
        <TouchableOpacity
          style={[Styles.button, Styles.joinButton]}
          onPress={handleJoinRoom}
          disabled={loading}
        >
          <Text style={Styles.buttonText}>Odaya Katıl</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    alignItems: 'center',
    color: '#E50914',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  inpurt: {
    backgroundColor: '#2c2c2c',
    color: '#fff',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
  },
  button: {
    backgroundColor: '#E50914',
    color: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButton: { backgroundColor: '#2E7D32' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  divider: {
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
  },
});
