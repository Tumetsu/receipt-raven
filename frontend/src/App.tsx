import { useState, type ReactElement } from 'react';
import './App.css';

function App(): ReactElement {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1>Receipt Raven</h1>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
      </div>
    </>
  );
}

export default App;
