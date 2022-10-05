require("dotenv").config();
const pool = require("../settings/mariadb");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailService = require("./mail-service");
const tokenService = require("./token-service");
const UserDto = require("../dtos/user.dto");
const ApiError = require("../exceptions/api-error");
let conn;
class UserService {
  async registration(email, password) {
    conn = await pool.getConnection();
    const candidate = await conn.execute(`SELECT email FROM superauth2 WHERE email = '${email}'`);
    conn.end();

    if (candidate[0]) {
      throw ApiError.BadRequest(`Пользователь с почтовым адрессом ${email} уже существует`);
    }

    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4();
    await conn.execute(
      `INSERT INTO superauth2 (email, password, activationLink) VALUES ('${email}','${hashPassword}','${activationLink}')`
    );
    const user = await conn.execute(`SELECT email,id,isActivated FROM superauth2 WHERE email = '${email}'`);
    conn.end();
    // await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`);
    const userDto = new UserDto(user[0]);
    console.log(...userDto);
    const tokens = tokenService.generateTokens({ ...userDto });

    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return {
      ...tokens,
      user: userDto,
    };
  }
  async activateItem(activationLink) {
    conn = await pool.getConnection();
    const user = await conn.execute(`SELECT email FROM superauth2 WHERE activationLink = '${activationLink}'`);
    delete user.meta;
    conn.end();
    if (!user[0]) {
      throw ApiError.BadRequest("Некоректная ссылка активации");
    }
    await conn.execute(`UPDATE superauth2 SET isActivated = '1' WHERE isActivated = '0'`);
  }
  async login(email, password) {
    conn = await pool.getConnection();
    const user = await conn.execute(`SELECT * FROM superauth2 WHERE email = '${email}'`);
    conn.end();
    if (!user[0]) {
      throw ApiError.BadRequest(`Пользователя с таким ${email} не найден`);
    }
    const isPassEquals = await bcrypt.compare(password, user[0].password);
    if (!isPassEquals) {
      throw ApiError.BadRequest("Не правильный пароль!");
    }
    const userDto = new UserDto(user[0]);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return {
      ...tokens,
      user: userDto,
    };
  }
  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }
  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findFromDb(refreshToken);
    if (!userData || !tokenFromDb[0]) {
      throw ApiError.UnauthorizedError();
    }
    conn = await pool.getConnection();
    const user = await conn.execute(`SELECT * FROM superauth2 WHERE id = '${tokenFromDb[0].userId}'`);
    conn.end();
    const userDto = new UserDto(user[0]);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);
    return {
      ...tokens,
      user: userDto,
    };
  }
  async getUsers() {
    conn = await pool.getConnection();
    const users = await conn.execute(`SELECT * FROM superauth2`);
    delete users.meta;
    conn.end();
    return users;
  }
}

module.exports = new UserService();
