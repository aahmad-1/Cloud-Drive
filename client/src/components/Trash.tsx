import { useEffect, useState } from "react";
import type { ICloudDocument } from "../types/CloudDocument";

const Trash = () => {
    const [documents, setDocuments] = useState<ICloudDocument[]>([]);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            window.location.href = "/login";
            return;
        }

        fetchTrash();
    }, []);

    const fetchTrash = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/documents/trash", {
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

    const restoreDocument = async (id: string) => {
        try {
            await fetch(`http://localhost:3000/api/documents/${id}/restore`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            setDocuments(documents.filter((document) => document._id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const permanentlyDelete = async (id: string) => {
        try {
            await fetch(`http://localhost:3000/api/documents/${id}/permanent`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            setDocuments(documents.filter((document) => document._id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container">
            <h1>Recycle Bin</h1>

            {documents.length === 0 ? (
                <p className="text-muted">Nothing to see here! Delete some files first.</p>
            ) : (
                <table className="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Deleted at</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map((document) => (
                            <tr key={document._id}>
                                <td>{document.title}</td>
                                <td title={new Date(document.deletedAt!).toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}>
                                    {new Date(document.deletedAt!).toLocaleDateString("en-GB")}
                                </td>
                                <td className="text-end">
                                    <button className="btn btn-outline-success btn-sm me-2" onClick={() => restoreDocument(document._id)}>Restore</button>
                                    <button className="btn btn-outline-danger btn-sm" onClick={() => permanentlyDelete(document._id)}>Delete permanently</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Trash;