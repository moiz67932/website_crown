declare module 'better-sqlite3' {
  interface BetterSqlite3Database {
    prepare: (...args: any[]) => any;
    transaction: (...args: any[]) => any;
    exec: (...args: any[]) => any;
    pragma: (...args: any[]) => any;
    close: () => void;
  }
  const Database: any;
  export default Database;
}
