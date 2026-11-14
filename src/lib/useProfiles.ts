import { useEffect, useState } from 'react';
import { getJson } from '../data/loader';
import { validateProfiles, type Profile, type ProfileFile } from './profiles';

export interface ProfilesState { list: Profile[] | null; bad: boolean }
let pending: Promise<ProfilesState> | null = null;

/** Load the reviewed profile file once per session; a file that fails its checks is treated as absent (and flagged), never half-shown. */
export function loadProfiles(): Promise<ProfilesState> {
  pending ??= getJson<ProfileFile>('profiles/profiles.json', true)
    .then((f): ProfilesState => (!f || validateProfiles(f).length ? { list: [], bad: !!f } : { list: f.profiles, bad: false }))
    .catch((): ProfilesState => ({ list: [], bad: false }));
  return pending;
}

export function useProfiles(): ProfilesState {
  const [s, setS] = useState<ProfilesState>({ list: null, bad: false });
  useEffect(() => { let live = true; void loadProfiles().then((r) => live && setS(r)); return () => { live = false; }; }, []);
  return s;
}
