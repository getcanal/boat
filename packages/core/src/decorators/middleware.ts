import { TypeDecorator, makeDecorator } from './util';

// export interface Middleware { }

export interface MiddlewareDecorator {
    (): TypeDecorator;

    new(): any;
}


export const Middleware: MiddlewareDecorator =
    <MiddlewareDecorator>makeDecorator('Middleware');