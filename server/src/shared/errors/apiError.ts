export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Array<{ field: string; code: string }>,
  ) {
    super(message);
  }
}

