import { useState } from "react";
import { useTranslation } from "react-i18next";

const Register = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const { t } = useTranslation();
    const [errors, setErrors] = useState<string[]>([]); // use an array instead of string since there can be 2 errors at once

    const submit = async (e: React.SyntheticEvent) => { // After v19.2.1, FormEvent is deprecated. Docs said to use SyntheticEvent instead.
        e.preventDefault();

        const newErrors: string[] = [];
        const validUsername = username.trim();
        const validPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

        if (validUsername.length < 3 || validUsername.length > 25) {
            newErrors.push("Please enter a valid username (3-25 characters)");
        }

        if (!validPassword) {
            newErrors.push("Please enter a valid password (min 8 characters, 1 lowercase, 1 uppercase, 1 number, 1 symbol)");
        }

        if (newErrors.length > 0) {
            setErrors(newErrors);
            setTimeout(() => setErrors([]), 2000);
            return;
        }

        setErrors([]);

        try {
            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    username: validUsername,
                    password: password 
                })
            })

            const data = await response.json(); // parse first so we can see specific backend error message after if response wasn't returned 
            
            if (!response.ok) {
                console.log(data.message || "Registration failed");
                setErrors([data.message || "Registration failed"]);
                setTimeout(() => setErrors([]), 2000); // errors isn't a string but an array, so clear the whole array after
                return;
            }
            
            window.location.href = "/login";

        } catch (error) {
            console.error(error);
            console.log("Something went wrong, please try registering again");
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: "400px" }}>
            <h1 className="mb-3">{t("Register")}</h1>
            <form onSubmit={submit}>
                <label htmlFor="username">{t("Username")}:</label>
                <input type="text" id="username" className="form-control mb-2" value={username} onChange={(e) => setUsername(e.target.value)}/>
                <label htmlFor="password">{t("Password")}:</label>
                <input type="password" id="password" className="form-control mb-3" value={password} onChange={(e) => setPassword(e.target.value)}/>
                <button type="submit" className="btn btn-primary">{t("Register")}</button>
                {errors.map((error, i) => <p key={i} className="text-danger mt-3">{t(error)}</p>)}
            </form>
        </div>
    );
};

export default Register;