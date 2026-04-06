# Shipfinex NAV Tracker Test

This project implements a real-time portfolio NAV tracking system as requested in the Shipfinex test task.

## Tech Stack
- **NestJS** (Backend API, Microservices, Event routing)
- **React (Vite+TailwindCSS)** (Frontend Dashboard)
- **MongoDB** (Persistence for Holdings, Alerts, NAV Snapshots)
- **Redis** (Real-time caching of consistent asset prices)
- **RabbitMQ** (Decoupling Price Ingestion from NAV Computation and Notifications)

## Running the Application

This is a complete stack and requires Docker.
All services including MongoDB, Redis, and RabbitMQ are configured via Docker Compose.

**1. Start the Infrastructure**
```bash
docker compose up -d
```
*Note: Wait a few seconds for RabbitMQ and MongoDB to be fully initialized.*

**2. Start the Backend (NestJS)**
```bash
cd backend
npm install
npm run start
```
*The backend API and SSE endpoint will start on `http://localhost:3000`.*

**3. Start the Frontend (React)**
```bash
cd frontend
npm install
npm run dev
```
*The React UI will start on `http://localhost:5173`.*

---

## Event-Driven Architecture (RabbitMQ)

The core of this system is an **Event-Driven Architecture** powered by **RabbitMQ**. This decoupling is what makes the system resilient:

1.  **Price & Data Ingestors**: These services listen to three different public WebSockets (Binance, CoinCap, Blockchain.info). They don't know who the users are; they simply emit `price.updated` or `blockchain.alert` events into RabbitMQ.
2.  **NAV Engine**: This service "subscribes" to those events. On every price tick, it finds ONLY the users holding that specific asset, recalculates their portfolio across all latest known prices (cached in Redis), and emits a `nav.calculated` event.
3.  **API Gateway (SSE)**: This service manages client connections. It listens for `nav.calculated` and `alert.triggered` events and pushes them directly to the user's browser via Server-Sent Events.

---

## Testing the Application

1. Open `http://localhost:5173` in your browser.
2. The UI is pre-filled with a User ID (`demo-user`).
3. Add a holding (e.g. Asset: `bitcoin`, Qty: `2.5`).
4. Watch the Total Portfolio NAV update in real-time as WebSocket ticks arrive from CoinCap!
5. Add an Alert (e.g. `>` $150000). The alert will trigger exactly once when crossed, and show up in the Recent Alerts panel.

