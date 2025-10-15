# CEBRIC

**F1 Telemetry Analysis Platform**

A full-stack web application for analyzing Formula 1 telemetry data in real-time. Visualize lap times, compare driver performance, and examine detailed telemetry metrics across different racing sessions.

## Features

- 📊 Real-time F1 lap time analysis and visualization
- 🏎️ Detailed telemetry data (speed, throttle, brake, DRS, gear, RPM)
- 👥 Multi-driver comparison with interactive charts
- 📈 Top speed and speed trap analysis
- 🎯 Sector-by-sector performance breakdown
- 🔄 Driver lap time comparison with sector analysis
- 🛞 **NEW:** Tire degradation analysis per stint
- ⚡ **NEW:** Race pace comparison between drivers
- 🏁 **NEW:** Corner-by-corner speed analysis
- ⚙️ **NEW:** Gear usage distribution analysis
- ⛽ **NEW:** Fuel effect estimation on lap times
- 📱 Responsive design for all devices
- 🎨 F1-themed dark mode interface

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite (Build tool)
- TailwindCSS (Styling)
- Chart.js (Data visualization)
- TanStack Query (State management)
- Wouter (Routing)
- shadcn/ui (UI components)

### Backend
- Node.js with Express
- TypeScript
- In-memory data storage
- FastF1 Python library

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 20 or higher
- Python 3.11 or higher

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <project-directory>
```

### 2. Install Dependencies

The project uses both Node.js and Python dependencies:

```bash
# Install Node.js dependencies
npm install

# Python dependencies are managed via uv and will be installed automatically
```

### 3. Create Cache Directory

The FastF1 library uses local caching to improve performance:

```bash
mkdir -p fastf1_cache
```

## Running the Application

### Development Mode

Start the development server with hot module reloading:

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### Production Build

Build and run the production version:

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Deployment Options

### Running on Local Network (Access via IP Address)

To make the application accessible from other devices on your local network:

#### Option 1: Using Your Local IP Address

1. Find your local IP address:
   ```bash
   # On Linux/Mac
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # On Windows
   ipconfig | findstr IPv4
   ```

2. The server is already configured to bind to `0.0.0.0:5000`, which means it accepts connections from any network interface.

3. Start the application:
   ```bash
   npm run dev
   ```

4. Access from other devices on your network:
   ```
   http://YOUR_LOCAL_IP:5000
   ```
   Example: `http://192.168.1.100:5000`

#### Option 2: Configure Firewall (if needed)

If you can't access the application from other devices, you may need to allow the port through your firewall:

**On Ubuntu/Linux:**
```bash
sudo ufw allow 5000/tcp
sudo ufw reload
```

**On Windows:**
```powershell
netsh advfirewall firewall add rule name="CEBRIC F1 App" dir=in action=allow protocol=TCP localport=5000
```

**On macOS:**
```bash
# macOS firewall typically allows outgoing connections by default
# If needed, go to System Preferences > Security & Privacy > Firewall > Firewall Options
```

### Running on Custom Domain

To run the application with a custom domain:

#### Option 1: Using Replit Deployment

1. Click the "Publish" button in Replit
2. Your app will be deployed to a `.replit.app` subdomain
3. Configure a custom domain:
   - Go to your Repl settings
   - Navigate to "Domains" section
   - Add your custom domain
   - Update your DNS records with the provided CNAME

#### Option 2: Using Reverse Proxy (Nginx)

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Create Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/cebric
   ```

3. Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/cebric /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. Configure your domain's DNS:
   - Add an A record pointing to your server's IP address
   - Or add a CNAME record pointing to your server hostname

6. (Optional) Add SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

#### Option 3: Using Environment Variables for Custom Port

If you need to run on a different port:

1. Create a `.env` file:
   ```bash
   PORT=8080
   ```

2. Update `server/index.ts` to use environment variable:
   ```typescript
   const PORT = process.env.PORT || 5000;
   ```

3. Start the application:
   ```bash
   npm run dev
   ```

### Running with HTTPS (SSL/TLS)

For production deployments with HTTPS:

#### Using Let's Encrypt (Recommended for Production)

1. Install Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtain SSL certificate:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

3. Auto-renewal is configured automatically. Test with:
   ```bash
   sudo certbot renew --dry-run
   ```

#### Using Self-Signed Certificate (Development Only)

1. Generate self-signed certificate:
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

2. Update server to use HTTPS (requires code modification)

### Running as a Service (Production)

To keep the application running in the background:

#### Using PM2 (Recommended)

1. Install PM2:
   ```bash
   npm install -g pm2
   ```

2. Start the application:
   ```bash
   pm2 start npm --name "cebric-f1" -- start
   ```

3. Configure PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

4. Useful PM2 commands:
   ```bash
   pm2 status              # Check status
   pm2 logs cebric-f1      # View logs
   pm2 restart cebric-f1   # Restart app
   pm2 stop cebric-f1      # Stop app
   pm2 delete cebric-f1    # Remove from PM2
   ```

#### Using systemd (Linux)

1. Create service file:
   ```bash
   sudo nano /etc/systemd/system/cebric.service
   ```

2. Add configuration:
   ```ini
   [Unit]
   Description=CEBRIC F1 Telemetry Analysis
   After=network.target

   [Service]
   Type=simple
   User=youruser
   WorkingDirectory=/path/to/cebric
   ExecStart=/usr/bin/npm start
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable cebric
   sudo systemctl start cebric
   sudo systemctl status cebric
   ```

### Docker Deployment (Advanced)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

# Install Python
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pyproject.toml ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t cebric-f1 .
docker run -p 5000:5000 cebric-f1
```

