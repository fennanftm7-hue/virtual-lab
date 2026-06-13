# Virtual Lab

## Overview

Virtual Lab is an interactive physics experimentation platform built using React, Matter.js, Node.js, Socket.IO, and MongoDB. It enables users to perform real-time physics experiments individually or collaboratively through shared rooms.

The application provides a visual environment for exploring concepts such as forces, energy transfer, pendulum motion, structural integrity, PID control systems, and constraint-based mechanics.

---

## Features

### Physics Simulation

* Real-time 2D physics engine powered by Matter.js
* Interactive objects including boxes, balls, and polygons
* Adjustable gravity and wind conditions
* Collision handling and motion visualization

### Collaboration System

* Multi-user experiment rooms
* Live participant tracking
* Shared experiment states
* Real-time object synchronization using Socket.IO
* Shared annotations and cursor updates

### Constraint Builder

Users can dynamically connect bodies using:

* Rope constraints
* Pivot joints
* Spring constraints
* Motorized joints
* Constraint deletion tools

### Experiment Systems

* Pendulum simulation with adjustable length
* Bridge simulation with structural failure mechanics
* Spring systems
* Hover stabilization using PID control

### Structural Analysis

* Stress visualization using color indicators
* Constraint damage accumulation
* Automatic bridge failure under excessive stress
* Bridge rebuilding functionality

### Material System

Apply different material properties to bodies:

* Wood
* Steel
* Rubber
* Ice

Material properties affect:

* Density
* Friction
* Restitution
* Stress tolerance

### Environmental Presets

Preconfigured laboratory environments:

* Gravity Lab
* Calm Lab
* Storm Lab
* Chaos Lab

### Data Visualization

* Real-time kinetic energy monitoring
* Velocity vector overlays
* Force vector overlays
* Session energy graphs

### Experiment Persistence

* Save experiments to MongoDB
* Load previous experiments
* Delete experiments
* Share experiment configurations

### Data Export

* Export session energy data as CSV files

---

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Matter.js

### Backend

* Node.js
* Express.js
* Socket.IO

### Database

* MongoDB

---

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/virtual-lab.git
cd virtual-lab
```

Install dependencies:

```bash
npm install
```

---

## Running the Project

### Start the frontend

```bash
npm run dev
```

The frontend runs at:

```
http://localhost:5173
```

### Start the backend server

Open a separate terminal and run:

```bash
node server.js
```

The backend runs at:

```
http://localhost:3001
```

---

## MongoDB Setup

Ensure MongoDB is installed and running before starting the backend server.

Update the MongoDB connection string in the backend configuration if necessary.

---

## Project Structure

```
virtual-lab/
├── config/
├── models/
├── public/
├── routes/
├── src/
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

