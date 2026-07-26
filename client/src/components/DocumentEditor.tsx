import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import type { ICloudDocument } from "../types/CloudDocument";
import { jsPDF } from "jspdf";
import { useTranslation } from "react-i18next";

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
    const [saveMessageType, setSaveMessageType] = useState<string>("success");
    const [shareMessageType, setShareMessageType] = useState<string>("success");
    const [lockedOut, setLockedOut] = useState<boolean>(false);
    const [lockedByUsername, setLockedByUsername] = useState<string>("");
    const [revokeUsername, setRevokeUsername] = useState<string>("");
    const [revokeMessage, setRevokeMessage] = useState<string>("");
    const [revokeMessageType, setRevokeMessageType] = useState<string>("success");
    const [shareMessageUsername, setShareMessageUsername] = useState<string>("");
    const [revokeMessageUsername, setRevokeMessageUsername] = useState<string>("");

    const editorRef = useRef<HTMLDivElement>(null); // the div on the page that Quill attaches to
    const quillRef = useRef<Quill | null>(null); // this holds the actual Quill instance
    const token = localStorage.getItem("token");
    const { t } = useTranslation();

    // decode id from the jwt, only if a token actually exists (this prevents crashing/page not loading for logged-out viewers)
    const myId = token ? JSON.parse(atob(token.split(".")[1]))._id : null; 
    const canEdit = myId !== null && (myId === ownerId || editorIds.includes(myId));
    const isEditable = canEdit && !lockedOut; // user has edit perms for a doc AND no other user is currently editing the same doc

    useEffect(() => {
        quillRef.current?.enable(isEditable);
    }, [lockedOut]);

    useEffect(() => {
        fetchDocument();
    }, []);

    useEffect(() => {
        if (!canEdit) return; // no point in locking if the user can't edit anyway (for view only users)

        tryLock();    // runs when we leave the doc
        return () => {
            releaseLock();
        };
    }, [canEdit]);

    // this releases the edit lock on a doc if the user closes the tab OR leaves the site
    useEffect(() => {
        const handleUnload = () => {
            // sendBeacon makes sure the unlock request finishes in the background even if the page is closing
            navigator.sendBeacon(`http://localhost:3000/api/documents/${id}/unlock`); // works even as the page is closing
        };

        window.addEventListener("beforeunload", handleUnload);
        return () => window.removeEventListener("beforeunload", handleUnload);
    }, [id]);

    // tries to claim editing lock when opening a document
    const tryLock = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/documents/${id}/lock`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            // if another user already has the doc open, lock us out and grab their username & display who it is
            const data = await response.json();
            if (!data.locked) {
                setLockedOut(true);
                setLockedByUsername(data.lockedByUsername);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // unlocks the document on the server so other users can edit it again
    const releaseLock = () => {
        fetch(`http://localhost:3000/api/documents/${id}/unlock`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        }).catch((error) => console.error(error));
    };

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
                const canEditBoxNow = myId !== null && (myId === data.ownerId || data.editorIds.includes(myId)); // fixes issue that when a user (logged in or out) views a document via link they can type in the content box (they shouldn't be able to)
                quillRef.current.enable(canEditBoxNow && !lockedOut);
            }

        } catch (error) {
            console.error(error);
        }
    };

    // editing the contents of a text doc & renaming it
    const saveDocument = async () => {
        try {
            // note: getSemanticHTML is quill's recommended way to get HTML content from the editor
            const content = quillRef.current?.getSemanticHTML() || "";

                if (title === originalTitle && content === originalContent) {
                    setSaveMessage("You made no changes to save!");
                    setSaveMessageType("error");
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
                setSaveMessageType("error");
                setTimeout(() => setSaveMessage(""), 2000);
                return;
            }

            setSaveMessage("Saved!");
            setSaveMessageType("success");
            setTimeout(() => setSaveMessage(""), 2000); // message dissapears after 2 sec
        } catch (error) {
            console.error(error);
        }
    };

    // renaming an image doc
    const renameImage = async () => {

        if (title === originalTitle) {
            setSaveMessage("You made no changes to the name!");
            setSaveMessageType("error");
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
                setSaveMessageType("error");
                setTimeout(() => setSaveMessage(""), 2000);
                return;
            }

            setSaveMessage("Rename Saved!");
            setSaveMessageType("success");
            setTimeout(() => setSaveMessage(""), 2000);

        } catch (error) {
            console.error(error);
        }
    };

    // download a text doc as a pdf
    const downloadTextDoc = () => {
        const text = quillRef.current?.getText() || ""; // gets plain text only from the doc, ignores formatting like bulletpoints, bolding, underlines, etc

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(title, 10, 15);

        doc.setFontSize(12);
        const lines = doc.splitTextToSize(text, 180); // wraps long text to fit the page width
        doc.text(lines, 10, 30);

        doc.save(`${title}.pdf`);
    };

    // download an image doc as a pdf
    const downloadImageDoc = async () => {
        try {
            const response = await fetch(`http://localhost:3000${imagePath}`);
            const blob = await response.blob();

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;

                const img = new Image();
                img.onload = () => {
                    // page size = image's exact dimensions, so the original image becomes the page in the pdf itself when downloaded. inspired by png2pdf.com
                    const doc = new jsPDF({
                        orientation: img.width > img.height ? "landscape" : "portrait",
                        unit: "px",
                        format: [img.width, img.height],
                    });

                    doc.addImage(base64data, "JPEG", 0, 0, img.width, img.height);

                    const filename = title.replace(/\.[^/.]+$/, ""); // strips any extensions (.png, .jpg, etc) from the title
                    doc.save(`${filename}.pdf`);
                };
                img.src = base64data;
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error(error);
        }
    };

    // download the image regularly (not as a pdf)
    const downloadImage = async () => {
        try {
            const response = await fetch(`http://localhost:3000${imagePath}`);
            const blob = await response.blob();

            const actualExtension = imagePath.split(".").pop(); // gets the extension of the image, even if it isn't in the name on the drive
            const filenameWithoutExtension = title.replace(/\.[^/.]+$/, ""); // strips any extension in the title (it may not match the one stored)

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filenameWithoutExtension}.${actualExtension}`;
            a.click();

            window.URL.revokeObjectURL(url); // cleans up the temp blob url afterward
        } catch (error) {
            console.error(error);
        }
    };

    // share a doc via username
    const shareDocument = async () => {
        const trimmed = shareUsername.trim();

        if (trimmed.length < 3 || trimmed.length > 25) {
            setShareMessage("Please enter a valid username (3-25 characters)");
            setShareMessageType("error");
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
                body: JSON.stringify({ username: trimmed }),
            });

            const data = await response.json();
            if (!response.ok) {
                let message = data.message;
                if (data.message === "cannot share with yourself") message = "You can't share with yourself!";
                if (data.message === "already shared") message = "{{username}} is already shared with";

                setShareMessage(message);
                setShareMessageUsername(trimmed);
                setShareMessageType("error");
                setTimeout(() => setShareMessage(""), 2000);
                return;
            }

            setEditorIds(data.editorIds);
            setShareMessage("Shared with {{username}}");
            setShareMessageUsername(trimmed);
            setShareMessageType("success");
            setTimeout(() => setShareMessage(""), 2000);
            setShareUsername("");
            
        } catch (error) {
            console.error(error);
        }
    };

    // toggles a shareable link that lets anyone (logged in or not) to view a file
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
                <p>The file you're looking for doesn't exist or has been deleted!</p>
            </div>
        );
    }

    const revokeAccess = async () => {
        const userTrimmed = revokeUsername.trim();

        if (userTrimmed.length < 3 || userTrimmed.length > 25) {
            setRevokeMessage("Please enter a valid username (3-25 characters)");
            setRevokeMessageType("error");
            setTimeout(() => setRevokeMessage(""), 2000);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/documents/${id}/revoke`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ username: userTrimmed }),
            });

            const data = await response.json();
            if (!response.ok) {
                let message = data.message;
                if (data.message === "cannot revoke from yourself") message = "You can't revoke access from yourself. Try deleting instead!";
                if (data.message === "already doesn't have access") message = "{{username}} already doesn't have access!";

                setRevokeMessage(message);
                setRevokeMessageUsername(userTrimmed);
                setRevokeMessageType("error");
                setTimeout(() => setRevokeMessage(""), 2000);
                return;
            }

            setEditorIds(data.editorIds);
            setRevokeMessage("Edit access revoked from {{username}}");
            setRevokeMessageUsername(userTrimmed);
            setRevokeMessageType("success");
            setTimeout(() => setRevokeMessage(""), 2000);
            setRevokeUsername("");
            
        } catch (error) {
            console.error(error);
        }
    };

    // checks the what type of extension an animated image has
    const isAnimatable = imagePath.split(".").pop()?.toLowerCase() === "gif" || imagePath.split(".").pop()?.toLowerCase() === "webp";

    return (
        <div className="container">
            {!canEdit && <p className="text-muted">View only</p>}
            {lockedOut && (
                <p className="text-danger fw-bold">This document is currently being edited by {lockedByUsername}.</p>
            )}
            <div className="d-flex align-items-stretch mb-4">
                <input type="text" className="form-control me-3" style={{ fontSize: "1.5rem", fontWeight: "bold" }} value={title}  disabled={!isEditable} onChange={(e) => setTitle(e.target.value)}/>
                {isEditable && docType === "image" && (
                    <button className="btn btn-primary text-nowrap" onClick={renameImage}>{t("Rename")}</button>
                )}
            </div>

            {docType === "image" ? (
                imageMissing ? (
                    <div className="text-center">
                        <img src="/No-Image-Placeholder.svg" alt="Missing" style={{ maxWidth: "300px" }} />
                        <p className="text-muted mt-4">{t("The image you're looking for has either been deleted, not in the database, or is an unsupported file type!")}</p>
                        <p className="text-muted mb-4">{t("The following image formats are supported for upload: JPG, PNG, GIF, WebP, SVG, BMP, ICO, AVIF.")}</p>
                    </div>
                ) : (
                    <div>
                        <img src={`http://localhost:3000${imagePath}`} alt={title} className="img-fluid" onError={() => setImageMissing(true)}/>
                    </div>
                )
            ) : (
                <div ref={editorRef} style={{ minHeight: "300px" }}></div>
            )}

            {isEditable && docType === "text" && (
                <button className="btn btn-primary mt-3" onClick={saveDocument}>{t("Save")}</button>
            )}
            {docType === "text" && (
                <button className="btn btn-outline-primary mt-3 ms-2" onClick={downloadTextDoc}>{t("Download Document as PDF")}</button>
            )}
            {docType === "image" && !imageMissing && (
                <>
                    <button className="btn btn-outline-primary mt-3" title={isAnimatable ? t("Only the first frame of this image will be downloaded if it's moving") : undefined} onClick={downloadImageDoc}>{t("Download Image as PDF")}</button>
                    <button className="btn btn-outline-primary mt-3 ms-2" onClick={downloadImage}>{t("Download Image")}</button>
                </>
            )}

            {saveMessage && <p className={`mt-4 ${saveMessageType === "success" ? "text-success" : "text-danger"}`}>{t(saveMessage)}</p>}

            {myId === ownerId && (
                <div className="mt-4 border-top pt-3">
                    <h5 className="mt-2 mb-3">{t("Sharing")}</h5>

                    <div className="d-flex mb-2">
                        <input type="text" className="form-control me-2" placeholder={t("Username to give edit access...")} value={shareUsername} onChange={(e) => setShareUsername(e.target.value)}/>
                        <button className="btn btn-secondary" onClick={shareDocument}>{t("Share")}</button>
                    </div>
                    {shareMessage && <p className={shareMessageType === "success" ? "text-success" : "text-danger"}>{t(shareMessage, { username: shareMessageUsername })}</p>}

                    <div className="d-flex mb-2">
                        <input type="text" className="form-control me-2" placeholder={t("Username to revoke edit access...")} value={revokeUsername} onChange={(e) => setRevokeUsername(e.target.value)}/>
                        <button className="btn btn-secondary" onClick={revokeAccess}>{t("Revoke")}</button>
                    </div>
                    {revokeMessage && <p className={revokeMessageType === "success" ? "text-success" : "text-danger"}>{t(revokeMessage, { username: revokeMessageUsername })}</p>}

                    <div className="form-check form-switch">
                        <input className="mt-2 form-check-input" type="checkbox" checked={publicView} onChange={togglePublicView}/>
                        <label className="mt-2 form-check-label">{t("Anyone with the link can view (read-only)")}</label>
                    </div>

                    {publicView && (
                        <p className="mt-2">
                            {t("Share link")}: <code>{window.location.origin}/document/{id}</code>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentEditor;