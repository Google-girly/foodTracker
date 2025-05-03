document.querySelector("form").addEventListener("submit", function (event) {
    const username = document.querySelector("input[name='username']").value;
    const password = document.querySelector("input[name='password']").value;

    let isValid = true;

    if (username.length < 3) {
        alert("Username must be at least 3 characters.");
        isValid = false;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        isValid = false;
    }

    if (!isValid) {
        event.preventDefault(); 
    }
});
