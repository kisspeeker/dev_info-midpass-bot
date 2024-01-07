const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const ORDER_TABLE_NAME = 'midpass_order';
const USER_TABLE_NAME = 'telegram_user';

async function createDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./strapi.sqlite', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

async function createTables(db) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      CREATE TABLE IF NOT EXISTS ${USER_TABLE_NAME} (
        id INTEGER PRIMARY KEY,
        firstName TEXT,
        lastName TEXT,
        userName TEXT,
        isBlocked BOOLEAN,
        createdAt DATETIME,
        updatedAt DATETIME
      )
    `,
      (err) => {
        if (err) {
          reject(err);
        } else {
          db.run(
            `
          CREATE TABLE IF NOT EXISTS ${ORDER_TABLE_NAME} (
            uid TEXT PRIMARY KEY,
            shortUid TEXT,
            userId INTEGER,
            sourceUid TEXT,
            receptionDate DATE,
            statusId INTEGER,
            statusName TEXT,
            statusDescription TEXT,
            statusColor TEXT,
            statusSubscription INTEGER,
            statusInternalName TEXT,
            statusPercent INTEGER,
            isDeleted BOOLEAN,
            createdAt DATETIME,
            updatedAt DATETIME,
            FOREIGN KEY (userId) REFERENCES ${USER_TABLE_NAME}(id)
          )
        `,
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            },
          );
        }
      },
    );
  });
}

async function insertData(db, jsonData) {
  return new Promise((resolve, reject) => {
    const insertPromises = jsonData.map(async (entry) => {
      await new Promise((resolve, reject) => {
        db.run(
          `
          INSERT OR IGNORE INTO ${USER_TABLE_NAME} (id, firstName, lastName, userName, isBlocked, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
          [
            entry.chatId,
            entry.firstName,
            entry.lastName,
            entry.userName,
            false,
            entry.createdAt,
            entry.updatedAt,
          ],
          (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          },
        );
      });

      if (entry.codes && entry.codes.length > 0) {
        const insertCodesPromises = entry.codes.map(async (code) => {
          await new Promise((resolve, reject) => {
            db.run(
              `
        INSERT OR IGNORE INTO ${ORDER_TABLE_NAME} (
          uid, shortUid, userId, sourceUid, receptionDate,
          statusId, statusName, statusDescription, statusColor,
          statusSubscription, statusInternalName, statusPercent,
          isDeleted, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
              [
                code.uid,
                code.shortUid,
                entry.chatId,
                code.sourceUid,
                code.receptionDate,
                code.passportStatus.id,
                code.passportStatus.name,
                code.passportStatus.description,
                code.passportStatus.color,
                code.passportStatus.subscription,
                code.internalStatus.name,
                code.internalStatus.percent,
                false,
                new Date().toISOString(),
                new Date().toISOString(),
              ],
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              },
            );
          });
        });

        await Promise.all(insertCodesPromises);
      }
    });

    Promise.all(insertPromises)
      .then(() => resolve())
      .catch((err) => reject(err));
  });
}

async function main() {
  try {
    const rawData = fs.readFileSync('./strapi.json');
    const jsonData = JSON.parse(rawData);

    const db = await createDatabase();
    await createTables(db);
    await insertData(db, jsonData);
    db.close();
    console.log('Database successfully created and data inserted.');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
