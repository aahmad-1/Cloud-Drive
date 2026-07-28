import { useEffect, useState } from "react";
import type { ICloudDocument } from "../types/CloudDocument";
import { useTranslation } from "react-i18next";

const Trash = () => {
    const [documents, setDocuments] = useState<ICloudDocument[]>([]);
    const token = localStorage.getItem("token");
    const { t, i18n } = useTranslation();
    const dateLocale = i18n.language === "fi" ? "fi-FI" : "en-US"; // helps translate dates shown in tooltips
    const [visibleItems, setVisibleItems] = useState<number>(7); // pagination

    useEffect(() => {
        if (token) fetchTrash();
    }, []);

    const fetchTrash = async () => {
        try {
            const response = await fetch("http://localhost:3000/api/documents/trash", {
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
            setDocuments(data);

        } catch (error) {
            console.error(error);
        }
    };

    const restoreDoc = async (id: string) => {
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

    // pagination
    const showMore = () => {
        setVisibleItems((previous) => previous + 7);
    };

    if (!token) { // accessing trash page while not logged in
        return (
            <div className="container">
                <p className="mt-4">{t("You're not logged in to see the trash! Press Login to get to the login page.")}</p>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>{t("Recycle Bin")}</h1>

            {documents.length === 0 ? (
                <p className="text-muted mt-5">{t("Nothing to see here! Delete some files first.")}</p>
            ) : (
                <div className="table-responsive">
                    <table className="table mt-5">
                        <thead>
                            <tr>
                                <th>{t("Title")}</th>
                                <th>{t("Deleted at")}</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.slice(0, visibleItems).map((document) => (
                                <tr key={document._id}>
                                    <td>{document.title}</td>
                                    <td title={new Date(document.deletedAt!).toLocaleString(dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}>
                                        {new Date(document.deletedAt!).toLocaleDateString()}
                                    </td>
                                    <td className="trash-buttons text-end">
                                        <button className="btn btn-outline-success btn-sm" onClick={() => restoreDoc(document._id)}>{t("Restore")}</button>
                                        <button className="btn btn-outline-danger btn-sm" onClick={() => permanentlyDelete(document._id)}>{t("Delete permanently")}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {visibleItems < documents.length && (
                <button className="btn btn-outline-secondary" onClick={showMore}>{t("Show More")}</button>
            )}
        </div>
    );
};

export default Trash;