import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Table, TableCell, TableContainer, TableBody, TableHead, TableRow, Typography, Box, Modal, CircularProgress, Button } from "@mui/material";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import axios from "axios";

export function DetailsPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { batchID, cellType, modelUsed } = location.state || {}; // Get batchID and cellType from state
    const [images, setImages] = useState([]); // Collection of images
    const [selectedRow, setSelectedRow] = useState(null); // Track the selected row
    const [isExplaining, setIsExplaining] = useState(false); // Track loading state
    const db = getFirestore();

    const [explainedImage, setExplainedImage] = useState(null); // Store the explained image
    const [isModalOpen, setIsModalOpen] = useState(false); // Control modal visibility

    useEffect(() => {
        const fetchImages = async () => {
            try {
                const imagesRef = collection(db, "batches", batchID, "images");
                const q = query(imagesRef, where("prediction", "==", cellType)); // Query for specific cell type
                const querySnapshot = await getDocs(q);

                const fetchedImages = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setImages(fetchedImages);
            } catch (error) {
                console.error("Error fetching images:", error);
            }
        };

        fetchImages();
    }, [batchID, cellType, db]);

    const handleRowClick = (index) => {
        setSelectedRow(index); // Update the selected row
    };

    const decodeBase64Image = (base64String) => {
        return `data:image/jpeg;base64,${base64String}`;
    };

    const base64ToFile = (base64String, fileName) => {
        const [mimePart, dataPart] = base64String.split(",");
        const mimeType = mimePart.match(/:(.*?);/)[1]; // Extract the MIME type (ex. "image/jpeg")
        const byteString = atob(dataPart);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([uint8Array], { type: mimeType });
        return new File([blob], fileName, { type: mimeType });
    };

    const handleExplainableAI = async (image) => {
        setIsExplaining(true); // Set explaining state to true
        try {
            const actualImage = decodeBase64Image(image.imageBase64);
            const imageFile = base64ToFile(actualImage, image.fileName || "image.jpg"); // Convert Base64 to File
            const formData = new FormData();
            formData.append("image", imageFile);
            formData.append("class_to_explain", image.cellTypeIndex); // Snake casing for consistency in Python backend
            formData.append("model_id", modelUsed);

            const response = await axios.post("http://127.0.0.1:5000/explain", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setExplainedImage(response.data.explained_image); // Store Base64 image
            setIsModalOpen(true); // Open the modal
        } catch (error) {
            alert(error.response?.data?.detail || error.message);
        } finally {
            setIsExplaining(false); // Reset loading state
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false); // Close the modal
    };

    return (
        <div style={{ padding: "20px" }}>
            <Button 
                onClick={() => navigate('/home')} 
                style={{ 
                    position: 'fixed',
                    top: 16,
                    right: 16,
                    zIndex: 1000
                 }} 
                variant="outlined">Back to Summary
            </Button>
            <Typography variant="h4" style={{ marginBottom: "20px" }}>
                Details for Cell Type: {cellType}
            </Typography>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Image</TableCell>
                            <TableCell>Confidence</TableCell>
                            <TableCell>Explainable AI (Click on row to view)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {images.map((image, index) => (
                            <TableRow
                                key={image.id}
                                onClick={() => handleRowClick(index)}
                                style={{
                                    backgroundColor: selectedRow === index ? "#f0f8ff" : "white",
                                    cursor: "pointer",
                                }}
                            >
                                <TableCell>
                                    <img
                                        src={decodeBase64Image(image.imageBase64)}
                                        alt={image.fileName}
                                        style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                    />
                                </TableCell>
                                <TableCell>{image.confidence}%</TableCell>
                                <TableCell>
                                    <span
                                        style={{
                                            color: isExplaining ? "gray" : "#1976d2",
                                            textDecoration: "underline",
                                            cursor: isExplaining ? "not-allowed" : "pointer",
                                            visibility: selectedRow === index ? "visible" : "hidden",
                                        }}
                                        onClick={() => {
                                            if (!isExplaining) handleExplainableAI(image);
                                        }}
                                    >
                                        {isExplaining && selectedRow === index ? (
                                            <CircularProgress size={20} />
                                        ) : (
                                            "Click to view top 5 significant regions that influenced classification"
                                        )}
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal open={isModalOpen} onClose={handleCloseModal}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    {explainedImage && (
                        <img
                            src={`data:image/png;base64,${explainedImage}`}
                            alt="Explained Image"
                            style={{ width: "100%", height: "auto" }}
                        />
                    )}
                </Box>
            </Modal>
        </div>
    );
}