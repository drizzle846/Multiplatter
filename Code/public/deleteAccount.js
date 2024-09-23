async function deleteAccount(event) {
    event.preventDefault();

    const phoneNo = document.getElementById('deletePn').value;

    const response = await fetch('/api/user/deleteAccount', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            PhoneNo: phoneNo,
        })
    });

    const responseData = await response.json();

    const messageElement = document.getElementById('insertResultMsgD');

    if (responseData.success) {
        messageElement.textContent = "Deleted your account!";
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        window.location.href = 'signIn.html';
    } else {
        messageElement.textContent = "error deleting account!";
    }
}

window.onload = function() {
    checkDbConnection();
    document.getElementById("deleteform").addEventListener("submit",deleteAccount);
};
