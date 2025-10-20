declare module './data/participants' {
  const participants: Array<{ id: string; name: string }>;
  export { participants };
}

declare module '../data/participants' {
  const participants: Array<{ id: string; name: string }>;
  export { participants };
}

declare module './data/participants.js' {
  const participants: Array<{ id: string; name: string }>;
  export { participants };
}

declare module '../data/participants.js' {
  const participants: Array<{ id: string; name: string }>;
  export { participants };
}

declare module './data/stages' {
  const stages: string[];
  export { stages };
}

declare module '../data/stages' {
  const stages: string[];
  export { stages };
}

declare module './data/stages.js' {
  const stages: string[];
  export { stages };
}

declare module '../data/stages.js' {
  const stages: string[];
  export { stages };
}

// Fallback for any other JS modules to avoid TS complaints in mixed JS/TS projects
declare module '*.js';
