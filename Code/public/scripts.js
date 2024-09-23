/*
 * These functions below are for various webpage functionalities. 
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 * 
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your 
 *   backend endpoints 
 * and 
 *   HTML structure.
 * 
 */



// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
        .then((text) => {
            statusElem.textContent = text;
        })
        .catch((error) => {
            statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
        });
}



function showLoginForm() {
    document.getElementById('loginform').style.display = 'block';
    document.getElementById('signUpform').style.display = 'none';
}

function showSignUpForm() {
    document.getElementById('loginform').style.display = 'none';
    document.getElementById('signUpform').style.display = 'block';
}




async function login(event) {
    event.preventDefault();

    const usernameValue = document.getElementById('logInU').value;
    const passwordValue = document.getElementById('logInP').value;

    const response = await fetch('/logintable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            Username: usernameValue,
            Password: passwordValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertResultMsgU');

    if (responseData.success) {
        messageElement.textContent = "Logged in successfully";
        localStorage.setItem('isLoggedIn', 'true');

        localStorage.setItem('username', usernameValue);
        if(usernameValue === 'admin') {
            localStorage.setItem('isAdmin', 'true');
            window.location.href = `/admin.html?username=${usernameValue}`;
        } else {
            localStorage.setItem('isAdmin', 'false');
            window.location.href = `/profile.html?username=${usernameValue}`;
        }
    } else {
        messageElement.textContent = "Either Username does not exist or password is wrong";
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    window.location.href = 'signIn.html';
}

document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.getElementById('loginLink');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');
    const adminLink = document.getElementById('adminLink');

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'block';

        const username = localStorage.getItem('username');
        // if (username) {
        //     document.getElementById('username').textContent = username;
        // }
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        console.log('isadmin',isAdmin);

        if(isAdmin) {
            adminLink.style.display = 'block';
            profileLink.style.display = 'none';
        } else {
            profileLink.style.display = 'block';
            adminLink.style.display = 'none';
        }
    } else {
        loginLink.style.display = 'block';
        profileLink.style.display = 'none';
        logoutLink.style.display = 'none';
        adminLink.style.display = 'none';
    }

    logoutLink.addEventListener('click', function(event) {
        event.preventDefault();
        logout();
    });
});

async function signUp(event) {
    event.preventDefault();

    const city = document.getElementById('signUpC').value;
    const provinceState = document.getElementById('signUpPr').value;
    const username = document.getElementById('signUpU').value;
    const password = document.getElementById('signUpP').value;
    const phoneNo = document.getElementById('signUpPn').value;
    const email = document.getElementById('signUpE').value;
    const name = document.getElementById('signUpN').value;


    const response = await fetch('/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            City: city,
            ProvinceState:provinceState,
            Username: username,
            Password: password,
            PhoneNo: phoneNo,
            Email: email,
            Name: name
        })
    });

    const responseData = await response.json();

    const messageElement = document.getElementById('insertResultMsgSU');

    if (responseData.success) {
        messageElement.textContent = "Signed up successfully! You can log in now";
    } else {
        messageElement.textContent = "Error signing up!" +
            "Either Email or Phone Number or Username is already in Use";
    }
}


async function displayTopUser() {
        const response = await fetch('/topUser', {
            method: 'GET'
        });

        const responseData = await response.json();
        console.log(responseData);

        const topUserVal = document.getElementById('topUserVal');
        if (responseData.data.length > 0) {
            topUserVal.textContent = responseData.data.join(', ');
        } else {
            topUserVal.textContent = 'No top users yet!';
        }
}

async function displayTopRecipe() {
    console.log('in  display recipe');
    const response = await fetch('/topRecipe', {
        method: 'GET'
    });

    const responseData = await response.json();
    console.log(responseData);

    const topRecipeVal = document.getElementById('topRecipeVal');
    if (responseData.data.length > 0) {
        topRecipeVal.textContent = responseData.data.join(', ');
    } else {
        topRecipeVal.textContent = 'No top recipe yet!';
    }
}

async function displayQuickRecipe() {
    console.log('in  display recipe');
    const response = await fetch('/quickRecipe', {
        method: 'GET'
    });

    const responseData = await response.json();
    console.log(responseData);

    const quickRecipeVal = document.getElementById('quickRecipeVal');
    if (responseData.data.length > 0) {
        quickRecipeVal.textContent = responseData.data.join(', ');
    } else {
        quickRecipeVal.textContent = 'No quick recipe yet!';
    }
}


window.onload = function() {
    checkDbConnection();
    displayTopUser();
    displayTopRecipe();
    displayQuickRecipe()
    document.getElementById("loginform").addEventListener("submit", login);
    document.getElementById("signUpform").addEventListener("submit", signUp);
    //document.getElementById("topRecipe").addEventListener("click", displayTopRecipe);
};
