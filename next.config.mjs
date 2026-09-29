import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const isDev=process.env.NODE_ENV!=="production";

const csp=[
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev?" 'unsafe-eval'":""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.blob.core.windows.net",
  "font-src 'self' data:",
  "connect-src 'self' https://api.stripe.com https://*.applicationinsights.azure.com https://*.monitor.azure.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
].join("; ");

const securityHeaders=[
  {key:"Content-Security-Policy",value:csp},
  {key:"Strict-Transport-Security",value:"max-age=63072000; includeSubDomains; preload"},
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"X-Frame-Options",value:"DENY"},
  {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
  {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=(), payment=(self)"},
  {key:"Cross-Origin-Opener-Policy",value:"same-origin"},
  {key:"Cross-Origin-Resource-Policy",value:"same-origin"}
];

/** @type {import('next').NextConfig} */
const nextConfig={
  reactStrictMode:true,
  output:"standalone",
  poweredByHeader:false,
  typedRoutes:false,
  turbopack:{root:__dirname},
  compress:true,
  async headers(){
    return [
      {source:"/:path*",headers:securityHeaders},
      {source:"/api/:path*",headers:[{key:"Cache-Control",value:"no-store"}]}
    ];
  }
};

export default nextConfig;
