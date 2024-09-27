document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('user-select'); // User dropdown for calculating pay
    const editUserSelect = document.getElementById('edit-user-select'); // Dropdown for editing users
    const userListDisplay = document.getElementById('user-list'); // List to display all users

    const jobList = document.getElementById('job-select'); // Job dropdown
    const payResult = document.getElementById('pay-result'); // Div to show pay result
    const addUserForm = document.getElementById('add-user-form'); // Add user form
    const editUserForm = document.getElementById('edit-user-form'); // Edit user form
    const calculatePayForm = document.getElementById('calculate-pay-form'); // Pay calculation form
    const startTimeDropdown = document.getElementById('start-time'); // Start time dropdown
    const endTimeDropdown = document.getElementById('end-time'); // End time dropdown
    const billsInfo = document.getElementById('bills-info'); // Div to display bills information

    const ecTotalElement = document.getElementById('ec-total'); // EC total element
    const fhTotalElement = document.getElementById('fh-total'); // FH total element

    let ecTotal = 0;
    let fhTotal = 0;
    let ecUsers = [];
    let fhUsers = [];

    // Handle collapsible logic for both "Manage Users" and "Money Calculator" sections
    const collapsibleButtons = document.querySelectorAll('.collapsible');
    collapsibleButtons.forEach(button => {
        button.addEventListener('click', function () {
            const content = this.nextElementSibling;
            content.style.display = (content.style.display === 'block') ? 'none' : 'block';
        });
    });

    // Money Calculator Section
    const moneyCalculatorForm = document.getElementById('money-calculator-form');
    const moneyReceivedInput = document.getElementById('money-received');
    const rateInput = document.getElementById('rate');
    const moneyCalculationResult = document.getElementById('money-calculation-result');

    moneyCalculatorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const moneyReceived = parseFloat(moneyReceivedInput.value);
        const rate = parseFloat(rateInput.value);
        
        if (!isNaN(moneyReceived) && !isNaN(rate) && rate !== 0) {
            const result = (moneyReceived / rate).toFixed(2);
            moneyCalculationResult.textContent = `Paid for ${result} hours`;
        } else {
            moneyCalculationResult.textContent = "Please enter valid numbers and ensure rate is not 0.";
        }
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

    // Set default Start Time to 5:45 PM
    startTimeDropdown.value = '17:45';

    // Set default End Time to 1:00 AM
    endTimeDropdown.value = '01:00';

    // Function to calculate the fewest bills for a given amount using 20s, 10s, 5s, and 1s
    const calculateFewestBills = (amount) => {
        const denominations = [20, 10, 5, 1];
        let remaining = Math.floor(amount); // Ignore decimals
        const bills = {};

        for (const denom of denominations) {
            bills[denom] = Math.floor(remaining / denom);
            remaining %= denom;
        }

        return bills;
    };

    // Function to display the fewest bills under the "Bill Breakdown" section
    const displayBillsInfo = (name, amount) => {
        const bills = calculateFewestBills(amount);
        billsInfo.textContent = `Pay ${name} with: ${bills[20]} x $20, ${bills[10]} x $10, ${bills[5]} x $5, ${bills[1]} x $1`;
    };

    // Function to update the displayed totals for EC and FH
    const updateJobTotals = () => {
        const formatUserList = (users) => {
            return users.map(user => `${user.name} ($${user.pay.toFixed(2)})`).join(', ');
        };

        ecTotalElement.textContent = `EC Total: $${ecTotal.toFixed(2)} (Users: ${formatUserList(ecUsers)})`;
        fhTotalElement.textContent = `FH Total: $${fhTotal.toFixed(2)} (Users: ${formatUserList(fhUsers)})`;
    };

    // Function to populate the user dropdowns
    const populateUserDropdowns = (users) => {
        userList.innerHTML = ''; // Clear existing dropdown options
        editUserSelect.innerHTML = '';

        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (Rate: $${user.rateOfPay}/hr)`;

            userList.appendChild(option.cloneNode(true));
            editUserSelect.appendChild(option.cloneNode(true));
        });
    };

    // Function to display the users in a persistent list
    const displayUsers = (users) => {
        userListDisplay.innerHTML = ''; // Clear the existing user list
        users.forEach(user => {
            const listItem = document.createElement('li');
            listItem.textContent = `${user.name} (Rate: $${user.rateOfPay}/hr)`;
            userListDisplay.appendChild(listItem);
        });
    };

    // Fetch users and populate dropdowns and display list
    const fetchUsers = async () => {
        const response = await fetch('/api/users');
        const users = await response.json();
        populateUserDropdowns(users); // Update dropdowns
        displayUsers(users); // Persistently display user list
    };

    // Handle form submission to add a new user
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the form from reloading the page
        const name = document.getElementById('name').value;
        const rateOfPay = document.getElementById('rateOfPay').value;

        if (!name || !rateOfPay) {
            console.error('Name and Rate of Pay must not be empty.');
            return;
        }

        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, rateOfPay })
        });

        if (response.ok) {
            await fetchUsers(); // Refresh the dropdown with the new user
            addUserForm.reset(); // Reset the form fields
            collapsibleContent.style.display = 'block'; // Ensure the section remains open after adding a user
        } else {
            console.error('Error adding user');
        }
    });

    // Handle form submission to edit a user (either New Name or New Rate of Pay can be provided)
    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = editUserSelect.value;
        const newName = document.getElementById('edit-name').value;
        const newRateOfPay = document.getElementById('edit-rateOfPay').value;

        if (!userId) {
            console.error('User must be selected.');
            return;
        }

        // Prepare the updated user data, ensuring that only provided fields are included
        const updatedUser = {};
        if (newName) updatedUser.name = newName;
        if (newRateOfPay) updatedUser.rateOfPay = newRateOfPay;

        if (Object.keys(updatedUser).length === 0) {
            console.error('Either New Name or New Rate of Pay must be provided.');
            return;
        }

        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser)
        });

        if (response.ok) {
            fetchUsers(); // Refresh the user list
            editUserForm.reset(); // Reset the form
        } else {
            const errorDetails = await response.json();
            console.error('Error editing user:', errorDetails);
        }
    });

    // Handle form submission to calculate pay
    calculatePayForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = userList.value;
        const selectedJob = jobList.value;
        const startTime = startTimeDropdown.value;
        const endTime = endTimeDropdown.value;

        // Convert the selected times to Date objects
        const startDateTime = new Date(`1970-01-01T${startTime}:00`);
        let endDateTime = new Date(`1970-01-01T${endTime}:00`);

        // If end time is before start time, assume the end time is on the following day
        if (endDateTime <= startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1);
        }

        const response = await fetch('/api/users');
        const users = await response.json();
        const user = users.find(u => u.id == userId);

        if (user) {
            const totalMilliseconds = endDateTime - startDateTime;
            const totalMinutes = totalMilliseconds / (1000 * 60); // Convert milliseconds to minutes
            const intervals = totalMinutes / 15; // 15-minute intervals
            const hoursWorked = totalMinutes / 60; // Convert minutes to hours
            const totalPay = hoursWorked * user.rateOfPay;

            if (selectedJob === 'EC') {
                ecTotal += totalPay;
                const existingUser = ecUsers.find(u => u.name === user.name);
                if (existingUser) {
                    existingUser.pay += totalPay; // Add to existing user's total
                } else {
                    ecUsers.push({ name: user.name, pay: totalPay });
                }
            } else if (selectedJob === 'FH') {
                fhTotal += totalPay;
                const existingUser = fhUsers.find(u => u.name === user.name);
                if (existingUser) {
                    existingUser.pay += totalPay;
                } else {
                    fhUsers.push({ name: user.name, pay: totalPay });
                }
            }

            // Update the job totals and show the fewest bills
            updateJobTotals();
            displayBillsInfo(user.name, totalPay);

            payResult.textContent = `User ${user.name} worked ${hoursWorked.toFixed(2)} hours (${intervals} intervals of 15 minutes) on ${selectedJob}. Total Pay: $${totalPay.toFixed(2)}`;
        } else {
            payResult.textContent = "User not found.";
        }
    });

    // Initial fetch of users when the page loads
    fetchUsers();
});
