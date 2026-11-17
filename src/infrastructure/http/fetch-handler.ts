import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import type { NextFunction, Request as ExpressRequest, RequestHandler, Response as ExpressResponse } from 'express';

export type FetchHandler = (request: Request) => Promise<Response>;

export function toExpressHandler(handler: FetchHandler): RequestHandler {
  return async (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
          value.forEach((item) => headers.append(name, item));
        } else if (value !== undefined) {
          headers.set(name, value);
        }
      }

      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const fetchRequest = new Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
        method: req.method,
        headers,
        ...(hasBody ? { body: Readable.toWeb(req) as unknown as BodyInit, duplex: 'half' } : {}),
      });

      const fetchResponse = await handler(fetchRequest);

      res.status(fetchResponse.status);
      fetchResponse.headers.forEach((value, name) => {
        if (name !== 'set-cookie') res.setHeader(name, value);
      });
      const cookies = fetchResponse.headers.getSetCookie();
      if (cookies.length > 0) res.setHeader('set-cookie', cookies);

      if (!fetchResponse.body) {
        res.end();
        return;
      }
      Readable.fromWeb(fetchResponse.body as unknown as WebReadableStream).pipe(res);
    } catch (error) {
      next(error);
    }
  };
}
