import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ICloudDocument } from "../types/CloudDocument";
import { BsFillTrash3Fill } from "react-icons/bs";

const Drive = () => {
    const [documents, setDocuments] = useState<ICloudDocument[]>([]);
    const [newTitle, setNewTitle] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [sortBy, setSortBy] = useState<string>("name");

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

    return (
        <div className="container">
            <div className="position-relative d-flex align-items-center justify-content-end mb-5 mt-4">
                <h1 className="position-absolute start-50 translate-middle-x m-0">{username}'s Drive</h1>
                <Link to="/trash" title="Recycle bin"><BsFillTrash3Fill size={24} /></Link>
            </div>

            <div className="d-flex mb-3">
                <input type="text" className="form-control me-2" placeholder="Search documents..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
                <select className="form-select" style={{ maxWidth: "200px" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="name">Sort by name</option>
                    <option value="created">Sort by created</option>
                    <option value="updated">Sort by last updated</option>
                </select>
            </div>

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
                    {displayedDocuments.map((document) => (
                        <tr key={document._id}>
                            <td><Link to={`/document/${document._id}`}>{document.title}</Link></td>
                            <td title={new Date(document.createdAt).toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}>
                                {new Date(document.createdAt).toLocaleDateString()}
                            </td>
                            <td title={new Date(document.updatedAt).toLocaleString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}>
                                {new Date(document.updatedAt).toLocaleDateString()}
                            </td>
                            {/* <td>{new Date(document.createdAt).toLocaleDateString()}</td>
                            <td>{new Date(document.updatedAt).toLocaleDateString()}</td> */}
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