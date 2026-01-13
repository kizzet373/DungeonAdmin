function checkAuthStatus() {
    fetch('/dungeonadmin-api/auth-status', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(auth => {
        window.auth = auth;
        document.dispatchEvent(new CustomEvent('authStatusChecked'));
    })
    .catch(error => {
        console.error('Error checking auth status:', error);
    });
}

function logout() {
    fetch('/dungeonadmin-api/logout', { method: 'POST', credentials: 'include' })
    .catch(error => {
        console.error('Error during logout:', error);
    })
    .finally(() => {
        window.location.reload();
    });
}

function login() {
    const returnPath = window.location.pathname + window.location.search;
    window.location.href = `/dungeonadmin-api/auth/google?returnTo=${encodeURIComponent(returnPath)}`;
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});