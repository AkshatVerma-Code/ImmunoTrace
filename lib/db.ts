import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var mysqlPool: mysql.Pool | undefined;
}

export const pool =
  global.mysqlPool ||
  mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "immunotrace",
    waitForConnections: true,
    connectionLimit: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.mysqlPool = pool;
}
