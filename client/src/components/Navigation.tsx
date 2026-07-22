import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { BsFillMoonStarsFill, BsSunFill } from "react-icons/bs"; 

const Navigation = () => {
    const [jwt, setJwt] = useState<string | null>(null);
    const [theme, setTheme] = useState<string>("light");

    useEffect(() => {
        if(localStorage.getItem("token")) {
            setJwt(localStorage.getItem("token"))
        }
    }, [jwt])

    const applyTheme = (t: string) => {
        document.documentElement.classList.toggle("dark", t === "dark"); // toggles our own CSS variables
        document.documentElement.setAttribute("data-bs-theme", t); 
    };
    
    // light & dark mode 
    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        applyTheme(newTheme);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setJwt(null);
        window.location.href = "/login";
    };

    return (
        <nav className={`navbar navbar-expand mb-4 ${theme === "light" ? "bg-light" : "bg-dark"}`}>
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">Cloud Drive</Link>
                <div>
                    <span className="me-4" style={{ cursor: "pointer" }} title={theme === "light" ? "Dark mode" : "Light mode"} onClick={toggleTheme}>
                        {theme === "light" ? <BsFillMoonStarsFill size={20} /> : <BsSunFill size={20} />}
                    </span>
                    
                    {jwt ? (
                        <>
                            <Link className="btn btn-outline-secondary me-2" to="/profile">Profile</Link>
                            <button className="btn btn-outline-danger" onClick={logout}>Logout</button>
                        </>
                    ) : (
                        <>
                            <Link className="btn btn-outline-primary me-2" to="/login">Login</Link>
                            <Link className="btn btn-outline-secondary" to="/register">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navigation;