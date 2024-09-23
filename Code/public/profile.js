
document.addEventListener('DOMContentLoaded', async () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const username = localStorage.getItem('username');

    if (!isLoggedIn || !username) {
        window.location.href = 'signIn.html';
        return;
    }

    const loginLink = document.getElementById('loginLink');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');
    const adminLink = document.getElementById('adminLink');

    loginLink.style.display = 'none';
    profileLink.style.display = 'block';
   adminLink.style.display = 'none';
    logoutLink.style.display = 'block';

    try {
        const response = await fetch(`/api/user/${username}`);
        if (response.ok) {
            const userData = await response.json();
            document.getElementById('username').textContent = userData.Username;
            document.getElementById('name').textContent = userData.Name;
            document.getElementById('email').textContent = userData.Email;
            document.getElementById('city').textContent = userData.City;
            document.getElementById('province').textContent = userData.ProvinceState;
            document.getElementById('phoneNumber').textContent = userData.PhoneNo;
        } else {
            console.error('User not found');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
    }


    logoutLink.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        window.location.href = 'signIn.html';
    });
    document.getElementById('savedRecipesLink').addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = `savedRecipes.html?username=${username}`;
    });

    document.getElementById('createdRecipesLink').addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = `createdRecipes.html?username=${username}`;
    });

    document.getElementById('deleteAccountlink').addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = `deleteAccount.html?username=${username}`;
    });

    document.getElementById('updateDetailsLink').addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = `updateDetails.html?username=${username}`;
    });

});
