window.onload = function () {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    
    const dateField = document.getElementById('dateFood');
    if (dateField) {
        dateField.value = formattedDate;
    }
};

document.querySelector("form").addEventListener("submit", function (event) {
    const username = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;

    let isValid = true;


    if (username.trim() === "") {
        alert("Username cannot be empty.");
        isValid = false;
    }

    if (password.trim() === "") {
        alert("Password cannot be empty.");
        isValid = false;
    }


    if (!isValid) {
        event.preventDefault();
    }
});