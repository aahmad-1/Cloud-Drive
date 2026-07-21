import { useState } from "react";

const Register = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const submit = async (e: React.SyntheticEvent) => { // After v19.2.1, FormEvent is deprecated. Docs said to use SyntheticEvent instead.
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    username: username,
                    password: password 
                })
            })

            const data = await response.json(); // parse first so we can see specific backend error message after if response wasn't returned 
            
            if (!response.ok) {
                console.log(data.message || "Registration failed");
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
            <h1>Register</h1>
            <form onSubmit={submit}>
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" className="form-control mb-2" value={username} onChange={(e) => setUsername(e.target.value)}/>
                <label htmlFor="password">Password:</label>
                <input type="password" id="password" className="form-control mb-2" value={password} onChange={(e) => setPassword(e.target.value)}/>
                <button type="submit" className="btn btn-primary">Register</button>
            </form>
        </div>
    );
};

export default Register;