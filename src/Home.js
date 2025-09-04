/*
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
            {/* Left Section: Upload */
        /*
        }
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

            {/* Right Section: ViewingBatches */
        /*
        }
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
*/
import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
  Chip
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { MedicalServices, Person, UploadFile, Visibility } from "@mui/icons-material";
import { auth } from "./firebaseConfig.js";
import { Logout } from "./Logout.js";
import { ViewBatches } from "./ViewBatches.js";
import { Upload } from "./Upload.js";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// Styled components for better UI
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  height: "100%",
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  paddingBottom: theme.spacing(1),
  borderBottom: `2px solid ${theme.palette.primary.main}`,
}));

const RoleBadge = styled(Chip)(({ theme, role }) => ({
  backgroundColor: role === "doctor" 
    ? theme.palette.success.main 
    : theme.palette.info.main,
  color: "white",
  fontWeight: "bold",
  marginBottom: theme.spacing(2),
}));

export function Home() {
  const db = getFirestore();
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    role: "",
    firstName: "",
    lastName: "",
    email: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const triggerRefresh = () => {
    setRefresh(prev => prev + 1);
  };

  useEffect(() => {
    // Redirect if not authenticated
    if (!auth.currentUser) {
      navigate("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            role: data.role || "patient",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: auth.currentUser.email || "",
          });
        } else {
          setError("User data not found");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [db, navigate]);

  if (!auth.currentUser) {
    return null; // Navigation will handle the redirect
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your information...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Logout />
      </Container>
    );
  }

  const fullName = `${userData.firstName} ${userData.lastName}`;
  const formattedRole = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
  const isDoctor = userData.role === "doctor";

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* User Info Sidebar - Same for both roles */}
        <Grid item xs={12} md={4}>
          <StyledPaper>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: "primary.main",
                  mb: 2,
                  fontSize: "2rem",
                }}
              >
                {userData.firstName?.[0]}{userData.lastName?.[0]}
              </Avatar>
              <Typography variant="h5" component="h1" gutterBottom align="center">
                {fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom align="center">
                {userData.email}
              </Typography>
              <RoleBadge 
                role={userData.role} 
                icon={isDoctor ? <MedicalServices /> : <Person />}
                label={formattedRole} 
              />
              
              {/* Logout button positioned right under role badge */}
              <Logout />
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Upload Section - Only for Doctors */}
            {isDoctor && (
              <Box sx={{ mb: 3 }}>
                <SectionTitle variant="h6">
                  <UploadFile /> Upload Files
                </SectionTitle>
                <Upload onUploadComplete={triggerRefresh} />
              </Box>
            )}
          </StyledPaper>
        </Grid>

        {/* Main Content Area - Different for each role */}
        <Grid item xs={12} md={8}>
          <StyledPaper>
            {isDoctor ? (
              <>
                <SectionTitle variant="h5">
                  <MedicalServices /> Patient Batches
                </SectionTitle>
                <ViewBatches triggerRefresh={refresh} />
              </>
            ) : (
              <>
                {/* Patient-specific content placed below their profile */}
                <SectionTitle variant="h5">
                  <Visibility /> Your Medical Records
                </SectionTitle>
                
                <Card variant="outlined" sx={{ mt: 2, mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Your Information
                    </Typography>
                    <Typography variant="body2" paragraph>
                      All your medical records are kept confidential and secure. 
                      You can browse through your test results and historical data below.
                    </Typography>
                  </CardContent>
                </Card>
                
                <ViewBatches triggerRefresh={refresh} />
              </>
            )}
          </StyledPaper>
        </Grid>
      </Grid>
    </Container>
  );
}
