const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const apiRouter = require('./routes/api');
const { xssSanitizer, requestLogger } = require('./middleware/securityMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Security: Helmet configurations
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "*"],
      connectSrc: ["'self'", "*"],
      upgradeInsecureRequests: null
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
app.use(cors({
  origin: true, // Allow all origins for simplicity, or restrict in production
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Standard Body Parsers
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Custom Cookie Parser middleware
app.use((req, res, next) => {
  const cookieHeader = req.headers.cookie;
  req.cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...valParts] = cookie.split('=');
      if (name) {
        req.cookies[name.trim()] = decodeURIComponent(valParts.join('=') || '').trim();
      }
    });
  }
  next();
});

// XSS Sanitizer & Audit Request Loggers
app.use(xssSanitizer);
app.use(requestLogger);

// Static uploads serving
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// API router
app.use('/api', apiRouter);

// Serve Admin Dashboard (React application build)
const ADMIN_DIST = path.join(__dirname, '../admin/dist');
if (fs.existsSync(ADMIN_DIST)) {
  app.use('/admin', express.static(ADMIN_DIST));
  // Single Page App fallback routing for admin dashboard
  app.get(['/admin', '/admin/*'], (req, res) => {
    res.sendFile(path.join(ADMIN_DIST, 'index.html'));
  });
} else {
  // If not built yet, output placeholder
  app.get(['/admin', '/admin/*'], (req, res) => {
    res.status(200).send(`
      <div style="font-family:sans-serif; text-align:center; padding:100px 20px; background:#f0f9ff; color:#0369a1; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <h1>Admin Dashboard Under Construction</h1>
        <p>The React dashboard is being compiled. Please run <code>npm run build:admin</code> from the root folder to compile the dashboard.</p>
        <a href="/" style="color:#0284c7; font-weight:bold; margin-top:20px; text-decoration:none;">Go back to homepage</a>
      </div>
    `);
  });
}

// Serve Public Landing Page Website (from public/)
const PUBLIC_DIR = path.join(__dirname, '../public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

// Fallback error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Internal Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let lanIp = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { lanIp = net.address; break; }
    }
  }
  console.log(`Bapupura Sanskar Bhavan Server running on port ${PORT}`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${lanIp}:${PORT}`);
  console.log(`  Admin:   http://${lanIp}:${PORT}/admin`);
});
