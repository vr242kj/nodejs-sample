import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import sinonChai from "sinon-chai";
import express from 'express';
import bodyParser from 'body-parser';
import {ObjectId} from 'mongodb';
import Tag from 'src/model/tag';
import routers from 'src/routers/tags';
import axios from 'axios';
import mongoose from "mongoose";
import {TagDto} from "../../dto/tag/tagDto";
import * as tagService from '../../services/tag';

const { expect } = chai;

chai.use(sinonChai);
chai.use(chaiHttp);
chai.should();

const sandbox = sinon.createSandbox();

const app = express();

app.use(bodyParser.json({ limit: '1mb' }));
app.use('/', routers);

describe('Tag controller', () => {

  afterEach(() => {
    sandbox.restore();
  });

  it('should save the tag', (done) => {
    const tagIdAfterSave = new ObjectId();
    const tag = {
      name: "Tag to save",
      postId: 1,
    };

    const axiosGetStub = sandbox.stub(axios, 'get').resolves({ status: 200 });

    const saveOneStub = sandbox.stub(Tag.prototype, 'save');
    saveOneStub.resolves({
      ...tag,
      _id: tagIdAfterSave,
    });

    chai.request(app)
      .post('/')
      .send(tag)
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        res.should.have.status(201);
        expect(res.body.id).to.equal(tagIdAfterSave.toString());
        expect(axiosGetStub).to.have.been.calledWith(`http://localhost:8081/api/v1/posts/${tag.postId}`);
        done();
      });
  });

  it('should list the tag by postId', (done) => {
    const tags = [
      {
        _id: new ObjectId().toString(),
        name: "Tag 1",
        postId: 1,
        createdAt: new Date("2024-05-22T15:49:10.778Z"),
      },
      {
        _id: new ObjectId().toString(),
        name: "Tag 2",
        postId: 1,
        createdAt: new Date("2020-06-22T15:49:10.778Z"),
      },
    ];

    const mockQuery: mongoose.Query<TagDto[], TagDto> = mongoose.Query.prototype;
    sandbox.stub(mockQuery, 'sort').returns(mockQuery);
    sandbox.stub(mockQuery, 'skip').returns(mockQuery);
    sandbox.stub(mockQuery, 'limit').resolves(tags as TagDto[]);

    sandbox.stub(Tag, 'find').returns(mockQuery);
    chai.request(app)
      .get('/1/2/0')
      .end((_, res) => {
        const actualTags = res.body.map((tag: TagDto) => ({
          ...tag,
          createdAt: new Date(tag.createdAt),
        }));
        expect(actualTags).to.deep.equal(tags);
        done();
      });
  });

  it('should count tags by post ID', (done) => {
    const postIds = [1, 2];
    const mockResult = { 'id1': 5, 'id2': 10 };

    sandbox.stub<any, any>(tagService, 'countTag').resolves(mockResult);

    chai.request(app)
      .post('/_counts')
      .send({ postIds })
      .end((err, res) => {
        if (err) return done(err);

        res.should.have.status(200);
        expect(res.body).to.deep.equal(mockResult);
        done();
      });
  });
});