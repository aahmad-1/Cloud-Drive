import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import type { ICloudDocument } from "../types/CloudDocument";

const DocumentEditor = () => {
    const { id } = useParams();
    const [title, setTitle] = useState<string>("");
    const [saveMessage, setSaveMessage] = useState<string>("");
    const [ownerId, setOwnerId] = useState<string>("");
    const [editorIds, setEditorIds] = useState<string[]>([]);
    const [publicView, setPublicView] = useState<boolean>(false);
    const [shareUsername, setShareUsername] = useState<string>("");
    const [shareMessage, setShareMessage] = useState<string>("");
    const [notFound, setNotFound] = useState<boolean>(false);

    const editorRef = useRef<HTMLDivElement>(null); // the div on the page that Quill attaches to
    const quillRef = useRef<Quill | null>(null); // this holds the actual Quill instance
    const token = localStorage.getItem("token");

    // decode id from the jwt, only if a token actually exists (this prevents crashing/page not loading for logged-out viewers)
    const myId = token ? JSON.parse(atob(token.split(".")[1]))._id : null; 
    const canEdit = myId !== null && (myId === ownerId || editorIds.includes(myId));

    useEffect(() => {
        fetchDocument();
    }, []);

    const fetchDocument = async () => {
        try {
            const headers: Record<string, string> = {};
            // should only attach the header if we actually have a token
            if (token) {
                headers["Authorization"] = `Bearer ${token}`; 
            }
                
            const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
                method: "GET",
                headers,
            });
            
            const data: ICloudDocument = await response.json();

            if (!response.ok) {
                setNotFound(true);
                return;
            }

            setTitle(data.title);
            setOwnerId(data.ownerId);
            setEditorIds(data.editorIds);
            setPublicView(data.publicView);

            const options = {
                placeholder: 'Enter anything!',
                theme: 'snow'
            }

            // checks if div rendered in AND the quill hasn't been made yet. should avoid duplicate quill editors
            if (editorRef.current && !quillRef.current) { 
                quillRef.current = new Quill(editorRef.current, options)
                quillRef.current.clipboard.dangerouslyPasteHTML(data.content); // loading saved HTML content into quill
                // fixes issue that when a user (logged in or out) views a document via link they can type in the content box (they shouldn't be able to)
                const canEditNow = myId !== null && (myId === data.ownerId || data.editorIds.includes(myId));
                quillRef.current.enable(canEditNow);
            }

        } catch (error) {
            console.error(error);
        }
    };

    const saveDocument = async () => {
        try {
            // note: getSemanticHTML is quill's recommended way to get HTML content from the editor
            const content = quillRef.current?.getSemanticHTML() || "";

            const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    title,
                    content 
                })
            });

            if (!response.ok) {
                setSaveMessage("Could not save");
                return;
            }

            setSaveMessage("Saved!");
            setTimeout(() => setSaveMessage(""), 2000); // message dissapears after 2 sec
        } catch (error) {
            console.error(error);
        }
    };

    const shareDocument = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/documents/${id}/share`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ username: shareUsername }),
            });

            const data = await response.json();
            if (!response.ok) {
                setShareMessage(data.message || "Could not share document");
                return;
            }

            setEditorIds(data.editorIds);
            setShareMessage(`Shared with ${shareUsername}`);
            setShareUsername("");
            
        } catch (error) {
            console.error(error);
        }
    };

    const togglePublicView = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/documents/${id}/public`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ publicView: !publicView }),
            });

            const data = await response.json();
            setPublicView(data.publicView);

        } catch (error) {
            console.error(error);
        }
    };

    if (notFound) {
        return (
            <div className="container">
                <p>The file you're looking for doesn't exist or has been deleted.</p>
            </div>
        );
    }

    return (
        <div className="container">
            {!canEdit && <p className="text-muted">View only</p>}
            <input type="text" className="form-control mb-3" style={{ fontSize: "1.5rem", fontWeight: "bold" }} value={title}  disabled={!canEdit} onChange={(e) => setTitle(e.target.value)}/>
            <div ref={editorRef} style={{ minHeight: "300px", backgroundColor: "white" }}></div>

            {canEdit && (
                <button className="btn btn-primary mt-3" onClick={saveDocument}>Save</button>
            )}

            {saveMessage && <span className="ms-2 text-success">{saveMessage}</span>}

            {myId === ownerId && (
                <div className="mt-4 border-top pt-3">
                    <h5>Sharing</h5>

                    <div className="d-flex mb-2">
                        <input type="text" className="form-control me-2" placeholder="Username to give edit access..." value={shareUsername} onChange={(e) => setShareUsername(e.target.value)}/>
                        <button className="btn btn-secondary" onClick={shareDocument}>Share</button>
                    </div>

                    {shareMessage && <p>{shareMessage}</p>}

                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked={publicView} onChange={togglePublicView}/>
                        <label className="form-check-label">
                            Anyone with the link can view (read-only)
                        </label>
                    </div>

                    {publicView && (
                        <p className="mt-2">
                            Share link: <code>{window.location.origin}/document/{id}</code>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentEditor;