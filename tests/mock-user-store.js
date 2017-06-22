let allUsers = [];

const memoryBackendStore = {
  saveUser: function saveUserInMemory(email, hash, salt, confirmed = false) {
    const user = {
      email,
      passwordHash: hash,
      salt,
      confirmed,
    };

    allUsers.push(user);
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
