class CachedTokens {
  constructor() {
    this.cachedData = {};
  }

  setToken(token, id) {
    if (!this.cachedData[id]) {
      this.cachedData[id] = new Set();
    }

    this.cachedData[id].add(token);

    // console.log("Cached Data: ",this.cachedData);
  }

  getToken(id) {
    if (this.cachedData[id]) {
      return this.cachedData[id];
    } else return null;
  }

  getAllTokens() {
    if (Object.keys(this.cachedData).length) {
      return Object.values(this.cachedData);
    } else return null;
  }

  delTokenKey(id) {
    delete this.cachedData[id];
  }
}

module.exports = { CachedTokens };
