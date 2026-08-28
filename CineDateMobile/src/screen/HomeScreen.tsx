import { useState } from 'react';
import { useRoomStore } from '../store/UseRoomStore';
import { Alert } from 'react-native';
import axios from 'axios';
import SocketService from '../services/socket';

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
            navigation.navigate('room');
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
};