## Project Structure

```
.
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
│   └── index.html
├── server/                # Backend Express server
│   ├── services/          # Business logic
│   ├── index.ts           # Server entry point
│   └── routes.ts          # API routes
├── python/                # Python scripts for F1 data
│   └── f1_data_fetcher.py
├── shared/                # Shared TypeScript types
│   └── schema.ts
└── fastf1_cache/         # FastF1 data cache directory
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Type check with TypeScript

## API Endpoints

### Get Available Years
```
GET /api/f1/years
```

### Get Grand Prix Events
```
GET /api/f1/gps/:year
```

### Get Session Types
```
GET /api/f1/sessions
```

### Get Session Data
```
GET /api/f1/session?year=2024&gp=Bahrain&session=Race&drivers=VER,HAM
```

### Get Telemetry Data
```
GET /api/f1/telemetry?year=2024&gp=Bahrain&session=Race&driver1=VER&lap1=10&driver2=HAM&lap2=10
```

### Get Tire Degradation Analysis
```
GET /api/f1/tire-degradation?year=2024&gp=Bahrain&session=Race&driver=VER
```

### Get Race Pace Comparison
```
GET /api/f1/race-pace?year=2024&gp=Bahrain&session=Race&drivers=VER,HAM,LEC
```

### Get Corner Analysis
```
GET /api/f1/corner-analysis?year=2024&gp=Bahrain&session=Qualifying&driver=VER&lap=10
```

### Get Gear Usage Analysis
```
GET /api/f1/gear-usage?year=2024&gp=Bahrain&session=Race&driver=VER&lap=15
```

### Get Fuel Effect Analysis
```
GET /api/f1/fuel-effect?year=2024&gp=Bahrain&session=Race&driver=VER
```

## Usage Guide

1. **Select Year**: Choose a season from 2018-2025
2. **Select Grand Prix**: Pick a race event
3. **Select Session**: Choose Practice, Qualifying, Sprint, or Race
4. **Select Drivers**: Pick one or more drivers to analyze
5. **View Lap Times**: See lap-by-lap performance in the chart
6. **Compare Telemetry**: Select laps to view detailed telemetry comparison
7. **Analyze Sectors**: Compare sector times between drivers

## Features in Detail

### Lap Time Analysis
- Interactive chart showing all laps for selected drivers
- Color-coded by tire compound
- Hover to see detailed lap information

### Telemetry Comparison
- Speed, throttle, brake, and gear analysis
- Distance-based alignment for accurate comparison
- DRS usage visualization
- RPM tracking

### Statistics Dashboard
- Fastest lap time
- Top speed achieved
- Average lap time
- Total laps completed

### Driver Comparison
- Side-by-side lap time comparison
- Sector-by-sector breakdown
- Performance delta visualization

## Troubleshooting

### Issue: Python cache errors
**Solution**: Make sure the `fastf1_cache` directory exists and has write permissions.

### Issue: Missing data for recent races
**Solution**: FastF1 data may not be immediately available. Try waiting a few hours after the race.

### Issue: Slow data loading
**Solution**: The first load of session data takes time. Subsequent loads use the cache and are much faster.

## Data Source

This application uses the [FastF1 Python library](https://github.com/theOehrly/Fast-F1) to fetch official F1 timing data from the FIA. Data is available for seasons 2018 onwards.

## Security Considerations

When deploying to production:

1. **Environment Variables**: Store sensitive configuration in environment variables
2. **HTTPS**: Always use HTTPS in production (via Nginx + Let's Encrypt)
3. **Firewall**: Configure firewall to allow only necessary ports
4. **Rate Limiting**: Consider adding rate limiting to API endpoints
5. **CORS**: Configure CORS properly if accessing from different domains
6. **Updates**: Keep dependencies updated regularly

## Performance Optimization

1. **Caching**: FastF1 cache directory improves subsequent data loads
2. **Production Build**: Always use production build for deployment (`npm run build && npm start`)
3. **Reverse Proxy**: Use Nginx for better performance and load balancing
4. **CDN**: Consider using a CDN for static assets
5. **Database**: For high-traffic scenarios, consider adding PostgreSQL database support

## Credits

**Designed by**: Artin Zomorodian & Hani Bikdeli  
**Design Group**: DeepInk Team  
**Powered by**: FastF1 Library & Replit  
**Data Source**: FastF1 Library (Official FIA F1 Timing Data)

## License

MIT

## Support

For issues and questions:
- 📱 Telegram: [Join our community](https://t.me/f1analytics)
- 💬 Discord: [Join our server](https://discord.gg/f1analytics)
- 📧 Instagram: [@f1analytics](https://instagram.com/f1analytics)

---

Built with ❤️ for F1 fans and data enthusiasts
