const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const mongoose = require('mongoose');

// Load .env file variables into process.env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) process.env[key] = val;
      }
    });
  } catch (e) {
    console.warn("Could not read .env file:", e);
  }
}

const defaultPort = Number(process.env.PORT || 3000);
const rootDir = __dirname;
const dataFile = path.join(rootDir, 'portfolio-data.json');

// MongoDB Schema & Model
const portfolioSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  data: { type: Object, default: {} }
}, { timestamps: true });

const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);

const MONGODB_URI = process.env.MONGODB_URI;

// Reuse MongoDB connection across Vercel serverless invocations
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) return null;

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    throw err;
  }
}

async function getPortfolioFromDb() {
  if (MONGODB_URI) {
    try {
      await connectDB();
      const doc = await Portfolio.findOne({ key: 'main' });
      if (doc && doc.data && Object.keys(doc.data).length > 0) {
        return doc.data;
      }
    } catch (err) {
      console.error('Error fetching from MongoDB:', err.message);
    }
  }

  return readData();
}

async function savePortfolioToDb(data) {
  if (MONGODB_URI) {
    try {
      await connectDB();
      await Portfolio.findOneAndUpdate(
        { key: 'main' },
        { data: data },
        { upsert: true, new: true }
      );
      if (!process.env.VERCEL) {
        writeData(data);
      }
      return { success: true, storage: 'mongodb' };
    } catch (err) {
      console.error('Error saving to MongoDB:', err.message);
      if (!process.env.VERCEL) {
        writeData(data);
        return { success: true, storage: 'file' };
      }
      return { success: false, message: err.message };
    }
  }

  writeData(data);
  return { success: true, storage: 'file' };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  });
  res.end(JSON.stringify(payload));
}

function readData() {
  try {
    if (!fs.existsSync(dataFile)) {
      return {};
    }
    const raw = fs.readFileSync(dataFile, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('Failed to read data file:', error);
    return {};
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to write data file:', error);
    return false;
  }
}

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function createHandler() {
  return async (req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;

    if (pathname === '/firebase-config.js') {
      const configJs = `// Dynamic Firebase Configuration generated from environment variables
const firebaseConfig = {
    apiKey: ${JSON.stringify(process.env.FIREBASE_API_KEY || "YOUR_API_KEY")},
    authDomain: ${JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com")},
    projectId: ${JSON.stringify(process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID")},
    storageBucket: ${JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.firebasestorage.app")},
    messagingSenderId: ${JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID")},
    appId: ${JSON.stringify(process.env.FIREBASE_APP_ID || "YOUR_APP_ID")},
    measurementId: ${JSON.stringify(process.env.FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID")}
};

if (typeof firebase !== 'undefined' && !firebase.apps.length && firebaseConfig.apiKey) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error("Firebase initializeApp error:", e);
    }
}

let auth = null;

try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        auth = firebase.auth();
    }
} catch (e) {
    console.warn("Firebase Auth init fallback:", e);
}
`;
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
      res.end(configJs);
      return;
    }

    if (pathname === '/api/portfolio') {
      if (req.method === 'GET') {
        const data = await getPortfolioFromDb();
        sendJson(res, 200, data);
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const result = await savePortfolioToDb(parsed);
            if (!result.success) {
              sendJson(res, 500, { success: false, message: result.message || 'Failed to save to database' });
              return;
            }
            sendJson(res, 200, { success: true, storage: result.storage });
          } catch (error) {
            sendJson(res, 400, { success: false, message: 'Invalid JSON payload' });
          }
        });
        return;
      }
    }

    if (pathname === '/api/portfolio/reset') {
      if (req.method === 'POST') {
        await savePortfolioToDb({});
        sendJson(res, 200, { success: true });
        return;
      }
    }

    const safePath = pathname === '/' ? '/index.html' : pathname;
    const filePath = path.join(rootDir, safePath);
    const resolvedExtension = path.extname(filePath) || '.html';

    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const contentTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      serveFile(res, filePath, contentTypes[resolvedExtension] || 'application/octet-stream');
      return;
    }

    if (path.extname(pathname) === '') {
      const indexPath = path.join(rootDir, 'index.html');
      serveFile(res, indexPath, 'text/html; charset=utf-8');
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  };
}


function startServer(port) {
  const server = http.createServer(createHandler());

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(error);
      process.exit(1);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

// Export handler for Vercel serverless
module.exports = createHandler();

// Start local dev server when run directly
if (require.main === module) {
  startServer(defaultPort);
}
