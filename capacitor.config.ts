import type { CapacitorConfig } from '@capacitor/cli';
const remote=process.env.CAPACITOR_SERVER_URL;
const config: CapacitorConfig = { appId:'com.ashikelectric.storemanager', appName:'Ashik Electric', webDir:'public', server:{ ...(remote?{url:remote}:{}), androidScheme:'https' } };
export default config;
