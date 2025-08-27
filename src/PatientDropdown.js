import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { Autocomplete, TextField } from "@mui/material";

export function PatientDropdown({ onPatientSelect }) {
    const [patients, setPatients] = useState([]);
    const db = getFirestore();

    useEffect(() => {
        const fetchPatients = async () => {
            const q = query(collection(db, "users"), where("role", "==", "patient"));
            const querySnapshot = await getDocs(q);
            const patientsList = querySnapshot.docs.map((doc) => ({
                id: doc.id, // Include the patient ID
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
            }));
            setPatients(patientsList);
        };

        fetchPatients();
    }, [db]);

    const handlePatientChange = (event, value) => {
        if (value) {
            onPatientSelect(value.id); // Pass the selected patient's ID to the parent component
        } else {
            onPatientSelect(null); // Clear the patient ID if no patient is selected
        }
    };

    return (
        <Autocomplete
            options={patients}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            onChange={handlePatientChange}
            renderInput={(params) => (
                <TextField {...params} label="Select a patient" variant="outlined" />
            )}
        />
    );
}