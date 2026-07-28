import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const Profile = () => {
    const [username, setUsername] = useState<string>("");
    const [profilePicture, setProfilePicture] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [imageError, setImageError] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true); // avoids flickering of profile pics

    const token = localStorage.getItem("token");

    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null); // helps translate the words inside the file upload input fields

    useEffect(() => {
        if (token) fetchMyInfo();
    }, []);

    const fetchMyInfo = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/auth/me", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                localStorage.removeItem("token"); // token becomes expired/invalid after 2hrs so treat as logged out
                window.location.reload();
                return;
            }

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

    if (!token) { //profile url visit if not logged in
        return (
            <div className="container">
                <p className="mt-4">{t("You're not logged in to see your profile! Press Login to get to the login page.")}</p>
            </div>
        );
    }

    return (
        <div className="container">
            <h1 className="mb-4">{username}'s {t("Profile")}</h1>

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
                        fontSize: "2rem", margin: "0 auto"}}>
                    {username?.charAt(0).toUpperCase()}
                </div>
            )}

            <div className="mt-4 text-center">
                <input type="file" ref={fileInputRef} className="d-none" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <div className="input-group mb-3">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => fileInputRef.current?.click()}>{t("Choose File")}</button>
                    <span className="form-control d-flex align-items-center">{file ? file.name : t("No file chosen")}</span>
                </div>
                <button className="btn btn-primary mt-2" onClick={uploadProfilePicture}>{t("Upload picture")}</button>
            </div>
            
        </div>
    );
};

export default Profile;

