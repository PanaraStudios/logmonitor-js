# Logmonitor JS SDK

The official JavaScript SDK for [Logmonitor.io](https://logmonitor.io).

Logmonitor streams your production logs in real-time, so you can `console.log` your production app and fix bugs faster. This package automatically patches the global `console` object to capture logs in production environments (`NODE_ENV === 'production'`) while leaving it untouched during development.

## Features

-   Automatically captures `console.log`, `warn`, `error`, etc.
-   Only active in production environments, zero overhead in development.
-   Efficiently batches logs to minimize network traffic.
-   Lightweight and has no external runtime dependencies.

## Getting Started

### 1. Install the Package

```bash
npm install logmonitor-js
```

### 2. Initialize Logmonitor

In your application's entry point (e.g., `index.js` or `App.tsx`), initialize Logmonitor once.

```javascript
import { logmonitor } from 'logmonitor-js';

// Initialize Logmonitor once.
logmonitor.init({ apiKey: "YOUR_LOGMONITOR_API_KEY" });

// Your existing app code...
```

### 3. Usage

That's it! Continue using `console.log` as you normally would. In production builds, your logs will automatically be sent to your Logmonitor dashboard.

```javascript
// In any component or file
console.log("User has navigated to the settings page.");
console.warn("User is about to perform a destructive action.", { userId: 'user-123' });
```

### Associating Logs with a User

To filter logs by a specific user on your Logmonitor dashboard:

```javascript
import { logmonitor } from 'logmonitor-js';

// When a user logs in
logmonitor.setUser({ userId: "user-john-smith-456" });
console.log("User has been identified.");

// When they log out
logmonitor.clearUser();
```
---