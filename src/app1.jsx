import React from 'react';
import ReactDOM from 'react-dom/client';

// Your existing component
function App1() {
  return (
    <div>
      <h1>Hello from App1!</h1>
    </div>
  );
}

// ← ADD THESE LINES AT THE BOTTOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App1 />);
