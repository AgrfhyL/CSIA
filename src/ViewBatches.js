import { auth } from "./firebaseConfig";
import React, { useEffect, useState } from "react";
import { Table, TableCell, TableContainer, TableBody, TableHead, TableRow, Button } from "@mui/material";
import { getFirestore, collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { LinearProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";

export function ViewBatches({ triggerRefresh }) {
    const [rows, setRows] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null); // State to track the selected row
    const db = getFirestore();
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(false); // State to track manual reloads
    const navigate = useNavigate();


    const handleDeleteBatch = async (batchID) => {
        try {
            // Ask user whether they are sure, giving them proceed and cancel options
            const confirmDelete = window.confirm("Are you sure you want to delete this batch? This action cannot be undone.");
            if (!confirmDelete) {
                return; // If user cancels, exit the function
            } else {
                console.log("Deleting batch with ID:", batchID); // Debugging log
            }
            const docToDelete = doc(db, "batches", batchID);
            const imagesSubcollection = collection(docToDelete, "images");
            const imagesSnapshot = await getDocs(imagesSubcollection);
            // Before deleting batch document, delete its images subcollection first by iterating through
            // each doc
            for (const imageDoc of imagesSnapshot.docs) {
                await deleteDoc(imageDoc.ref);
            }
            await deleteDoc(docToDelete);
            // After deletion, reload batches by calling on fetch function
            fetchBatches(auth.currentUser.uid);
        } catch (error) {
            console.error("Error deleting batch:", error);
        }
    }

    // Function to fetch user details by ID
    const getUserWithID = async (userID) => {
        console.log("Fetching user with ID:", userID); // Debugging log
        const users = query(collection(db, "users"), where("userID", "==", userID));
        const querySnapshot = await getDocs(users);
        let user = null;
        querySnapshot.forEach((doc) => {
            user = doc.data();
        });
        console.log("User found:", user); // Debugging log
        return user;
    };

    // Calls on fetchBatches() whenever triggerRefreshes (from Home.js) or on first render
    useEffect(() => {
        // If user logged in, userID will have a value
        const userID = auth.currentUser?.uid;
        console.log("Current User ID:", userID); // Debugging log
        if (userID) {
            fetchBatches(userID);
        } else {
            console.error("No user is currently logged in."); // Debugging log
        }
    }, [db, triggerRefresh]);

    // Triggers "setSelectedRow", which updates the "selectedRow" state when a row (in UI) is clicked
    // As seen in return(): this function will be called "onClick={() => handleRowClick(row)}""
    const handleRowClick = (row) => {
        setSelectedRow(row); // Update the selected row
    };

    const handleViewReport = (selectedRow) => {
        if (!selectedRow) {
            alert("Please select a batch to view the report.");
            return;
        }
        setGenerating(true);

        const batchID = selectedRow.batchID;
        const batchName = selectedRow.batchName;
        const doctorName = selectedRow.doctorName;
        const patientName = selectedRow.patientName;
        const timeCreated = selectedRow.timeCreated;
        const modelUsed = selectedRow.modelUsed;
        // Navigate to the BatchReport page, giving it the selected row's data to render accordingly
        navigate(`/batch/${batchID}`, {
            state: {
                batchID: batchID,
                batchName: batchName,
                doctorName: doctorName,
                patientName: patientName,
                timeCreated: timeCreated,
                modelUsed: modelUsed,
            },
        });

        setGenerating(false);
    };

    const docInfoExtraction = async (userID, fetchedRows, doc) => {
        console.log("Batch found:", doc.data()); // Debugging log
        // Per row data extraction (for each query document)
        const data = doc.data();
        const patient = await getUserWithID(data.patientID);
        const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient";
        const doctor = await getUserWithID(data.doctorID);
        const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "Unknown Doctor";
        const modelUsed = data.modelUsed || "Unknown Model"; // Default to "Unknown Model" if not present
        // Convert Firestore timestamp to a readable date string
        const timeCreated = data.timeCreated?.toDate().toLocaleString() || "Unknown Time";

        // Push the row data (above) into the fetchedRows array
        fetchedRows.push({
            batchName: data.batchName,
            timeCreated: timeCreated, // Use the formatted date string
            patientName: patientName,
            batchID: doc.id, // Store the document's ID
            doctorName: doctorName,
            modelUsed: modelUsed,
        });
    }

    // Function to fetch batches, called on first render and when "Reload Batches" button is clicked
    const fetchBatches = async (userID) => {
        setLoading(true); // Show loading indicator during fetch
        try {
            console.log("Fetching batches for doctorID:", userID); // Debugging log
            const batchesRef = collection(db, "batches"); // Reference to the 'batches' collection
            // Separate queries for doc & patient
            // Because no user can be both doctor and patient
            // This design allows for ViewBatches.js to be used by both doctors and patients
            const doctorBatchesQuery = query(batchesRef, where("doctorID", "==", userID)); // Apply the 'where' filter
            const patientBatchesQuery = query(batchesRef, where("patientID", "==", userID));
            const [doctorSnapshot, patientSnapshot] = await Promise.all([
                getDocs(doctorBatchesQuery),
                getDocs(patientBatchesQuery)
              ]);
            // const querySnapshot = await getDocs(batchesQuery); // Execute the query

            if (doctorBatchesQuery.empty || patientBatchesQuery.empty) {
                console.log("No batches found"); // Debugging log
            }

            const fetchedRows = [];
            for (const doc of doctorSnapshot.docs) {
                await docInfoExtraction(userID, fetchedRows, doc);
            }
            for (const doc of patientSnapshot.docs) {
                await docInfoExtraction(userID, fetchedRows, doc);
            }

            console.log("Fetched rows:", fetchedRows); // Debugging log
            setRows(fetchedRows); // Update state with fetched rows
        } catch (error) {
            console.error("Error fetching batches:", error);
        } finally {
            setLoading(false); // Hide loading indicator
        }
    };

    return (
        <div>
            <h1>View Batches</h1>
            <Button
                onClick={() => fetchBatches(auth.currentUser.uid.toString())} // fetchBatches is manually called for reload button
                variant="contained"
                style={{
                    marginBottom: 20,
                    backgroundColor: "#1976d2",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: 4,
                }}
            >
                Reload Batches
            </Button>


            {loading && <LinearProgress style={{ marginBottom: 10 }} />}

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Batch Name</TableCell>
                            <TableCell>Time Created</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow
                                key={row.batchID} //ID each row with its unique batchID (from Firestore Document)
                                onClick={() => handleRowClick(row)}
                                style={{
                                    // Each row (if not the selectedRow), will be pure white
                                    // Only selected row will have a grey-er white color
                                    backgroundColor: selectedRow === row ? "#f0f0f0" : "white", // selectedRow is an always updating state
                                    cursor: "pointer",
                                }}
                            >
                                <TableCell>{row.batchName}</TableCell>
                                <TableCell>{row.timeCreated}</TableCell> {/* Render the formatted date */}
                                <TableCell>
                                    {/* Add a small cell to the right that shows a red and underlined "delete" when selected, "delete"
                                    delete disappears when row not selected
                                    */}
                                    <span 
                                        style={{ color: "red", textDecoration: "underline", cursor: "pointer" }}
                                        onClick={() => handleDeleteBatch(row.batchID)}
                                    >
                                        Delete
                                    </span>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Button
                onClick={() => handleViewReport(selectedRow)} // Wrap the function call in an arrow function
                variant="contained"
                disabled={generating}
                style={{
                    marginTop: 20,
                    backgroundColor: generating ? "gray" : "#1976d2",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: 4,
                }}
            >
                {generating ? <LinearProgress style={{ width: "100%" }} /> : "View Report"}
            </Button>
        </div>
    );
}
