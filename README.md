# 🚗 My Car Companion - NitroStack MCP Server

A comprehensive **Model Context Protocol (MCP) Server** with **OAuth 2.1 authentication** and **Smartcar API integration** for vehicle management, built with **NitroStack**.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 What This Project Does

This MCP server exposes **16 tools** that Claude and other AI assistants can call to:

✅ **Manage Vehicles Locally** - Store, list, and track your vehicles in SQLite  
✅ **Connect to Smartcar API** - OAuth 2.0 integration with vehicle data  
✅ **Real-time Vehicle Data** - Check fuel, battery, location, odometer, tire pressure, oil life  
✅ **Vehicle Control** - Lock/unlock vehicles remotely  
✅ **Secure Authentication** - OAuth 2.1 with optional enforcement  
✅ **Persistent Storage** - SQLite database for historical data  

---

## 📦 What's Included

| Component | Purpose |
|-----------|---------|
| **SmartcarService** | Smartcar API v2.0 integration with OAuth |
| **SQLiteService** | Local database for vehicles, maintenance, fuel logs |
| **VehicleTools** | 16 MCP tools exposed to Claude/OpenAI |
| **OAuthModule** | OAuth 2.1 authentication & authorization |
| **DuffelService** | Flight booking API (bonus) |

---

## 🚀 Quick Start

### 1️⃣ Prerequisites

```bash
✓ Node.js 16+
✓ npm or yarn
✓ Smartcar developer account (free at https://developer.smartcar.com)
✓ Auth0 account (optional, for OAuth)
```

### 2️⃣ Clone & Setup

```bash
git clone https://github.com/Darshana2510/my_car_companion.git
cd my_car_companion
cp .env.example .env
```

### 3️⃣ Configure `.env`

```dotenv
SMARTCAR_MODE=sandbox
SMARTCAR_CLIENT_ID=your-client-id
SMARTCAR_CLIENT_SECRET=your-client-secret
SMARTCAR_REDIRECT_URI=http://localhost:3000/oauth/smartcar/callback
```

### 4️⃣ Install & Run

```bash
npm install
npm run dev
```

### 5️⃣ Connect to Claude

- Use OpenAI Apps SDK
- Or NitroStack Studio at https://studio.nitrostack.io
- Start asking questions about your car!

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[QUICKSTART.md](./QUICKSTART.md)** | 📖 Complete setup & 12 test scenarios |
| **[ARCHITECTURE_GUIDE.md](./ARCHITECTURE_GUIDE.md)** | 🏗️ How the MCP server works internally |
| **[SMARTCAR_INTEGRATION.md](./SMARTCAR_INTEGRATION.md)** | 🔌 Smartcar API setup & authentication |
| **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** | 📋 10 real-world usage examples |

---

## 💬 Example Conversations with Claude

### Scenario 1: Connect Your Car
```
You:     "Connect my car to this app"
Claude:  "Here's your Smartcar authorization URL: https://sandbox..."
You:     "Done, code is SmartcarAuthCode_xyz123"
Claude:  "✅ Connected! You have 2 vehicles. What would you like to know?"
```

### Scenario 2: Check Vehicle Status
```
You:     "What's the fuel level in my Camry?"
Claude:  "⛽ 75% full (11.25 / 15 gallons) - Range: ~375 miles"
You:     "Where is it parked?"
Claude:  "📍 San Francisco, CA (37.7749, -122.4194)"
You:     "Check the tire pressure"
Claude:  "🛞 All tires: 30-32 PSI ✅"
```

### Scenario 3: Vehicle Control
```
You:     "Lock my Tesla"
Claude:  "🔒 Your Tesla is now locked"
You:     "What's the battery level?"
Claude:  "🔋 87% charged - Range: 285 miles"
```

---

## 🔧 Available Tools

### Local Database Tools
- **add_vehicle** - Store a vehicle in your garage
- **list_vehicles** - View all your vehicles

### Smartcar OAuth Tools
- **get_smartcar_auth_url** - Generate authorization link
- **exchange_smartcar_code** - Exchange code for access token

### Vehicle Data Tools
- **get_smartcar_vehicles** - List connected Smartcar vehicles
- **get_smartcar_vehicle_info** - Get vehicle make/model/year
- **get_vehicle_fuel** - Check fuel level & capacity
- **get_vehicle_battery** - Check battery (EVs)
- **get_vehicle_location** - Get GPS coordinates
- **get_vehicle_odometer** - Get mileage
- **get_vehicle_engine_oil** - Check oil life %
- **get_vehicle_tire_pressure** - Get all 4 tire pressures

### Vehicle Control Tools
- **lock_vehicle** - Lock the vehicle
- **unlock_vehicle** - Unlock the vehicle

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────┐
│ Claude / OpenAI Apps SDK             │
└────────────────┬────────────────────┘
                 │ (HTTP/SSE)
        ┌────────▼─────────┐
        │  NitroStack Core │
        │  (MCP Protocol)  │
        └────────┬─────────┘
                 │
    ┌────────────┴────────────┐
    ▼                         ▼
