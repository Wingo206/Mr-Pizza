// Tests for the static + dynamic routing system
const suppressOutput = require('../support/suppressOutput');
const request = require('supertest');
const jasmineCompat = require('../support/jasmineCompat');
let server;

describe('routing', () => {
   suppressOutput(() => {}, () => {
      // do this after suppressing output
      server = require('../../server');
   });
   it('should get 404 for undefined route', (done) => {
      request(server)
         .get('/thisisundefined')
         .set('Accept', 'text/plain')
         .expect('Content-type', 'text/plain')
         .expect(404)
         .expect('Resource not found for route /thisisundefined.')
         .end(jasmineCompat(done))
   })
   describe('/test route', () => {
      it('should require GET for /test', (done) => {
         request(server)
            .patch('/test')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(405)
            .expect('Method GET required for route /test.')
            .end(jasmineCompat(done))
      })
      it('should allow /test with GET', (done) => {
         request(server)
            .get('/test')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(200)
            .expect('test response')
            .end(jasmineCompat(done))
      })
   })
   describe('/test route with inputs', () => {
      it('should require post', (done) => {
         request(server)
            .get('/test/123')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(405)
            .expect('Method POST required for route /test/123.')
            .end(jasmineCompat(done))
      })
      it('should match with dynamic path\'s regex', (done) => {
         request(server)
            .post('/test/123')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(200)
            .expect('test response with input: 123')
            .end(jasmineCompat(done))
      })
      it('should only match with digits', (done) => {
         request(server)
            .post('/test/asdf')
            .set('Accept', 'text/plain')
            .expect('Content-type', 'text/plain')
            .expect(404)
            .expect('Resource not found for route /test/asdf.')
            .end(jasmineCompat(done))
      })
   })
})
