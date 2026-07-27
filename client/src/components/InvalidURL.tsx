import { useTranslation } from "react-i18next";

const InvalidURL = () => {
    const { t } = useTranslation();
    const token = localStorage.getItem("token");

    return (
        <div className="container">
            <p className="mt-4">{token ? t("Invalid URL! Press Return to go back to the main drive.") : t("Invalid URL! Press Return or Login to get to the login page.")}</p>
        </div>
    );
};

export default InvalidURL;