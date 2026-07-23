import { useState } from "react";
import { useTranslation } from "react-i18next";

const Login = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const { t } = useTranslation();
    const submit = async (e: React.SyntheticEvent) => { // After v19.2.1, FormEvent is deprecated. Docs said to use SyntheticEvent instead.
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    username: username,
                    password: password 
                })
            })

            const data = await response.json(); // parse first so we can see specific backend error message after

            if (!response.ok) {
                console.log(data.message || "Login failed");
                return;
            }

            if (data.token) {
                localStorage.setItem("token", data.token); // storing jwt in localStorage so it survives page refresh
                localStorage.setItem("username", data.username);
                window.location.href = "/";
            }

        } catch (error) {
            console.error(error);
            console.log("Something went wrong, please try logging in again");
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: "400px" }}>
            <h1>{t("Login")}</h1>
            <form onSubmit={submit}>
                <label htmlFor="username">{t("Username")}:</label>
                <input type="text" id="username" className="form-control mb-2" value={username} onChange={(e) => setUsername(e.target.value)}/>
                <label htmlFor="password">{t("Password")}:</label>
                <input type="password" id="password" className="form-control mb-2" value={password} onChange={(e) => setPassword(e.target.value)}/>
                <button type="submit" className="btn btn-primary">{t("Login")}</button>
            </form>
        </div>
    );
};

export default Login;