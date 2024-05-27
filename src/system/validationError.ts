import httpStatus from "http-status";

export class ValidationError {
  message: string;
  status: number;

  constructor(message: string) {
    this.status = httpStatus.BAD_REQUEST;
    this.message = message;
  }
}