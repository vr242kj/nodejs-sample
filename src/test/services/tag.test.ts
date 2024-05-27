import Tag from "../../model/tag";
import mongoSetup from "../mongoSetup";
import {TagSaveDto} from "../../dto/tag/tagSaveDto";
import sinon from "sinon";
import * as tagService from 'src/services/tag';
import chai from 'chai';
import axios from "axios";
import {ValidationError} from "../../system/validationError";
import {BadRequestError} from "../../system/badRequestError";
import {countTag, listTagsSortedByDescTime} from "src/services/tag";

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

  const testCases = [
    { name: 'missing postId', tagDto: { name: "Tag 2", createdAt: new Date("2024-05-22T15:49:10.778Z")}},
    { name: 'missing name', tagDto: { postId: 2, createdAt: new Date("2024-05-22T15:49:10.778Z")}},
    { name: 'missing both postId and name', tagDto: { createdAt: new Date("2024-05-22T15:49:10.778Z")}},
  ];

  testCases.forEach(({ name, tagDto }) => {
    it(`should throw ValidationError if ${name}`, (done) => {
      tagService.saveTag(tagDto)
        .then(() => {
          done(new Error('Expected method to reject.'));
        })
        .catch((error) => {
          try {
            expect(error).to.exist;
            expect(error).to.be.instanceOf(ValidationError);
            expect(error.message).to.include('Missing required fields');
            done();
          } catch (err) {
            done(err);
          }
        });
    });
  });

  it('should throw BadRequestError if parameters are invalid', async () => {
    const invalidParams = [
      { postId: NaN, size: 10, from: 0 },
      { postId: 1, size: NaN, from: 0 },
      { postId: 1, size: 10, from: NaN },
      { postId: 1, size: -1, from: 0 },
      { postId: 1, size: 10, from: -1 },
    ];

    for (const params of invalidParams) {
      try {
        await listTagsSortedByDescTime(params.postId, params.size, params.from);
        throw new Error('Expected method to reject.');
      } catch (error) {
        expect(error).to.be.instanceOf(BadRequestError);
      }
    }
  });

  it('should return tags sorted by createdAt in descending order', async () => {
    const result = await listTagsSortedByDescTime(1, 10, 0);

    expect(result).to.have.length(2);
    expect(result[0].createdAt).to.eql(new Date('2024-05-22T15:49:10.778Z'));
    expect(result[1].createdAt).to.eql(new Date('2020-06-22T15:49:10.778Z'));
  });

  it('should return paginated tag', async () => {
    const result = await listTagsSortedByDescTime(1, 1, 1);

    expect(result).to.have.length(1);
    expect(result[0].createdAt).to.eql(new Date('2020-06-22T15:49:10.778Z'));
  });

  it('should return only one tag', async () => {
    const result = await listTagsSortedByDescTime(1, 1, 0);

    expect(result).to.have.length(1);
    expect(result[0].createdAt).to.eql(new Date('2024-05-22T15:49:10.778Z'));
  });

  it('should throw BadRequestError if postIds is not an array', async () => {
    try {
      await countTag('not-an-array' as any);
      throw new Error('Expected method to reject.');
    } catch (error) {
      expect(error).to.be.instanceOf(BadRequestError);
    }
  });

  it('should throw BadRequestError if any postId is not a number', async () => {
    try {
      await countTag(['1', 'invalid-id']);
      throw new Error('Expected method to reject.');
    } catch (error) {
      expect(error).to.be.instanceOf(BadRequestError);
    }
  });

  it('should return correct count of tags for each postId', async () => {
    const expectedOutput = { id1: 2, id2: 1, id3: 0 };
    const result = await countTag(['1', '2', '3']);

    expect(result).to.deep.equal(expectedOutput);
  });
  // it('should throw NotFoundError when post id does not exist', async () => {
  //   const tagDto = {
  //     name: "Tag 1",
  //     postId: 999, // Assuming this postId does not exist
  //     createdAt: new Date("2024-05-22T15:49:10.778Z"),
  //   };
  //
  //   sandbox.stub(axios, 'get').rejects({ response: { status: 404 } });
  //
  //   try {
  //     await saveTag(tagDto);
  //
  //     throw new Error('Expected method to throw NotFoundError.');
  //   } catch (error: any) {
  //     expect(error).to.be.instanceOf(NotFoundError);
  //     expect(error.message).to.equal('Post id not found');
  //   }
  // });
});