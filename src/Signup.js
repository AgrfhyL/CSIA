import React, { useState } from "react";
import { TextField, Button } from "@mui/material";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, setDoc, doc,  } from "firebase/firestore"; 
import { auth } from "./firebaseConfig.js";
import { useNavigate } from "react-router-dom";

export function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('doctor');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [signupClicked, setSignupClicked] = useState(false);
    const navigate = useNavigate();
    const db = getFirestore();

    const handleSignup = async () => {
        try {
            setSignupClicked(true);
            await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                email: email,
                role: role,
                firstName: firstName,
                lastName: lastName,
                userID: auth.currentUser.uid,
            });
            alert("User created successfully!");
            navigate('/home');
        } catch (error) {
            alert(error.message);
            setSignupClicked(false);
        }
      };

    return(
        <div>
            <TextField
                label = "Enter email"
                onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
                label = "Set password"
                type = "password"
                onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
                label = "Enter first name"
                onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
                label = "Enter last name"
                onChange={(e) => setLastName(e.target.value)}
            />
            <select onChange={(e) => setRole(e.target.value)}>
                <option value="doctor">Doctor</option>
                <option value="patient">Patient</option>
            </select>
            <Button 
            onClick={handleSignup}
            disabled={signupClicked}
            style={{
                marginTop: 20,
                backgroundColor: signupClicked ? "gray" : "#1976d2",
                color: "white",
                padding: "10px 20px",
                borderRadius: 4,
              }}
            >
            Register
            </Button>
        </div>
    ) 
}