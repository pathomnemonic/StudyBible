/** An error from the account or sync service: `status` is the HTTP-style code (0 means it could not be reached, 401 means not signed in). */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
