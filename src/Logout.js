import { auth } from "./firebaseConfig.js";
import { signOut } from "firebase/auth";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Link } from "@mui/material";


export function Logout() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            alert(error.message);
        }
    };
    
    return(
        <div>
            <Link 
                onClick={handleLogout}
                
                component={RouterLink}
                to="/"
                sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    '&:hover': {
                    textDecoration: 'underline'
                    }
                }}
            >
            Logout
            </Link>
        </div>
    )
}