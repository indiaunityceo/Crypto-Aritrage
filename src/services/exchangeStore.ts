import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CryptoJS from 'crypto-js';

interface ApiKeys {
  apiKey: string;
  apiSecret: string;
}

interface ExchangeState {
  keys: Record<string, ApiKeys>;
  setKeys: (exchange: string, keys: ApiKeys) => void;
  getKeys: (exchange: string) => ApiKeys | null;
}

const ENCRYPTION_KEY = 'arbcore-local-secure-key-v1';

function encrypt(text: string): string {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

function decrypt(ciphertext: string): string {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return '';
  }
}

export const useExchangeStore = create<ExchangeState>()(
  persist(
    (set, get) => ({
      keys: {},
      setKeys: (exchange, keys) => {
        const encryptedKeys = {
          apiKey: encrypt(keys.apiKey),
          apiSecret: encrypt(keys.apiSecret)
        };
        set((state) => ({
          keys: { ...state.keys, [exchange]: encryptedKeys }
        }));
      },
      getKeys: (exchange) => {
        const k = get().keys[exchange];
        if (k && k.apiKey && k.apiSecret) {
          return {
            apiKey: decrypt(k.apiKey),
            apiSecret: decrypt(k.apiSecret)
          };
        }
        return null;
      }
    }),
    {
      name: 'exchange-keys-storage'
    }
  )
);
