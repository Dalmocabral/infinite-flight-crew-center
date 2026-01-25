import { useEffect } from 'react';

const AdminRedirect = () => {
    useEffect(() => {
        window.location.href = "http://127.0.0.1:8000/admin";
    }, []);

    return (
        <div style={{ 
            height: '100vh', 
            width: '100vw', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: '#0f2027',
            color: 'white',
            fontFamily: 'sans-serif'
        }}>
            Redirecting to Admin Panel...
        </div>
    );
};

export default AdminRedirect;
