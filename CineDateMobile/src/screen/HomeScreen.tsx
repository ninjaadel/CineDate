import { useState } from 'react';
import { useRoomStore } from '../store/UseRoomStore';
import { Alert, View } from 'react-native';
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

  return <View></View>;
};
