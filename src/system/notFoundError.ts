import httpStatus from "http-status";

export class NotFoundError {
  message: string;
  status: number;

  constructor(message: string) {
    this.status = httpStatus.NOT_FOUND;
    this.message = message;
  }
}