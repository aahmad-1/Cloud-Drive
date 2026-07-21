import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ICloudDocument } from "../types/CloudDocument";

const Drive = () => {
    const [documents, setDocuments] = useState<ICloudDocument[]>([]);
    const [newTitle, setNewTitle] = useState<string>("");

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

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
            setDocuments([...documents, data]);
            setNewTitle("");

        } catch (error) {
            console.error(error);
        }
    };

    // delete a document
    const deleteDocument = async (id: string) => {
        try {
            await fetch(`http://localhost:3000/api/documents/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            setDocuments(documents.filter((document) => document._id !== id)); // remove deleted doc from state without refetching everything
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container">
            <h1>{username}'s Drive</h1>

            <form onSubmit={createDocument} className="d-flex mb-3">
                <input type="text" className="form-control me-2" placeholder="New document title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)}/>
                <button type="submit" className="btn btn-primary">Create</button>
            </form>

            <table className="table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Created</th>
                        <th>Last updated</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {documents.map((document) => (
                        <tr key={document._id}>
                            <td><Link to={`/document/${document._id}`}>{document.title}</Link></td>
                            <td>{new Date(document.createdAt).toLocaleDateString()}</td>
                            <td>{new Date(document.updatedAt).toLocaleDateString()}</td>
                            <td>
                                <button className="btn btn-outline-danger btn-sm" onClick={() => deleteDocument(document._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Drive;