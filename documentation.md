

🛡️ SafeGate: AI-Driven Sobriety Gatekeeper (SaaS for Avant2go)
Project Mission: To replace expensive, unhygienic hardware breathalyzers with a high-accuracy, software-based "Cognitive Gate" that ensures only fit-to-drive users can unlock shared vehicles.

🏗️ 1. Technical Stack
* Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.
* Backend: Node.js, Express, and TypeScript using the Prisma ORM.
* Database: MongoDB Atlas (Selected for its flexible NoSQL schema to store varied game telemetry).
* AI/Vision: WebGazer.js (Client-side ocular tracking for smooth pursuit analysis).
* Hardware Integration: Mobile Accelerometer/Gyroscope API accessed via the Browser.

🔄 2. The Tiered Decision Matrix (The "Escalation Ladder")
This model is designed to maximize safety while minimizing "False Positive" friction for sober, high-value users.
Tier	Status	Score (S)	Action
Tier 1	Approved	$S \geq 0.8$	Immediate vehicle unlock with high confidence in sobriety.
Tier 2	Recalibrate	$0.5 \leq S < 0.8$	User is in the "Gray Area"; trigger Ocular Pursuit + 1 additional game to verify focus.
Tier 3	Intervention	$S < 0.5$	Significant impairment detected; deny access and offer integrated Taxi/Uber referral.
🎮 3. The Cognitive Game Suite (7 Core Tests)
The system randomly selects 3 games per session to prevent pattern memorization.
1. Prati Tačku (Ocular Pursuit): A dot moves in a non-linear, smooth pattern; the user must follow it with their eyes using WebGazer.js to measure Smooth Pursuit Eye Movement (SPEM).
2. Tajmer Dugme (Reflex): Click a shadcn Button when it turns from Red to Green to measure reaction latency in $ms$.
3. Lavirint (Motor Control): Trace an SVG path without hitting the boundaries to measure tremor and coordination.
4. Pisanje Unazad (Executive Function): Type a 5-letter word backward in a shadcn Input to test working memory.
5. Igra Memorije (Spatial Memory): A 3x3 Grid where the user repeats a flashed sequence to test the hippocampus.
6. Kartice Levo/Desno (Decision Speed): Swipe numbers where Left is Even and Right is Odd to measure cognitive load processing.
7. Kartice Boja (Stroop Effect): Choose the color of the text, not the word itself, to test impulse control.

🗄️ 4. Database Schema (Prisma + MongoDB)
Delček kode

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  email         String    @unique
  baselineScore Float     @default(1.0) //
  sessions      Session[]
}

model Session {
  id          String       @id @default(auto()) @map("_id") @db.ObjectId
  userId      String       @db.ObjectId
  user        User         @relation(fields: [userId], references: [id])
  status      String       // "APPROVED", "RECALIBRATING", "DENIED"
  finalScore  Float?
  attempts    Int          @default(1) //
  createdAt   DateTime     @default(now()) //
  gameResults GameResult[]
}

model GameResult {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  sessionId String   @db.ObjectId
  session   Session  @relation(fields: [sessionId], references: [id])
  gameType  String   // OCULAR, TIMER, MAZE, REVERSE_TYPE, MEMORY, SWIPE, STROOP
  metrics   Json     // Stores WebGazer coords, latency_ms, errors, accuracy
  passed    Boolean
}

🔌 5. Core API Endpoints
* POST /api/session/start: Returns a sessionId and an array of 3 game IDs.
* POST /api/session/submit: Processes results through the weighted algorithm: $$S = (Accuracy_{avg} \times 0.7) + (Latency_{normalized} \times 0.3)$$ 
* GET /api/user/baseline: Fetches historical performance data for the "CEO Personalized Baseline".

🚀 6. Hackathon AI Prompting Guide
1. "Setup a Next.js 14 project with Tailwind, shadcn/ui, and Prisma configured for MongoDB Atlas."
2. "Create a React hook for WebGazer.js that manages webcam initialization and streams gaze coordinates to a GameContainer."
3. "Write a Prisma-based service in Express that calculates the Tiered Status based on combined ocular and reaction metrics".

🎤 7. The Winning Pitch
* The Problem: Hardware breathalyzers cost over €500 per car; software is free to scale.
* The Innovation: "Multi-Sensor Fusion" using touch, gyro, and clinical-grade Ocular Pursuit to create a 'Digital Fingerprint' of sobriety.
* The SaaS Play: Selling to Avant2go as a Safety API to save millions in totaled cars and insurance premiums.
* The "Safety Net": The system redirects high-risk users to mobility alternatives like Taxis rather than blocking them entirely.
