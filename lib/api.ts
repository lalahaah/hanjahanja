import { connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

if (__DEV__) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

export interface HanjaInfo {
  char: string;
  sound: string;
  meaning: string;
}

export interface HanjaLookupResponse {
  word: string;
  hanja: HanjaInfo[];
  explanation: string;
}

const hanjaLookupCallable = httpsCallable<{ word: string }, HanjaLookupResponse>(
  functions,
  'hanjaLookup'
);

export async function hanjaLookup(word: string): Promise<HanjaLookupResponse> {
  const result = await hanjaLookupCallable({ word });
  return result.data;
}
