// Authentication check utility for all protected pages
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = '/login';
            return false;
        }
        
        // Update user info in sidebar if authenticated
        updateUserInfo(data.user);
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
        return false;
    }
}

function updateUserInfo(user) {
    // Update user name in sidebar
    const userNameElements = document.querySelectorAll('strong');
    userNameElements.forEach(el => {
        if (el.textContent.includes('Admin User')) {
            el.textContent = user.name;
        }
    });
    
    // Update role in dropdown
    const roleElements = document.querySelectorAll('.dropdown-item-text');
    roleElements.forEach(el => {
        if (el.textContent.includes('Role:')) {
            el.textContent = `Role: ${user.role}`;
        }
    });
    
    // Update welcome message
    const welcomeElements = document.querySelectorAll('.text-white-50');
    welcomeElements.forEach(el => {
        if (el.textContent.includes('Welcome,')) {
            el.textContent = `Welcome, ${user.name}`;
        }
    });
}

// Logout function
function logout() {
    fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
            window.location.href = '/login';
        })
        .catch(error => {
            console.error('Logout failed:', error);
            window.location.href = '/login';
        });
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', checkAuth);
