// examples/react-app/src/App.tsx
import { useEffect } from "react";
import { logmonitor } from "logmonitor-js";
import "./App.css";

// Initialize Logmonitor once when the app loads.
// Replace with your actual API key for testing.
logmonitor.init({ apiKey: "YOUR_LOGMONITOR_API_KEY" });

function App() {
  useEffect(() => {
    console.log("App component mounted successfully!");
  }, []);

  const handleLogin = () => {
    const userId = `user_${Math.floor(Math.random() * 1000)}`;
    logmonitor.setUser({ userId });
    console.log(`User ${userId} has been identified.`);
  };

  const handleAction = () => {
    console.warn("A user performed an important action.", {
      buttonId: "action-btn",
      timestamp: new Date().toISOString(),
    });
  };

  const handleError = () => {
    try {
      throw new Error("This is a simulated production error!");
    } catch (e) {
      console.error("A critical error occurred:", e);
    }
  };

  const handleLogout = () => {
    console.info("User is logging out.");
    logmonitor.clearUser();
  };

  return (
    <>
      <h1>Logmonitor.io Example</h1>
      <div className="card">
        <button onClick={handleLogin}>Simulate Login</button>
        <button onClick={handleAction}>Trigger a Warning</button>
        <button onClick={handleError}>Trigger an Error</button>
        <button onClick={handleLogout}>Simulate Logout</button>
      </div>
      <p className="read-the-docs">
        Open your browser's developer console to see logs. If this app were in
        production, these logs would be sent to your Logmonitor dashboard.
      </p>
    </>
  );
}

export default App;