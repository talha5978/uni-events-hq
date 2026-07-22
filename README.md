# UniEvents HQ

**A complete university event management platform** built for ImpactForge Hackathon.

An all-in-one solution for Student Affairs, Society Presidents, Treasurers, and Students to manage events, registrations, payments, and QR-based entry verification.

---

## ✨ Features

### **For Students**
- Browse all events
- Register for events (free or paid)
- Upload payment proof for paid events
- View my registrations + QR codes
- Receive QR code for event entry

### **For Society Presidents**
- Manage society members (President, Treasurer, Members)
- Create and manage events
- View event registrations
- Generate QR codes for entry

### **For Treasurers**
- View pending payments
- Verify payment proofs
- Manage society bank accounts

### **For Admin (Student Affairs)**
- Approve/revoke student accounts
- Manage all societies
- Monitor overall system

---

## 🛠 Tech Stack

- **Backend**: Fastify + Drizzle ORM + Neon Postgres
- **Frontend**: React Router + Tailwind CSS + shadcn/ui
- **Auth**: JWT with refresh tokens + role-based access
- **Database**: PostgreSQL with Drizzle
- **QR Codes**: QRCode.js
- **Deployment Ready**: PNPM workspaces

---

## 📋 How It Works

### 1. **Student Onboarding**
- Student signs up → account created with `isVerified: false`
- Admin reviews and verifies the student
- Student can now access the portal

### 2. **Event Creation Flow**
- President creates event → status = `draft`
- Can set:
  - Single date or multiple time slots
  - Free or paid
  - Members-only or open
  - Max participants limit

### 3. **Registration Flow**
- Student registers for event
- If paid → uploads transaction proof → status = `pending_verification`
- Treasurer verifies payment → status = `registered`
- QR Code is automatically generated

### 4. **Event Entry**
- Student shows QR code at entrance
- Society head scans QR → status updated to `attended`

---

## 🗂 Project Structure
```bash
├── apps/
│   ├── admin/           # Admin Portal
│   ├── backend/         # Fastify Backend
│   └── web/             # Student Portal
└── packages/
    ├── db/              # Drizzle Schema + Types
    └── auth/            # Auth Logic
```

---

## 🚀 Key Flows

### Student Registration
1. Student browses events
2. Clicks Register
3. If paid → uploads proof
4. Treasurer verifies
5. Student gets QR code

### QR Verification
1. Student shows QR at event
2. Society head scans QR
3. System marks as `attended`

---

## Role Permissions

| Role          | Can Do |
|---------------|--------|
| **Admin**     | Verify students, manage all societies |
| **President** | Create events, manage members |
| **Treasurer** | Verify payments, manage bank accounts |
| **Member**    | Register for events |
| **Student**   | Browse & register for open events |

---

## Setup & Run

```bash
# Install dependencies
pnpm install

# Run backend
pnpm backend:dev

# Run frontends
pnpm admin:dev
pnpm web:dev
```

---

Built with ❤️ for ImpactForge Hackathon
Turning university event chaos into seamless experiences.