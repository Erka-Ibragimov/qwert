require("dotenv").config();
const jwt = require("jsonwebtoken");
const pool = require("../settings/mariadb");
let conn;
class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: "30s" });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
    return {
      accessToken,
      refreshToken,
    };
  }
  async saveToken(userId, refreshToken) {
    conn = await pool.getConnection();
    const tokenData = await conn.execute(`SELECT * FROM token where userId = ${userId}`);
    conn.end();
    delete tokenData.meta;
    if (tokenData[0]) {
      await conn.execute(
        `UPDATE token SET refreshToken = '${refreshToken}' where refreshToken = '${tokenData[0].refreshToken}' `
      );
      return;
    }
    await conn.execute(`INSERT INTO token (userId,refreshToken) VALUES ('${userId}','${refreshToken}')`);
    return;
  }
  async removeToken(refreshToken) {
    conn = await pool.getConnection();
    await conn.execute(`DELETE FROM token WHERE refreshToken='${refreshToken}'`);
    conn.end();
    return refreshToken;
  }
  async findFromDb(refreshToken) {
    conn = await pool.getConnection();
    const a = await conn.execute(`SELECT * FROM token where refreshToken = '${refreshToken}'`);
    conn.end();
    return a;
  }
  validateAccesseToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      return userData;
    } catch (e) {
      return null;
    }
  }
  validateRefreshToken(token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      return userData;
    } catch (e) {
      console.log("error");
      return null;
    }
  }
}

module.exports = new TokenService();
