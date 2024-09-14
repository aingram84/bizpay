document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('user-select'); // User dropdown for calculating pay
    const editUserSelect = document.getElementById('edit-user-select'); // Dropdown for editing users
    const modifyUserSelect = document.getElementById('modify-user-select'); // Dropdown for modifying users
    const userListDisplay = document.getElementById('user-list'); // List to display all users
    const displayUsersBtn = document.getElementById('display-users-btn'); // Button to display users

    const jobList = document.getElementById('job-select'); // Job dropdown
    const payResult = document.getElementById('pay-result'); // Div to show pay result
    const addUserForm = document.getElementById('add-user-form'); // Add user form
    const editUserForm = document.getElementById('edit-user-form'); // Edit user form
    const modifyUserForm = document.getElementById('modify-user-form'); // Modify user form
    const calculatePayForm = document.getElementById('calculate-pay-form'); // Pay calculation form
    const startTimeDropdown = document.getElementById('start-time'); // Start time dropdown
    const endTimeDropdown = document.getElementById('end-time'); // End time dropdown
    const billsInfo = document.getElementById('bills-info'); // Div to display bills information

    // Handle collapsible logic for "Manage Users" section
    const collapsibleButton = document.querySelector('.collapsible');
    const collapsibleContent = document.querySelector('.content');

    collapsibleButton.addEventListener('click', function () {
        collapsibleContent.style.display = (collapsibleContent.style.display === 'block') ? 'none' : 'block';
    });

    // Function to populate the start and end time dropdowns with 15-minute intervals
    const populateTimeDropdown = (dropdown) => {
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                let hour12 = hour % 12 || 12; // Convert 24-hour to 12-hour format
                let period = hour < 12 ? 'AM' : 'PM';
                let timeString = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
                
                const option = document.createElement('option');
                option.value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`; // Keep the value in 24-hour format
                option.textContent = timeString; // Display in 12-hour format
                dropdown.appendChild(option);
            }
        }
    };

    // Populate the start and end time dropdowns
    populateTimeDropdown(startTimeDropdown);
    populateTimeDropdown(endTimeDropdown);

    // Function to fetch and display users in the dropdowns and list
    const fetchUsers = async () => {
        const response = await fetch('/api/users');
        const users = await response.json();
        displayUsersInDropdowns(users);
        displayUsersInList(users);
    };

    // Function to populate the user dropdowns for editing and modifying
    const displayUsersInDropdowns = (users) => {
        userList.innerHTML = ''; // Clear user dropdown for calculating pay
        editUserSelect.innerHTML = ''; // Clear edit user dropdown
        modifyUserSelect.innerHTML = ''; // Clear modify user dropdown

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (Rate: $${user.rateOfPay}/hr)`;
            
            userList.appendChild(option.cloneNode(true));
            editUserSelect.appendChild(option.cloneNode(true));
            modifyUserSelect.appendChild(option.cloneNode(true));
        });
    };

    // Function to display users in a list
    const displayUsersInList = (users) => {
        userListDisplay.innerHTML = ''; // Clear user list
        users.forEach(user => {
            const listItem = document.createElement('li');
            listItem.textContent = `${user.name} (Rate: $${user.rateOfPay}/hr)`;
            userListDisplay.appendChild(listItem);
        });
    };

    // Handle adding a new user
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const rateOfPay = document.getElementById('rateOfPay').value;

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, rateOfPay })
        });

        if (response.ok) {
            fetchUsers(); // Refresh the user list
            addUserForm.reset(); // Reset the form
        } else {
            console.error('Error adding user');
        }
    });

    // Handle editing a user
    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = editUserSelect.value;
        const newName = document.getElementById('edit-name').value;
        const newRateOfPay = document.getElementById('edit-rateOfPay').value;

        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName, rateOfPay: newRateOfPay })
        });

        if (response.ok) {
            fetchUsers(); // Refresh the user list
            editUserForm.reset(); // Reset the form
        } else {
            console.error('Error editing user');
        }
    });

    // Handle modifying a user's rate of pay
    modifyUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = modifyUserSelect.value;
        const modifyAction = document.getElementById('modify-action').value;
        const modifyRate = parseFloat(document.getElementById('modify-rate').value);

        const response = await fetch(`/api/users/${userId}`);
        const user = await response.json();

        let updatedRate = user.rateOfPay;
        if (modifyAction === 'Increase Rate') {
            updatedRate += modifyRate;
        } else if (modifyAction === 'Decrease Rate') {
            updatedRate -= modifyRate;
        }

        const updateResponse = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rateOfPay: updatedRate })
        });

        if (updateResponse.ok) {
            fetchUsers(); // Refresh the user list
            modifyUserForm.reset(); // Reset the form
        } else {
            console.error('Error modifying user');
        }
    });

    // Handle displaying the user list
    displayUsersBtn.addEventListener('click', () => {
        fetchUsers();
    });

    // Initial fetch of users when the page loads
    fetchUsers();
});
