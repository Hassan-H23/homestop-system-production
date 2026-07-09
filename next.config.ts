import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.6",
    "187.77.74.10",
    "700d-41-46-253-149.ngrok-free.app",
    "0143-41-46-253-149.ngrok-free.app",
    "59ad-41-46-253-149.ngrok-free.app",
    "83d2-41-46-253-149.ngrok-free.app",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};

export default nextConfig;
