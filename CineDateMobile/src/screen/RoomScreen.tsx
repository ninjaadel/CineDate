import { useEffect, useRef } from 'react';
import Video, { VideoRef } from 'react-native-video';
import { useRoomStore } from '../store/UseRoomStore';
import SocketService from '../services/socket';

export const RoomScreen = ({ navigation }: any) => {
  const videoRef = useRef<VideoRef>(null);

  //zustand video
  const { roomId, headers, streamUrl, setPlayerState, isPlaying, currentTime } =
    useRoomStore();

  // Socket'ten gelen zaman eşitlemesi durumunda videoyu ilgili saniyeye sar
  useEffect(() => {
    if (VideoRef.current && videoRef.current === currentTime) {
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
};
