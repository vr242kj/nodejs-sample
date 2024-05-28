import Tag from "../../model/tag";
import mongoSetup from "../mongoSetup";
import {TagSaveDto} from "../../dto/tag/tagSaveDto";
import sinon from "sinon";
import * as tagService from 'src/services/tag';
import chai from 'chai';
import axios from "axios";
import {ValidationError} from "../../system/validationError";
import {BadRequestError} from "../../system/badRequestError";
import {countTag, listTagsSortedByDescTime, saveTag} from "src/services/tag";
import {NotFoundError} from "../../system/notFoundError";

const { expect } = chai;

const sandbox = sinon.createSandbox();

const tag1 = new Tag({
  name: "Tag 1",
  postId: 1,
  createdAt: new Date("2024-05-22T15:49:10.778Z"),
});

const tag2 = new Tag({
  name: "Tag 2",
  postId: 1,
  createdAt: new Date("2020-06-22T15:49:10.778Z"),
});

const tag3 = new Tag({
  name: "Tag 3",
  postId: 2,
  createdAt: new Date("2019-06-22T15:49:10.778Z"),
});

describe('Tag Service', () => {
  before(async () => {
    /**
		 * The mongoSetup promise is resolved when the database is ready to be used.
		 * After it is resolved we can save all the needed data.
		 */
    await mongoSetup;

    await tag1.save();
    await tag2.save();
    await tag3.save();

  });

  afterEach(() => {
    sandbox.restore();
  });

  it('createTag should create a new tag and return its id', (done) => {
    const tagDto: TagSaveDto = {
      name: "Tag 1",
      postId: 5,
      createdAt: new Date("2024-05-22T15:49:10.778Z"),
    };

    sandbox.stub(axios, 'get').resolves({ status: 200 });

    tagService.saveTag(tagDto)
      .then(async (id) => {
        const tag = await Tag.findById(id);

        expect(tag).to.exist;
        expect(tag?.name).to.equal(tagDto.name);
        expect(tag?.postId).to.equal(tagDto.postId);
        expect(tag?.createdAt).to.eql(tagDto.createdAt);

        done();
      })
      .catch((error: Error) => done(error));
  });

  it('should throw NotFoundError when post id does not exist',  (done) => {
    const tagDto = {
      name: "Tag 1",
      postId: 999,
      createdAt: new Date("2024-05-22T15:49:10.778Z"),
    };
    const error = {
      response: {
        status: 404,
      },
      isAxiosError: true,
    };

    sandbox.stub(axios, 'get').rejects(error);

    saveTag(tagDto)
      .catch((error) => {
        expect(error).to.be.instanceOf(NotFoundError);
        expect(error.message).to.equal('Post id not found');
        done();
      });
  });

  const testCases = [
    { name: 'missing postId', tagDto: { name: "Tag 2", createdAt: new Date("2024-05-22T15:49:10.778Z")}},
    { name: 'missing name', tagDto: { postId: 2, createdAt: new Date("2024-05-22T15:49:10.778Z")}},
    { name: 'missing both postId and name', tagDto: { createdAt: new Date("2024-05-22T15:49:10.778Z")}},
  ];

  testCases.forEach(({ name, tagDto }) => {
    it(`should throw ValidationError if ${name}`, (done) => {

      saveTag(tagDto)
        .catch((error) => {
          expect(error).to.exist;
          expect(error).to.be.instanceOf(ValidationError);
          expect(error.message).to.include('Missing required fields');
          done();
        });
    });
  });

  it('should throw BadRequestError if parameters are invalid',  (done) => {
    const invalidParams = [
      { postId: NaN, size: 10, from: 0 },
      { postId: 1, size: NaN, from: 0 },
      { postId: 1, size: 10, from: NaN },
      { postId: 1, size: -1, from: 0 },
      { postId: 1, size: 10, from: -1 },
    ];

    // use this param due error: done() called multiple times in test
    const testCases = invalidParams.length;
    let completedCases = 0;

    for (const params of invalidParams) {
      listTagsSortedByDescTime(params.postId, params.size, params.from)
        .catch((error) => {
          expect(error).to.be.instanceOf(BadRequestError);
          completedCases++;
          if (completedCases === testCases) {
            done();
          }
        });
    }
  });

  it('should return tags sorted by createdAt in descending order',  (done) => {
    listTagsSortedByDescTime(1, 10, 0)
      .then(async (result) => {
        expect(result).to.have.length(2);
        expect(result[0].createdAt).to.eql(new Date('2024-05-22T15:49:10.778Z'));
        expect(result[1].createdAt).to.eql(new Date('2020-06-22T15:49:10.778Z'));
        done();
      })
      .catch((error: Error) => done(error));
  });

  it('should return paginated tag',  (done) => {
    listTagsSortedByDescTime(1, 1, 1)
      .then(async (result) => {
        expect(result).to.have.length(1);
        expect(result[0].createdAt).to.eql(new Date('2020-06-22T15:49:10.778Z'));
        done();
      })
      .catch((error: Error) => done(error));
  });

  it('should return only one tag',  (done) => {
    listTagsSortedByDescTime(1, 1, 0)
      .then(async (result) => {
        expect(result).to.have.length(1);
        expect(result[0].createdAt).to.eql(new Date('2024-05-22T15:49:10.778Z'));
        done();
      })
      .catch((error: Error) => done(error));
  });
  
  it('should throw BadRequestError if postIds is not an array',  (done) => {
    countTag('not-an-array' as any)
      .catch((error) => {
        expect(error).to.be.instanceOf(BadRequestError);
        done();
      });
  });

  it('should throw BadRequestError if any postId is not a number',  (done) => {
    countTag(['1', 'invalid-id'])
      .catch((error) => {
        expect(error).to.be.instanceOf(BadRequestError);
        done();
      });
  });

  it('should return correct count of tags for each postId',  (done) => {
    const expectedOutput = { id1: 2, id2: 1, id3: 0 };

    countTag(['1', '2', '3'])
      .then(async (result) => {
        expect(result).to.deep.equal(expectedOutput);
        done();
      })
      .catch((error: Error) => done(error));
  });
});