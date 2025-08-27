import './App.css';
import { Login } from './Login.js';
import { Signup } from './Signup.js';
import { Home } from './Home.js';
import { ViewBatches } from "./ViewBatches";
import { SummaryPage } from "./BatchReport";
import { DetailsPage } from "./DetailsPage";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/batches" element={<ViewBatches />} />
        <Route path="/batch/:batchID" element={<SummaryPage />} />
        <Route path="/details" element={<DetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
/*
function App() {
  return (
    <div>
      <Login />
    </div>
  );
}

export default App;
*/
