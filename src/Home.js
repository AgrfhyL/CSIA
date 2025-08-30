import { TextField } from "@mui/material";
import Upload from "./Upload";
import { auth } from "./firebaseConfig.js";
import { Logout } from "./Logout.js";
import { ViewBatches } from "./ViewBatches.js";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";

export function Home() {
    const db = getFirestore();
    const [role, setRole] = useState('');
    const [firstAndLastName, setName] = useState('');
    const [refresh, setRefresh] = useState(false);

    // Changes value of "refresh" so that useEffect in ViewBatches is triggered to reload batches (due to change in triggerRefresh)
    const triggerRefresh = () => {
        setRefresh(prev => prev + 1);
      };

    useEffect(() => {
        const fetchRole = async () => {
            const q = query(collection(db, 'users'), where('userID', '==', auth.currentUser.uid.toString()));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                setRole(doc.data().role || 'Unknown');
            });
        };
        const fetchName = async () => {
            const q = query(collection(db, 'users'), where('userID', '==', auth.currentUser.uid.toString()));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                setName(doc.data().firstName + ' ' + doc.data().lastName);
            });
        }
        fetchRole();
        fetchName();
    }, [db]);

    // If not logged in, redirects user to login page
    if (!auth.currentUser) {
        return <Navigate to="/" />;
    }

    if (role === 'doctor') {
        return(
            <div style={{ display: "flex", justifyContent: "space-between", padding: "20px" }}>
            {/* Left Section: Upload */}
            <div style={{ flex: 1, marginRight: "20px" }}>
                <h2>Upload Section</h2>
                <Upload onUploadComplete={triggerRefresh}/>
                <Logout />
                <TextField
                    label={auth.currentUser.email}
                    fullWidth
                    style={{ marginBottom: "10px" }}
                />
                <TextField
                    label={firstAndLastName}
                    fullWidth
                    style={{ marginBottom: "10px" }}
                />
                <TextField
                    label={"Role: " + role.substring(0, 1).toUpperCase() + role.substring(1)}
                    fullWidth
                />
            </div>

            {/* Right Section: ViewingBatches */}
            <div style={{ flex: 2, marginLeft: "20px" }}>
                <ViewBatches triggerRefresh={refresh}/>
            </div>
        </div>
        )   
    } else {
        return(
            <div>
                <div>
                    <Upload/>
                </div>
                <div>
                    <Logout/>
                </div>
                <TextField label={auth.currentUser.email}/>
                <TextField label={firstAndLastName}/>
                <TextField label={'Role: ' + role.substring(0,1).toUpperCase() + role.substring(1)}/>
            </div>
        )
    }
}
