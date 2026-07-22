import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const Navigation = () => {
    const [jwt, setJwt] = useState<string | null>(null);

    useEffect(() => {
        if(localStorage.getItem("token")) {
            setJwt(localStorage.getItem("token"))
        }
    }, [jwt])

    const logout = () => {
        localStorage.removeItem("token");
        setJwt(null);
        window.location.href = "/login";
    };

    return (
        <nav className="navbar navbar-expand bg-light mb-4">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">Cloud Drive</Link>
                <div>
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