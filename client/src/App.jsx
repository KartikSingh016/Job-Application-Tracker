import { Link, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import ApplicationForm from "./pages/ApplicationForm.jsx";
import ApplicationDetail from "./pages/ApplicationDetail.jsx";

export default function App() {
  return (
    <>
      <header className="navbar">
        <Link to="/" className="brand">
          Job Application Tracker
        </Link>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<ApplicationForm />} />
          <Route path="/edit/:id" element={<ApplicationForm />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
        </Routes>
      </main>
    </>
  );
}