┌──────────────┐    ┌─────────────────┐
│ VehicleTools │    │   Services      │
│ (16 tools)   │    ├─────────────────┤
│              │    │ SmartcarService │
│              │    │ SQLiteService   │
│              │    │ DuffelService   │
└──────┬───────┘    └────────┬────────┘
       │                     │
       └─────────┬───────────┘
                 ▼
        ┌────────────────┐
        │  Local SQLite  │
        │  + Smartcar API│
        └────────────────┘
```

---

## 🔐 Security Features

✅ **OAuth 2.1 Authentication** - Industry standard  
✅ **Token Validation** - JWKS signature verification  
✅ **User Isolation** - Each user sees only their vehicles  
✅ **Environment Variables** - Secrets never hardcoded  
✅ **Rate Limiting** - Smartcar API rate limits respected  
✅ **Error Handling** - Safe error messages for debugging  

---

## 📁 Project Structure

```
my_car_companion/
├── src/
│   ├── app.module.ts                 # Root module
│   ├── index.ts                      # Entry point
│   ├── modules/
│   │   ├── vehicles/
│   │   │   ├── vehicles.module.ts   # Module definition
│   │   │   └── vehicles.tools.ts    # 16 MCP tools
│   │   ├── flights/                  # (optional)
│   │   └── maintenance/              # (optional)
│   ├── services/
│   │   ├── smartcar.service.ts      # ✨ NEW Smartcar API
│   │   ├── sqlite.service.ts        # Database
│   │   ├── duffel.service.ts        # Flight booking
│   │   └── calendar.service.ts      # (skeleton)
│   ├── guards/
│   │   └── oauth.guard.ts           # Authentication
│   └── health/
│       └── system.health.ts         # Health checks
├── data/
│   └── garage.db                    # SQLite database (created at runtime)
├── .env.example                     # Environment template
├── QUICKSTART.md                    # 🎯 Start here
├── ARCHITECTURE_GUIDE.md            # 🏗️ How it works
├── SMARTCAR_INTEGRATION.md          # 🔌 Smartcar setup
├── USAGE_GUIDE.md                   # 📋 Examples
└── package.json                     # Dependencies
```

---

## 🗄️ Database Schema

### vehicles table
```sql
CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  nickname TEXT,
  vin TEXT UNIQUE,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  current_odometer INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### fuel_logs table
```sql
CREATE TABLE fuel_logs (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  filled_at TEXT NOT NULL,
  odometer INTEGER NOT NULL,
  litres REAL NOT NULL,
  price REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);
```

### maintenance_records table
```sql
CREATE TABLE maintenance_records (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  performed_at TEXT NOT NULL,
  odometer INTEGER,
  cost REAL,
  notes TEXT,
  next_due_date TEXT,
  next_due_odometer INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY(vehicle_id) REFERENCES vehicles(id)
);
```

---

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Docker (Coming Soon)
```bash
docker build -t my-car-companion .
docker run -p 3000:3000 my-car-companion
```

---

## 🔌 Integrations

### Smartcar API
- ✅ OAuth 2.0 flow
- ✅ Sandbox & Live modes
- ✅ Vehicle data retrieval
- ✅ Remote lock/unlock
- ✅ Real-time vehicle status

### Auth0 (Optional)
- ✅ OAuth 2.1 provider
- ✅ JWT token validation
- ✅ Multi-tenant support

### OpenAI / Claude
- ✅ MCP Protocol
- ✅ Tool schema validation
- ✅ Streaming responses

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Specific Tools
```bash
# Start server
npm run dev

# In another terminal, test with curl
curl -X POST http://localhost:3000/tools/list_vehicles \
  -H "Content-Type: application/json" \
  -d '{"auth": {"subject": "demo-user"}}'
```

### Manual Testing with Claude
See **[QUICKSTART.md](./QUICKSTART.md)** for 12 test scenarios with expected outputs.

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Database error | Delete `data/garage.db*` and restart |
| Smartcar connection fails | Check `.env` credentials |
| Token expired | Call `exchange_smartcar_code` with new code |
| Server won't start | Check port 3000 availability |

---

## 📖 Learning Resources

- [Smartcar API Docs](https://smartcar.com/docs)
- [MCP Specification](https://modelcontextprotocol.io)
- [NitroStack Docs](https://nitrostack.com)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- [ ] Maintenance scheduling
- [ ] Cost/fuel efficiency tracking
- [ ] Trip logging
- [ ] Multi-vehicle dashboards
- [ ] Mobile app integration
- [ ] SMS notifications

---

## 📝 License

MIT License - See LICENSE file for details

---

## 👤 Author

Created with ❤️ by Darshana2510

- GitHub: [@Darshana2510](https://github.com/Darshana2510)
- Repository: [my_car_companion](https://github.com/Darshana2510/my_car_companion)

---

## 📞 Support

- 📖 **Documentation**: See markdown files in root directory
- 🐛 **Issues**: Create a GitHub issue
- 💡 **Ideas**: Open a discussion
- ⚡ **Quick Help**: See [QUICKSTART.md](./QUICKSTART.md)

---

## 🎓 Next Steps

1. ✅ Clone the repository
2. ✅ Read [QUICKSTART.md](./QUICKSTART.md)
3. ✅ Configure `.env`
4. ✅ Run `npm install && npm run dev`
5. ✅ Test with Claude
6. ✅ Deploy to production

---

**Ready to connect your car? Let's go! 🚗⚡**

Start with: [QUICKSTART.md](./QUICKSTART.md)
