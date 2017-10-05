import 'reflect-metadata';

import * as chalk from 'chalk';
import * as express from 'express';
import * as path from 'path';

import { Injector, Provider, ReflectiveInjector } from 'injection-js';
import { getModule, isFunction, joinPath, unique } from './util';

import { App } from '../../app';
import { Application } from 'express';
import { Controller } from '../../decorators/controller';
import { Express } from 'express-serve-static-core';
import { Middleware } from '../../decorators/middleware';
import { ModWithProviders } from '../../interfaces/module_with_providers';
import { Module } from '../../decorators/module';
import { Route } from '../../decorators/route';

/**
 * @description The method to start up a Orbital instance.
 * This compiles all of the dependencies and prepares them to be served.
 *
 * @param {Module} mod
 * @returns {void}
 */
export function bootstrap(mod: any): Application {

    /* We strip some data from the type annotation on the module. */
    let middlewares: any[] = cycleMiddlewares([mod]);
    let providers: Provider[] = cycleProviders([mod]);
    let controllers: Controller[] = cycleControllers([mod]);
    let annotations: Module = Reflect.getMetadata('annotations', mod)[0];


    /* Use Angular's dependency injection to assosciate all providers to their respective places */
    let injector: ReflectiveInjector = ReflectiveInjector.resolveAndCreate(<any[]>[
        { provide: App, useValue: express() },
        ...controllers, ...providers, ...middlewares]);

    let app: Express = injector.get(App);

    const config = annotations.config || {};
    if (config.engine) app.engine(config.engine.name, config.engine.engine);
    buildMiddlewares(middlewares, injector, app);

    /* Notify express of all of the routes */
    controllers.forEach((route: any) => {
        useRoute(injector, route, app);
    });

    /* Now we set up the listener and are ready to take requests. */
    const port = config && config.port ? config.port : process.env.PORT ? process.env.PORT : 8080;
    app.listen(port);
    console.info(chalk.green('LISTENING ON PORT ' + port));

    return app;
}

function useRoute(injector: Injector, route: Route, router: any) {
    const rt = injector.get(route);
    const routeAnnotation = Reflect.getMetadata('annotations', route);
    if (!routeAnnotation.path) routeAnnotation.path = '/';
    const propAnnotation: { [propName: string]: Route }[] = Reflect.getMetadata('propMetadata', rt['constructor']);
    for (let prop in propAnnotation) {
        const method: Route = propAnnotation[prop][0];
        method.method = method.method || 'get';
        method.path = method.path || '/';
        router[method.method](path.join(routeAnnotation.path, method.path), (req: express.Request, res: express.Response, next: express.NextFunction) => rt[prop](req, res, next));
    }
}

const cycleProviders = (modules: (Module | ModWithProviders)[] = []): Provider[] => {
    let providers: Provider[] = [];
    modules.forEach(mod => {
        let annotation: Module = getModule(mod);
        if ((<ModWithProviders>mod).obModule && (<ModWithProviders>mod).providers) {
            providers = providers.concat(mod.providers || []);
        } else {
            providers = providers.concat(annotation.providers || []);
        }

        if (annotation.imports) {
            providers = providers.concat(cycleProviders(annotation.imports));
        }
    });

    return providers;
};

const cycleMiddlewares = (modules: (Module | ModWithProviders)[] = [], prefix: string = '/'): any[] => {
    let middlewares: any[] = [];

    if (modules) {
        modules.forEach(mod => {
            let annotation: Module = getModule(mod);

            const modPath = (annotation.config ? annotation.config.path || '/' : '/');
            if (annotation.middlewares) {
                for (let middleware of annotation.middlewares) {
                    const note = Reflect.getMetadata('annotations', middleware.provider || middleware);
                    let m: Middleware = note && note[0] ? note[0] : {};
                    m.path = path.join(prefix || '/', modPath || '/', m.path || '/');
                    Reflect.defineMetadata('annotations', m, middleware.provider || middleware);
                    middlewares.push(middleware);
                }
            }

            if (annotation.imports) {
                const p = path.join(prefix, modPath);
                middlewares = middlewares.concat(cycleMiddlewares(annotation.imports, p));
            }
        });
    }

    return middlewares;
};

const cycleControllers = (modules: (Module | ModWithProviders)[] = [], prefix: string = '/'): Controller[] => {
    let routes: Controller[] = [];

    modules.forEach((mod) => {
        let annotation: Module = getModule(mod);

        const modPath = (annotation.config ? annotation.config.path || '/' : '/');

        if (annotation.controllers) {
            for (let route of annotation.controllers) {
                let controller: Controller = Reflect.getMetadata('annotations', route)[0];
                controller.path = path.join(prefix || '/', modPath || '/', controller.path || '/');
                Reflect.defineMetadata('annotations', controller, route);
                routes.push(route);
            }
        }

        if (annotation.imports) {
            const p = path.join(prefix, modPath);
            routes = routes.concat(cycleControllers(annotation.imports, p));
        }

    });

    return routes;
};
function buildMiddlewares(middlewares: any[], injector: ReflectiveInjector, app: Express) {
    middlewares.forEach((middleware: any) => {
    let m = injector.get (middleware);
    let annotation = Reflect.getMetadata('annotations', middleware);
    app.use(annotation && annotation.path?annotation.path: '/', (req: express.Request, res: express.Response, next: express.NextFunction) => m.use(req, res, next));
});
}
