import { Response } from "express";
import { BadRequestError } from "../system/badRequestError";
import { InternalError } from "../system/internalError";
import { ValidationError } from "../system/validationError";
import { NotFoundError } from "../system/notFoundError";

const errorHandler = (err: any, res: Response) => {
  if (err instanceof BadRequestError || err instanceof ValidationError || err instanceof NotFoundError) {
    return res.status(err.status).send({ message: err.message });
  }

  const { message, status: httpStatus } = new InternalError(err);
  return res.status(httpStatus).send({ message });
};

export default errorHandler;
