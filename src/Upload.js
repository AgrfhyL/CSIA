import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Autocomplete, Button, LinearProgress, TextField } from "@mui/material";
import axios from "axios";
import { auth } from "./firebaseConfig";
import { PatientDropdown } from "./PatientDropdown.js";
import { getFirestore, collection, getDocs } from "firebase/firestore";

export function Upload({ onUploadComplete }) {
  const [selectedModel, setSelectedModel] = useState("");
  const [files, setFiles] = useState([]);
  const [batchName, setBatchName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [folderName, setFolderName] = useState(""); // Track folder name
  const db = getFirestore();
  const [selectedPatient, setSelectedPatient] = useState(""); // Track selected patient
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".jpg", ".jpeg"] },
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        alert("Please upload only JPG/JPEG images.");
        return;
      }

      // Check if files come from a folder (have relative paths)
      const hasRelativePath = acceptedFiles.some(file => file.path && file.path.includes('/'));
      let folderName = "";
      
      if (hasRelativePath) {
        // Extract folder name from the first file's path
        const folderPath = acceptedFiles[0].path;
        folderName = folderPath.split("/")[0];
        setFolderName(folderName);
      } else {
        setFolderName(""); // Reset folder name if individual files
      }

      const validateImageDimensions = (file) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            if (img.width === 250 && img.height === 250) {
              resolve(file);
            } else {
              reject(new Error("Image must be 250x250 pixels."));
            }
          };
          img.onerror = () => reject(new Error(`Failed to load image ${file.name}.`));
          img.src = URL.createObjectURL(file);
        });
      };

      Promise.all(acceptedFiles.map((file) => validateImageDimensions(file)))
        .then((validFiles) => {
          setFiles(validFiles);
        })
        .catch((error) => {
          alert(error.message);
        });
    },
  }); 

  const handleUpload = async () => {
    setUploading(true);
    setUploadProgress(0); // Reset progress

    if (!batchName) {
      alert("Please enter a batch name.");
      setUploading(false);
      return;
    }

    if (await hasRepeatedBatchName(batchName)) {
      alert("Batch name already exists. Please choose a different name.");
      setUploading(false);
      return;
    }

    if (selectedModel === "") {
      alert("Please select a model.");
      setUploading(false);
      return;
    }

    if (selectedPatient === "") {
      alert("Please select a patient.");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      const userToken = await auth.currentUser.getIdToken();

      files.forEach((file) => formData.append("files", file));
      formData.append("batch_name", batchName);
      formData.append("model_id", selectedModel);
      formData.append("patient_id", selectedPatient); // Include the selected patient ID
      // Send form data to backend through POST request
      await axios.post("http://127.0.0.1:5000/process", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${userToken}`,
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress); // Update progress
        },
      });

      alert(`Batch uploaded: ${batchName}`);

      /*
      setFiles([]);
      setBatchName("");
      setSelectedModel("");
      setUploading(false);
      setUploadProgress(0);
      setFolderName("");
      setSelectedPatient(""); // Reset selected patient
      */

      if (onUploadComplete) {
        onUploadComplete(); // Call the callback to refresh the batch view
      } else {
        console.error("onUploadComplete is not defined!");
      }
    } catch (error) {
      alert(error.response?.data?.detail || error.message);
    }

    setUploading(false);
  };

  async function hasRepeatedBatchName(name) {
    const querySnapshot = await getDocs(collection(db, "batches"));
    for (const doc of querySnapshot.docs) {
      if (doc.data().batchName === name) {
        return true;
      }
    }
    return false;
  }

  // Actual render of page
  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed gray",
          padding: 20,
          backgroundColor: isDragActive ? "#d1ffd6" : files.length > 0 ? "#f0f8ff" : "white",
          textAlign: "center",
        }}
      >
        <input {...getInputProps()} directory="" webkitdirectory="" type="file" />
        {files.length > 0 ? (
          <div>
            {/* Display folder name only if available */}
            {folderName && (
              <p style={{ fontWeight: "bold", color: "black", marginBottom: "10px" }}>
                Folder Name: {folderName}
              </p>
            )}
            {/* Show first 3 uploaded files */}
            <p style={{ fontWeight: "bold", color: "black" }}>Uploaded Files:</p>
            <ul style={{ listStyleType: "none", padding: 0 }}>
              
              {/* Map through the first 3 files and display their names */}
              {files.slice(0, 3).map((file, index) => (
                <li key={index} style={{ fontStyle: "italic", color: "gray", fontSize: "0.9em" }}>
                  {file.name}
                </li>
              ))}
              {/* If more than 3 files uploaded, add a "..." after the first 3 files' display */}
              {files.length > 3 && (
                <li style={{ fontStyle: "italic", color: "gray", fontSize: "0.9em" }}>...</li>
              )}
            </ul>
            <p style={{ fontStyle: "italic", color: "gray", fontSize: "0.8em" }}>
              Drag and drop another file to replace the current batch.
            </p>
          </div>
        ) : (
          "Drag & drop or click on region to upload images (250x250 JPG)"
        )}
      </div>

      {uploading && (
        <LinearProgress
          variant="determinate"
          value={uploadProgress}
          style={{ marginTop: 10, width: "100%" }}
        />
      )}

      <TextField
        label="Batch Name"
        value={batchName}
        onChange={(e) => setBatchName(e.target.value)}
        style={{ marginTop: 20, width: "100%" }}
      />
      <Autocomplete
        onChange={(e, value) => setSelectedModel(value)}
        options={["augmented", "first_model", "model", "optimised"]}
        getOptionLabel={(option) => option}
        filterSelectedOptions
        renderInput={(params) => (
          <TextField {...params} label="Select a model" variant="outlined" />
        )}
      />

      {/* PatientDropdown with onPatientSelect */}
      <PatientDropdown
        onPatientSelect={(patientID) => {
          console.log("Selected Patient ID:", patientID); // Debugging log
          setSelectedPatient(patientID);
        }}
      />

      <Button
        onClick={handleUpload}
        disabled={uploading}
        style={{
          marginTop: 20,
          backgroundColor: uploading ? "gray" : "#1976d2",
          color: "white",
          padding: "10px 20px",
          borderRadius: 4,
        }}
      >
        {uploading ? <LinearProgress style={{ width: "100%" }} /> : "Upload Batch"}
      </Button>
    </div>
  );
}