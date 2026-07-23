import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ICloudDocument } from "../types/CloudDocument";
import { BsFillTrash3Fill } from "react-icons/bs";
import { useTranslation } from "react-i18next";

const Drive = () => {
    const [documents, setDocuments] = useState<ICloudDocument[]>([]);
    const [newTitle, setNewTitle] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("name");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === "fi" ? "fi-FI" : "en-US";

    useEffect(() => {
        if (!token) {
            window.location.href = "/login"; // non-authenticated users cant see anything
            return;
        }
        fetchDocuments();
    }, []);

    // fetch all documents a user has
    const fetchDocuments = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/documents", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            const data = await response.json();
            setDocuments(data);

        } catch (error) {
            console.error(error);
        }
    };

    // create documents
    const createDocument = async (e: React.SyntheticEvent) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3000/api/documents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: newTitle,
                    content: "" 
                })
            });

            const data = await response.json();
            setDocuments([...documents, { ...data, ownerUsername: "You" }]); // makes sure "You" is loaded right away under owner column
            setNewTitle("");

        } catch (error) {
            console.error(error);
        }
    };

    // delete a document
    const deleteDocument = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) return; // not the owner so nothing actually happened on server-side
            setDocuments(documents.filter((document) => document._id !== id)); // remove deleted doc from state without refetching everything
        } catch (error) {
            console.error(error);
        }
    };

    // clone any doc in your drive
    const cloneDocument = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/documents/${id}/clone`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            const data = await response.json();
            setDocuments([...documents, { ...data, ownerUsername: "You" }]); // makes sure "You" is loaded right away under owner column
        } catch (error) {
            console.error(error);
        }
    };

    // filters by search term and then sorts by whichever option the user selected
    const displayedDocuments = documents
        .filter((document) => document.title.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === "name") {
                return a.title.localeCompare(b.title); //note, localCompare helps handle alphabetical order correctly (indcluding case & accents)
            }
            if (sortBy === "created") {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); // "updated"
        });

    // upload an image as a doc
    const uploadImage = async () => {
        if (!imageFile) return;
        const formData = new FormData();
        formData.append("image", imageFile);

        try {
            const response = await fetch("http://localhost:3000/api/documents/upload-image", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            setDocuments([...documents, { ...data, ownerUsername: "You" }]);
            setImageFile(null);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container">
            <div className="position-relative d-flex align-items-center justify-content-end mb-5 mt-4">
                <h1 className="position-absolute start-50 translate-middle-x m-0">{username}'s {t("Drive")}</h1>
                <Link to="/trash" title="Recycle bin"><BsFillTrash3Fill size={24} /></Link>
            </div>

            <div className="d-flex mb-3">
                <input type="text" className="form-control me-2" placeholder={t("Search documents...")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                <select className="form-select" style={{ maxWidth: "200px" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">{t("Sort by name")}</option>
                    <option value="created">{t("Sort by created")}</option>
                    <option value="updated">{t("Sort by last updated")}</option>
                </select>
            </div>

            <form onSubmit={createDocument} className="d-flex mb-3">
                <input type="text" className="form-control me-2" placeholder={t("New document title...")} value={newTitle} onChange={(e) => setNewTitle(e.target.value)}/>
                <button type="submit" className="btn btn-primary">{t("Create")}</button>
            </form>

            <div className="d-flex align-items-center mb-3">
                <input type="file" className="form-control me-2" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                <button className="btn btn-secondary text-nowrap" onClick={uploadImage}>{t("Upload image")}</button>
            </div>

            <table className="table">
                <thead>
                    <tr>
                        <th>{t("Title")}</th>
                        <th>{t("Owner")}</th>
                        <th>{t("Created")}</th>
                        <th>{t("Last updated")}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {displayedDocuments.map((document) => (
                        <tr key={document._id}>
                            <td><Link to={`/document/${document._id}`}>{document.title}</Link></td>
                            <td>{document.ownerUsername}</td>
                            <td title={new Date(document.createdAt).toLocaleString(dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}>
                                {new Date(document.createdAt).toLocaleDateString()}
                            </td>
                            <td title={new Date(document.updatedAt).toLocaleString(dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}>
                                {new Date(document.updatedAt).toLocaleDateString()}
                            </td>
                            {/* <td>{new Date(document.createdAt).toLocaleDateString()}</td>
                            <td>{new Date(document.updatedAt).toLocaleDateString()}</td> */}
                            <td>
                                <button className="btn btn-outline-secondary btn-sm me-2" onClick={() => cloneDocument(document._id)}>{t("Clone")}</button>
                                {document.ownerUsername === "You" && (
                                    <button className="btn btn-outline-danger btn-sm" onClick={() => deleteDocument(document._id)}>{t("Delete")}</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Drive;