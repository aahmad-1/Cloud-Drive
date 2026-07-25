import { Link, useLocation} from "react-router-dom";
import { useEffect, useState } from "react";
import { BsFillMoonStarsFill, BsSunFill } from "react-icons/bs";
import { useTranslation } from "react-i18next";

const Navigation = () => {
    const [jwt, setJwt] = useState<string | null>(null);
    const [theme, setTheme] = useState<string>("light");
    const location = useLocation();

    useEffect(() => {
        if(localStorage.getItem("token")) {
            setJwt(localStorage.getItem("token"))
        }
    }, [jwt])

    const { t, i18n } = useTranslation();
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    let brand;
if (location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/") {
    brand = <span className="navbar-brand">Cloud Drive</span>; // plain text, not clickable
} else {
    brand = <Link className="btn btn-outline-secondary" to="/" title={t("Return to Drive")}>{t("Return")}</Link>;
}

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
                {brand}
                <div>
                    <span className="me-4" style={{ cursor: "pointer" }} title={theme === "light" ? t("Dark mode") : t("Light mode")} onClick={toggleTheme}>
                        {theme === "light" ? <BsFillMoonStarsFill size={20} /> : <BsSunFill size={20} />}
                    </span>
                    
                    {jwt ? (
                        <>
                            <Link className="btn btn-outline-secondary me-2" to="/profile">{t("Profile")}</Link>
                            <button className="btn btn-outline-danger" onClick={logout}>{t("Logout")}</button>
                        </>
                    ) : (
                        <>
                            <Link className="btn btn-outline-primary me-2" to="/login">{t("Login")}</Link>
                            <Link className="btn btn-outline-secondary" to="/register">{t("Register")}</Link>
                        </>
                    )}
                    <button className="btn btn-outline-secondary ms-2" onClick={() => changeLanguage(i18n.language === "fi" ? "en" : "fi")}>
                        {i18n.language === "fi" ? "EN" : "FI"}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;