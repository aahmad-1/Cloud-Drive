import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import type { ICloudDocument } from "../types/CloudDocument";
import { jsPDF } from "jspdf";

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
    const [docType, setDocType] = useState<string>("text");
    const [imagePath, setImagePath] = useState<string>("");
    const [imageMissing, setImageMissing] = useState<boolean>(false);
    const [originalTitle, setOriginalTitle] = useState<string>("");
    const [originalContent, setOriginalContent] = useState<string>("");

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
            setOriginalTitle(data.title);
            setOwnerId(data.ownerId);
            setEditorIds(data.editorIds);
            setPublicView(data.publicView);
            setDocType(data.type);
            setImagePath(data.imagePath || "");

            const options = {
                placeholder: 'Enter anything!',
                theme: 'snow'
            }

            // checks if the document uploaded is of text (not image) and checks if the div rendered in AND the quill hasn't been made yet. should skip quill for images and avoid duplicate quill editors
            if (data.type === "text" && editorRef.current && !quillRef.current) { 
                quillRef.current = new Quill(editorRef.current, options)
                quillRef.current.clipboard.dangerouslyPasteHTML(data.content); // loading saved HTML content into quill
                setOriginalContent(quillRef.current.getSemanticHTML());
                const canEditNow = myId !== null && (myId === data.ownerId || data.editorIds.includes(myId)); // fixes issue that when a user (logged in or out) views a document via link they can type in the content box (they shouldn't be able to)
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

                if (title === originalTitle && content === originalContent) {
                    setSaveMessage("You made no changes to save!");
                    setTimeout(() => setSaveMessage(""), 2000);
                    return;
                }

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

    const downloadTextDoc = () => {
        const text = quillRef.current?.getText() || ""; // plain text only, formatting isn't required per the project brief

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(title, 10, 15);

        doc.setFontSize(12);
        const lines = doc.splitTextToSize(text, 180); // wraps long text to fit the page width
        doc.text(lines, 10, 30);

        doc.save(`${title}.pdf`);
    };

    const downloadImageDoc = async () => {
        try {
            const response = await fetch(`http://localhost:3000${imagePath}`);
            const blob = await response.blob();

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;

                const img = new Image();
                img.onload = () => {
                    // page size = image's exact dimensions, so the image IS the page, not centered on a separate white page
                    const doc = new jsPDF({
                        orientation: img.width > img.height ? "landscape" : "portrait",
                        unit: "px",
                        format: [img.width, img.height],
                    });

                    doc.addImage(base64data, "JPEG", 0, 0, img.width, img.height);

                    const filename = title.replace(/\.[^/.]+$/, ""); // strips the image extension (.png, .jpg, etc) from the title
                    doc.save(`${filename}.pdf`);
                };
                img.src = base64data;
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error(error);
        }
    };

    const downloadImage = async () => {
        try {
            const response = await fetch(`http://localhost:3000${imagePath}`);
            const blob = await response.blob();

            const actualExtension = imagePath.split(".").pop(); // gets the real saved extension, regardless of what the title says
            const filenameWithoutExtension = title.replace(/\.[^/.]+$/, ""); // strips any extension the user left in the title

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filenameWithoutExtension}.${actualExtension}`;
            a.click();

            window.URL.revokeObjectURL(url); // cleans up the temporary blob url afterward
        } catch (error) {
            console.error(error);
        }
    };

    const shareDocument = async () => {

        const trimmed = shareUsername.trim();

        if (trimmed.length < 3 || trimmed.length > 25) {
            setShareMessage("Please enter a valid username (3-25 characters)");
            setTimeout(() => setShareMessage(""), 2000);
            return;
        }

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
                setTimeout(() => setShareMessage(""), 2000);
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

    const renameImage = async () => {

        if (title === originalTitle) {
            setSaveMessage("You made no changes to the name!");
            setTimeout(() => setSaveMessage(""), 2000);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ title }),
            });

            if (!response.ok) {
                setSaveMessage("Could not save");
                return;
            }

            setSaveMessage("Rename Saved!");
            setTimeout(() => setSaveMessage(""), 2000);
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

    // checks the what type of extension an animated image has
    const isAnimatable = imagePath.split(".").pop()?.toLowerCase() === "gif" || imagePath.split(".").pop()?.toLowerCase() === "webp";

    return (
        <div className="container">
            {!canEdit && <p className="text-muted">View only</p>}
            <div className="d-flex align-items-stretch mb-4">
                <input type="text" className="form-control me-3" style={{ fontSize: "1.5rem", fontWeight: "bold" }} value={title}  disabled={!canEdit} onChange={(e) => setTitle(e.target.value)}/>
                {canEdit && docType === "image" && (
                    <button className="btn btn-primary text-nowrap" onClick={renameImage}>Rename</button>
                )}
            </div>

            {docType === "image" ? (
                imageMissing ? (
                    <div className="text-center">
                        <img src="/No-Image-Placeholder.svg" alt="Missing" style={{ maxWidth: "300px" }} />
                        <p className="text-muted mt-2">The image you're looking for has either been deleted, not in the database, or is an unsupported file type!</p>
                        <p className="text-muted mt-2">The following image formats are supported for upload: JPG, PNG, GIF, WebP, SVG, BMP, ICO, AVIF.</p>
                    </div>
                ) : (
                    <div>
                        <img src={`http://localhost:3000${imagePath}`} alt={title} className="img-fluid" onError={() => setImageMissing(true)}/>
                    </div>
                )
            ) : (
                <div ref={editorRef} style={{ minHeight: "300px", backgroundColor: "white" }}></div>
            )}

            {canEdit && docType === "text" && (
                <button className="btn btn-primary mt-3" onClick={saveDocument}>Save</button>
            )}
            {docType === "text" && (
                <button className="btn btn-outline-primary mt-3 ms-2" onClick={downloadTextDoc}>Download Document as PDF</button>
            )}
            {docType === "image" && !imageMissing && (
                <>
                    <button className="btn btn-outline-primary mt-3" title={isAnimatable ? "Only the first frame of this image will be downloaded if it's moving" : undefined} onClick={downloadImageDoc}>Download Image as PDF</button>
                    <button className="btn btn-outline-primary mt-3 ms-2" onClick={downloadImage}>Download Image</button>
                </>
            )}

            {saveMessage && <p className="text-success mt-3">{saveMessage}</p>}

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