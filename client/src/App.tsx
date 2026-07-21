import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Navigation from "./components/Navigation";
import Register from "./components/Register";
import Drive from "./components/Drive";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Navigation />
            <Routes>
                <Route path="/" element={<Drive />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;