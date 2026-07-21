import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Navigation from "./components/Navigation";
import Register from "./components/Register";
import Drive from "./components/Drive";
import DocumentEditor from "./components/DocumentEditor";
import Trash from "./components/Trash";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Navigation />
            <Routes>
                <Route path="/" element={<Drive />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/document/:id" element={<DocumentEditor />} />
                <Route path="/trash" element={<Trash />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;