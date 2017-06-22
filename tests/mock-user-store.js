let allUsers = [];

const memoryBackendStore = {
  createUser: function createUser(email, hash, salt, confirmed = false) {
    const user = {
      email,
      passwordHash: hash,
      salt,
      confirmed,
    };

    allUsers.push(user);

    return user;
  },
  saveUser: function saveUser(newUser) {
    allUsers = allUsers.map(u => (u.email === newUser.email ? newUser : u));
  },
  getUser: function getUser(email) {
    return allUsers.find(u => u.email === email);
  },
  getUsers: function getAllUsers() {
    return allUsers;
  },
  clear: function clearUsers() {
    allUsers = [];
  },
};

export default memoryBackendStore;
