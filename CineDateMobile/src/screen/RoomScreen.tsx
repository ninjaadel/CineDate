import { useEffect, useRef } from 'react';
import Video, { VideoRef } from 'react-native-video';
import { useRoomStore } from '../store/UseRoomStore';
import SocketService from '../services/socket';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export const RoomScreen = ({ navigation }: any) => {
  const videoRef = useRef<VideoRef>(null);

  //zustand video
  const { roomId, headers, streamUrl, setPlayerState, isPlaying, currentTime } =
    useRoomStore();

  // Socket'ten gelen zaman eşitlemesi durumunda videoyu ilgili saniyeye sar
  // ✅ DOĞRU KULLANIM:
  useEffect(() => {
    if (videoRef.current && currentTime !== undefined) {
      videoRef.current.seek(currentTime);
    }
  }, [currentTime]);

  const togglePlayPouse = () => {
    const newPlayState = !isPlaying;
    setPlayerState(newPlayState, currentTime);

    // Sinyali Socket üzerinden karşı tarafa gönder
    SocketService.emitPlayerAction(
      newPlayState ? 'PLAY' : 'PAUSE',
      currentTime,
    );
  };

  const handleSeek = (newTime: number) => {
    setPlayerState(isPlaying, newTime);
    SocketService.emitPlayerAction('SEEK', newTime);
  };

  return (
    <View style={style.container}>
      <Text style={style.headerTitle}> oda kodu: {roomId}</Text>

      {streamUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: streamUrl, headers: headers || {} }}
          paused={!isPlaying}
          onSeek={seek => handleSeek(seek.currentTime)}
          style={style.videoStyle}
          controls={true}
          resizeMode="contain"
        ></Video>
      ) : (
        <View style={style.videoError}>
          <Text style={style.errorText}>Video Bulunamadı</Text>
        </View>
      )}

      {/* //manuel kontol pause/play */}
      <View style={style.controls}>
        <TouchableOpacity style={style.controlsButton}>
          <Text style={style.buttonText}>
            {isPlaying ? 'Durdur ⏸' : 'Oynat ▶'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const style = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    paddingVertical: 20,
    backgroundColor: '#1e1e1e',
  },
  videoStyle: { width: '100%', height: 260 },
  videoError: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  errorText: { color: '#fff' },
  controls: { flexDirection: 'row', justifyContent: 'center', padding: 20 },
  controlsButton: {
    backgroundColor: '#E50914',
    paddingVertical: 24,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonText: { color: '#fff' },
});
