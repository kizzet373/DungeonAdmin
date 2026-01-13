document.addEventListener('authStatusChecked', (event) => {
    const auth = window.auth;
    handleHeaderProfileDisplay(auth);
    handleGlobalEdition(auth);
});

function handleHeaderProfileDisplay(auth) {
    const loggedInContainers = document.getElementsByClassName('logged-in');
    const loggedOutContainers = document.getElementsByClassName('logged-out');
    const userGreetings = document.getElementsByClassName('user-greeting');
    
    if (auth && auth.isAuthenticated) {
        for (let i = 0; i < loggedInContainers.length; i++) {
            loggedInContainers[i].style.display = 'block';
        }
        for (let i = 0; i < loggedOutContainers.length; i++) {
            loggedOutContainers[i].style.display = 'none';
        }
        if (auth.user.name) {
            for (let i = 0; i < userGreetings.length; i++) {
                userGreetings[i].textContent = auth.user.name;
            }
        }
    } else {
        for (let i = 0; i < loggedInContainers.length; i++) {
            loggedInContainers[i].style.display = 'none';
        }
        for (let i = 0; i < loggedOutContainers.length; i++) {
            loggedOutContainers[i].style.display = 'block';
        }
    }
}

function handleGlobalEdition(auth) {
    window.currentGlobalEdition = auth.currentEdition || 'Kizzet2024';
    const editionSelector = document.getElementById('edition-selector');
    if (editionSelector) {
        editionSelector.value = window.currentGlobalEdition;
        editionSelector.addEventListener("change", (event) => {
            handleEditionChange(event.target.value);
        })
    }
    
    document.dispatchEvent(new CustomEvent('globalEditionHandled'));
    console.log("Current edition from server:", window.currentGlobalEdition);
}

function handleEditionChange(selectedEdition) {
    fetch('/dungeonadmin-api/set-edition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edition: selectedEdition }),
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(errorData => { throw new Error(errorData.error || `Server error: ${response.status}`); });
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            if (window.auth && window.auth.user) {
                window.auth.user.currentEdition = data.edition;
            }
            window.location.reload(); 
        } else {
            console.error('Failed to set edition:', data.error);
        }
    })
    .catch(error => {
        console.error('Error setting edition:', error);
        window.location.reload();
    });
}