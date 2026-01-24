import { OidProfile } from '../../types/snmp.types';
import apcPowernetProfile from './apc-powernet';
import rfc1628Profile from './rfc1628';

const profiles: Record<string, OidProfile> = {
  'apc-powernet': apcPowernetProfile,
  'rfc1628': rfc1628Profile,
};

export function getOidProfile(profileName: string): OidProfile | undefined {
  return profiles[profileName];
}

export function getAllProfiles(): OidProfile[] {
  return Object.values(profiles);
}

export function getProfileNames(): string[] {
  return Object.keys(profiles);
}

export { apcPowernetProfile, rfc1628Profile };
export default profiles;
