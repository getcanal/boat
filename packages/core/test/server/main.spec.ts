import 'mocha';

import * as supertest from 'supertest';

import { app } from './main';
import { check } from '../util';
import { expect } from 'chai';

describe('Application Bootstrap', () => {
    it('should return 200 code from HTTP call', (done) => {
        supertest(app)
            .get('/')
            .expect(200, done);
    });
    it('should get "success" from HTTP call', (done) => {
        supertest(app)
            .get('/')
            .expect('success', done);
    });
    it('should not return "hello" from an HTTP call', (done) => {
        supertest(app)
            .get('/')
            .then((response: supertest.Response) => {
                check(() => {
                    expect(response.text).to.not.equal('hello');
                }, done);
            });
    });
    it('should not return 400 from an HTTP call', (done) => {
        supertest(app)
            .get('/')
            .then((response: supertest.Response) => {
                check(() => {
                    expect(response.status).to.not.equal(400);
                }, done);
            });
    });
});
