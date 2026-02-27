/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_apiKey: process.env.NEXT_PUBLIC_apiKey || process.env.REACT_APP_apiKey,
    NEXT_PUBLIC_authDomain: process.env.NEXT_PUBLIC_authDomain || process.env.REACT_APP_authDomain,
    NEXT_PUBLIC_databaseURL: process.env.NEXT_PUBLIC_databaseURL || process.env.REACT_APP_databaseURL,
    NEXT_PUBLIC_projectId: process.env.NEXT_PUBLIC_projectId || process.env.REACT_APP_projectId,
    NEXT_PUBLIC_storageBucket: process.env.NEXT_PUBLIC_storageBucket || process.env.REACT_APP_storageBucket,
    NEXT_PUBLIC_messagingSenderId: process.env.NEXT_PUBLIC_messagingSenderId || process.env.REACT_APP_messagingSenderId,
    NEXT_PUBLIC_appId: process.env.NEXT_PUBLIC_appId || process.env.REACT_APP_appId,
    NEXT_PUBLIC_measurementId: process.env.NEXT_PUBLIC_measurementId || process.env.REACT_APP_measurementId,
  },
};

module.exports = nextConfig;
