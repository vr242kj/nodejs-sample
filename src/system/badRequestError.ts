import httpStatus from "http-status";

export class BadRequestError {
  message: string;
  status: number;

  constructor(message: string) {
    this.status = httpStatus.BAD_REQUEST;
    this.message = message;
  }
}