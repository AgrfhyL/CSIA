import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Table, TableCell, TableContainer, TableBody, TableHead, TableRow } from "@mui/material";
import { getFirestore, collection, getDocs } from "firebase/firestore";

class CellType {
    constructor(type) {
        this.type = type;
        this.count = 0;
        this.totalConfidence = 0;
        this.images = [];
    }

    incrementCount(confidence, imageName) {
        this.count++;
        this.totalConfidence += confidence;
        this.images.push({ name: imageName, confidence });
    }

    getAverageConfidence() {
        return this.count > 0 ? (this.totalConfidence / this.count).toFixed(2) : 0;
    }
}

export function SummaryPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const {batchID, batchName, doctorName, patientName, timeCreated, modelUsed} = location.state || {};
    const [cellStats, setCellStats] = useState([]);
    const db = getFirestore();

    useEffect(() => {
        async function fetchBatchData() {
            const imagesCollection = collection(db, "batches", batchID, "images");
            const querySnapshot = await getDocs(imagesCollection);

            const cellTypes = {};

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const cellType = data.prediction;
                const confidence = data.confidence;

                if (!cellTypes[cellType]) {
                    cellTypes[cellType] = new CellType(cellType);
                }

                cellTypes[cellType].incrementCount(confidence, doc.id);
            });

            setCellStats(Object.values(cellTypes));
        }

        fetchBatchData();
    }, [batchID, db]);

    const handleCellTypeClick = (cellType) => {
        // Navigate to the DetailsPage with batchID and cellType as state
        navigate("/details", { state: { batchID, cellType, modelUsed } });
    };
    

    return (
        <div>
            <h1>Summary for Batch: {batchName}</h1>
            <h2>Batch ID: {batchID}</h2>
            <h2>Doctor: {doctorName}</h2>
            <h2>Patient: {patientName}</h2>
            <h2>Model: {modelUsed.substring(0,1).toUpperCase() + modelUsed.substring(1)} </h2>
            <h2>Time Created: {timeCreated}</h2>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cell Type</TableCell>
                            <TableCell>Frequency</TableCell>
                            <TableCell>Average Confidence</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cellStats.map((stat) => (
                            <TableRow key={stat.type}>
                                <TableCell>
                                    <span
                                        style={{
                                            color: "#1976d2",
                                            textDecoration: "underline",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => handleCellTypeClick(stat.type)}
                                    >
                                        {stat.type}
                                    </span>
                                </TableCell>
                                <TableCell>{stat.count}</TableCell>
                                <TableCell>{stat.getAverageConfidence()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}