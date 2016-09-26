/*jshint expr: true*/

import jwt from 'jsonwebtoken';
import omit from 'lodash.omit';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { verifyToken } from '../../../../src/middleware';

chai.use(sinonChai);

describe('middleware:rest:verifyToken', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      app: {
        get: () => { return {}; }
      },
      feathers: {}
    };
    res = {};
    next = sinon.spy();
  });

  afterEach(() => {
    next.reset();
  });

  describe('when token is not present', () => {
    it('calls next', () => {
      verifyToken()(req, res, next);
      expect(next).to.be.calledOnce;
    });
  });

  describe('when secret is missing', () => {
    beforeEach(() => req.token = 'token');

    it('it throws an error', () => {
      try {
        verifyToken()(req, res, next);
      }
      catch(error) {
        expect(error).to.not.equal(undefined);
      }
    });
  });

  describe('when token and secret are present', () => {
    const options = {
      issuer: 'feathers',
      subject: 'auth',
      expiresIn: '5m',
      secret: 'secret',
      algorithm: 'HS256'
    };
    const payload = { id: 1 };

    beforeEach(() => {
      req.app.get = () => {
        return {
          token: { secret: 'secret' }
        };
      };

      req.token = 'invalid';
    });

    describe('when token is invalid', () => {
      it('does not assign the payload', done => {
        verifyToken()(req, res, () => {
          expect(req.payload).to.equal(undefined);
          expect(req.feathers.payload).to.equal(undefined);
          done();
        });
      });

      it('calls next', done => {
        verifyToken()(req, res, done);
      });
    });

    describe('when token is valid', () => {
      it('sets the token payload', done => {
        req.token = jwt.sign(payload, 'secret', omit(options, 'secret'));

        verifyToken(options)(req, res, () => {
          expect(typeof req.feathers.payload).to.equal('object');
          expect(typeof req.payload).to.equal('object');
          expect(req.feathers.payload.id).to.equal(payload.id);
          done();
        });
      });

      it('flags the request as authenticated', done => {
        req.token = jwt.sign(payload, 'secret', omit(options, 'secret'));
        
        verifyToken(options)(req, res, () => {
          expect(req.feathers.authenticated).to.equal(true);
          expect(req.authenticated).to.equal(true);
          done();
        });
      });

      it('calls next', done => {
        verifyToken()(req, res, done);
      });
    });
  });
});