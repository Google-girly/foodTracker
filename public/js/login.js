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

// Form validation
document.querySelector("form").addEventListener("submit", validateAuthor);

function validateAuthor(event) {
    let username = document.querySelector("input[name='username']").value;
    let isValid = true;

    if (username.length < 3) {
        alert("Username should at least have 3 characters!");
        isValid = false;
    }

    if (!isValid) {
        event.preventDefault(); // stops the form from submitting
    }
}