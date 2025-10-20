// src/api/storageApi.ts

export function getParticipantTimes(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem('participantTimes') || '{}');
  } catch {
    return {};
  }
}

export function setParticipantTimes(times: Record<string, any>) {
  localStorage.setItem('participantTimes', JSON.stringify(times));
}

export function getParticipantStatus(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem('participantStatus') || '{}');
  } catch {
    return {};
  }
}

export function setParticipantStatus(status: Record<string, any>) {
  localStorage.setItem('participantStatus', JSON.stringify(status));
}

// Utility for clearing all registration data (optional)
export function clearAllRegistrationData() {
  localStorage.removeItem('participantTimes');
  localStorage.removeItem('participantStatus');
}

// Admin/stage helpers
export function getAdminStages(): Array<{ name: string; ideal: string } | null> | null {
  try {
    return JSON.parse(localStorage.getItem('adminStages') || 'null');
  } catch {
    return null;
  }
}

export function setAdminStages(stages: Array<{ name: string; ideal: string }>) {
  localStorage.setItem('adminStages', JSON.stringify(stages));
}

export function getCustomStages(): string[] | null {
  try {
    return JSON.parse(localStorage.getItem('customStages') || 'null');
  } catch {
    return null;
  }
}

export function setCustomStages(stages: string[]) {
  localStorage.setItem('customStages', JSON.stringify(stages));
}
