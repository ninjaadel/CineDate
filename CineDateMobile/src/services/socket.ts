import { io, Socket } from 'socket.io-client';
import { useRoomStore } from '../store/UseRoomStore';

// Emulator için 'http://10.0.2.2:4000', gerçek cihaz/test için bilgisayarınızın yerel IP adresi
const SOCKET_URL = 'http://10.0.2.2:4000';

class SocketService {
  public socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, { transports: ['websocket'] });

      this.socket.on('connect', () => {
        console.log('Socket bağlandı:', this.socket?.id);
      });

      // Backend'den gelen video senkronizasyon sinyallerini dinle
      this.socket.on('player_action', ({ type, time }) => {
        const isPlaying = type === 'PLAY';
        useRoomStore.getState().setPlayerState(isPlaying, time);
      });

      // Odaya ilk girildiğinde durum eşitlemesi
      this.socket.on('sync_initial_state', data => {
        useRoomStore
          .getState()
          .setPlayerState(data.isPlaying, data.currentTime);
      });
    }
  }

  // Socket eylemlerini fırlatan yardımcı fonksiyonlar
  emitPlayerAction(type: 'PLAY' | 'PAUSE' | 'SEEK', time: number) {
    const roomId = useRoomStore.getState().roomId;
    if (this.socket && roomId) {
      this.socket.emit('player_action', { roomId, type, time });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
