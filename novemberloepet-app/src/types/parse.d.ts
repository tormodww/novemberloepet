declare module 'parse' {
  const Parse: {
    initialize: (appId: string, jsKey?: string) => void;
    serverURL: string;
    Object: any;
    Query: any;
    User: any;
    Cloud: any;
    LiveQuery: any;
    // allow index signature for other members
    [key: string]: any;
  };
  export default Parse;
}