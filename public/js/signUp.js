document.querySelector("form").addEventListener("submit", function (event) {
    const username = document.querySelector("input[name='userName']").value;  
    const password = document.querySelector("input[name='password']").value;
    const age = document.querySelector("input[name='age']").value;
    let isValid = true;

  
    if (username.length < 3) {
        alert("Username must be at least 3 characters.");
        isValid = false;
    }

  
    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        isValid = false;
    }

    if (age < 18 || age > 120) {
        alert("Must be a valid age!"); 
        isValid = false;
    }


    if (!isValid) {
        event.preventDefault(); 
    }
});
