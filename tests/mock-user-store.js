let allUsers = [];

const memoryBackendStore = {
  saveUser: function saveUserInMemory(email, hash, salt) {
    const user = {
      email,
      passwordHash: hash,
      salt,
      confirmed: false,
    };

    allUsers.push(user);
  },
  getUsers: function getAllUsers() {
    return allUsers;
  },
  clear: function clearUsers() {
    allUsers = [];
  },
};

export default memoryBackendStore;
