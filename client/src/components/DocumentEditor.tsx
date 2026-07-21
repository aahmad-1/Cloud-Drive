import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import type { ICloudDocument } from "../types/CloudDocument";

const DocumentEditor = () => {
    const { id } = useParams();
    const [title, setTitle] = useState<string>("");
    const [saveMessage, setSaveMessage] = useState<string>("");

    const editorRef = useRef<HTMLDivElement>(null); // the div on the page that Quill attaches to
    const quillRef = useRef<Quill | null>(null); // this holds the actual Quill instance
    const token = localStorage.getItem("token");

    useEffect(() => {
        fetchDocument();
    }, []);

    const fetchDocument = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/documents/${id}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            const data: ICloudDocument = await response.json();
            setTitle(data.title);

            const options = {
                placeholder: 'Enter anything!',
                theme: 'snow'
            }

            // checks if div rendered in AND the quill hasn't been made yet. should avoid duplicate quill editors
            if (editorRef.current && !quillRef.current) { 
                quillRef.current = new Quill(editorRef.current, options)
                quillRef.current.clipboard.dangerouslyPasteHTML(data.content); // loading saved HTML content into quill
            }

        } catch (error) {
            console.error(error);
        }
    };

    const saveDocument = async () => {
        try {
            // note: getSemanticHTML is quill's recommended way to get HTML content from the editor
            const content = quillRef.current?.getSemanticHTML() || "";

            await fetch(`http://localhost:3000/api/documents/${id}`, {
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

            setSaveMessage("Saved!");
            setTimeout(() => setSaveMessage(""), 2000); // message dissapears after 2 sec
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container">
            <input type="text" className="form-control mb-3" style={{ fontSize: "1.5rem", fontWeight: "bold" }} value={title} onChange={(e) => setTitle(e.target.value)}/>
            <div ref={editorRef} style={{ minHeight: "300px", backgroundColor: "white" }}></div>
            <button className="btn btn-primary mt-3" onClick={saveDocument}>Save</button>
            {saveMessage && <span className="ms-2 text-success">{saveMessage}</span>}
        </div>
    );
};

export default DocumentEditor;