document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('user-select'); // User dropdown
    const jobList = document.getElementById('job-select'); // Job dropdown
    const payResult = document.getElementById('pay-result'); // Div to show pay result
    const addUserForm = document.getElementById('add-user-form'); // Add user form
    const calculatePayForm = document.getElementById('calculate-pay-form'); // Pay calculation form
    const startTimeDropdown = document.getElementById('start-time'); // Start time dropdown
    const endTimeDropdown = document.getElementById('end-time'); // End time dropdown
    const billsInfo = document.getElementById('bills-info'); // Div to display bills information

    // Running tally for each job and user payout tracking
    let ecTotal = 0;
    let fhTotal = 0;
    let ecUsers = []; // Store objects with user name and their payout for EC
    let fhUsers = []; // Store objects with user name and their payout for FH

    // Function to calculate the fewest bills for a given amount using 20s, 10s, 5s, and 1s
    const calculateFewestBills = (amount) => {
        const denominations = [20, 10, 5, 1];
        let remaining = Math.floor(amount); // We don't deal with coins
        const bills = {};

        for (const denom of denominations) {
            bills[denom] = Math.floor(remaining / denom);
            remaining %= denom;
        }

        return bills;
    };

    // Function to display the fewest bills under the "Add New User" section
    const displayBillsInfo = (name, amount) => {
        const bills = calculateFewestBills(amount);
        billsInfo.textContent = `Pay ${name} with: ${bills[20]} x $20, ${bills[10]} x $10, ${bills[5]} x $5, ${bills[1]} x $1`;
    };

    // Update displayed totals for jobs
    const updateJobTotals = () => {
        // Sort users by pay, highest to lowest
        ecUsers.sort((a, b) => b.pay - a.pay);
        fhUsers.sort((a, b) => b.pay - a.pay);

        // Format user list with clickable names and their respective payout
        const formatUserList = (users) => {
            return users.map(user => {
                const span = document.createElement('span');
                span.textContent = `${user.name} ($${user.pay.toFixed(2)})`;
                span.className = 'clickable';
                span.addEventListener('click', () => displayBillsInfo(user.name, user.pay));
                return span;
            });
        };

        // Update EC and FH totals
        const ecTotalElement = document.getElementById('ec-total');
        const fhTotalElement = document.getElementById('fh-total');
        
        ecTotalElement.textContent = `EC Total: $${ecTotal.toFixed(2)} | `;
        fhTotalElement.textContent = `FH Total: $${fhTotal.toFixed(2)} | `;

        // Append clickable names
        formatUserList(ecUsers).forEach(span => ecTotalElement.appendChild(span));
        formatUserList(fhUsers).forEach(span => fhTotalElement.appendChild(span));
    };

    // Populate time dropdown with 15-minute intervals in 12-hour format with AM/PM
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

    // Fetch and display users in the dropdown
    const fetchUsers = async () => {
        const response = await fetch('/api/users');
        const users = await response.json();
        displayUsers(users);
    };

    // Function to populate users in the dropdown
    const displayUsers = (users) => {
        userList.innerHTML = ''; // Clear the dropdown
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (Rate: $${user.rateOfPay}/hr)`;
            userList.appendChild(option);
        });
    };

    // Handle form submission to add a new user
    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const rateOfPay = document.getElementById('rateOfPay').value;

        // Send POST request to add a new user
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

        // Get selected user info
        const response = await fetch('/api/users');
        const users = await response.json();
        const user = users.find(u => u.id == userId);

        if (user) {
            // Calculate the total time worked in 15-minute intervals
            const totalMilliseconds = endDateTime - startDateTime;
            const totalMinutes = totalMilliseconds / (1000 * 60); // Convert milliseconds to minutes
            const intervals = totalMinutes / 15; // 15-minute intervals
            const hoursWorked = totalMinutes / 60; // Convert minutes to hours
            const totalPay = hoursWorked * user.rateOfPay;

            // Categorize payouts by job and keep track of users and their individual payout
            if (selectedJob === 'EC') {
                ecTotal += totalPay;
                const existingUser = ecUsers.find(u => u.name === user.name);
                if (existingUser) {
                    existingUser.pay += totalPay; // Add to the existing user's total
                } else {
                    ecUsers.push({ name: user.name, pay: totalPay }); // Add new user with their payout
                }
            } else if (selectedJob === 'FH') {
                fhTotal += totalPay;
                const existingUser = fhUsers.find(u => u.name === user.name);
                if (existingUser) {
                    existingUser.pay += totalPay; // Add to the existing user's total
                } else {
                    fhUsers.push({ name: user.name, pay: totalPay }); // Add new user with their payout
                }
            }

            // Update the job totals display
            updateJobTotals();

            // Display the calculated pay and intervals
            payResult.textContent = `${user.name} worked ${hoursWorked.toFixed(2)} hours (${intervals} intervals of 15 minutes) on ${selectedJob}. Total Pay: $${totalPay.toFixed(2)}`;
        } else {
            payResult.textContent = "User not found.";
        }
    });

    // Initial fetch of users when the page loads
    fetchUsers();
});
