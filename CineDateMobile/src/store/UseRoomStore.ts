import { create } from 'zustand';

interface RoomState {
  roomId: string | null;
  streamUrl: string | null;
  headers: Record<string, string>;
  isPlaying: boolean;
  currentTime: number;
  isHost: boolean;
  setRoomData: (data: {
    roomId: string;
    streamUrl?: string;
    headers?: Record<string, string>;
    isHost?: boolean;
  }) => void;
  setPlayerState: (isPlaying: boolean, currentTime: number) => void;
  resetRoom: () => void;
}

export const useRoomStore = create<RoomState>(set => ({
  roomId: null,
  streamUrl: null,
  headers: {},
  isPlaying: false,
  currentTime: 0,
  isHost: false,
  setRoomData: data => set(state => ({ ...state, ...data })),
  setPlayerState: (isPlaying, currentTime) => set({ isPlaying, currentTime }),
  resetRoom: () =>
    set({
      roomId: null,
      streamUrl: null,
      headers: {},
      isPlaying: false,
      currentTime: 0,
      isHost: false,
    }),
}));
