import { useEffect, useState } from "react";

const Profile = () => {
    const [username, setUsername] = useState<string>("");
    const [profilePicture, setProfilePicture] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [imageError, setImageError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true); // avoids flickering of profile pics

    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchMyInfo();
    }, []);

    const fetchMyInfo = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/auth/me", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            const data = await response.json();
            setUsername(data.username);
            setProfilePicture(data.profilePicture || "");
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    const uploadProfilePicture = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await fetch("http://localhost:3000/api/auth/profile-picture", {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            setProfilePicture(data.profilePicture || "");
            setImageError(false); // needed so a newly uploaded pfp isn't blocked by an error from a previous missing image


        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container">
            <h1>Profile</h1>

            {loading ? (
                <div style={{ width: "100px", height: "100px" }}></div>
            ) : profilePicture && !imageError ? (
                <img
                    src={`http://localhost:3000${profilePicture}`}
                    alt="Profile"
                    onError={() => setImageError(true)}
                    style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", display: "block", margin: "0 auto" }}
                />
            ) : (
                <div
                    style={{
                        width: "100px", height: "100px", borderRadius: "50%",
                        backgroundColor: "#0d6efd", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "2rem", margin: "0 auto"
                    }}
                >
                    {username?.charAt(0).toUpperCase()}
                </div>
            )}

            <div className="mt-3">
                <input type="file" className="form-control mb-2" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button className="btn btn-primary" onClick={uploadProfilePicture}>Upload picture</button>
            </div>
        </div>
    );
};

export default Profile;