let users = []; // In-memory store for users

// Function to add a new user
const addUser = (name, rateOfPay) => {
  const newUser = { id: users.length + 1, name, rateOfPay };
  users.push(newUser);
  return newUser;
};

// Function to remove a user by ID
const removeUser = (id) => {
  const index = users.findIndex(user => user.id === id);
  if (index !== -1) {
    const removedUser = users.splice(index, 1);
    return removedUser;
  }
  return null;
};

// Function to update a user's name or rate of pay by ID
const updateUser = (id, updates) => {
  const user = users.find(user => user.id === id);
  if (user) {
    user.name = updates.name || user.name;
    user.rateOfPay = updates.rateOfPay || user.rateOfPay;
    return user;
  }
  return null;
};

// Function to get all users
const getUsers = () => {
  return users;
};

module.exports = {
  addUser,
  removeUser,
  updateUser,
  getUsers,
};
