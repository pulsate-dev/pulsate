import { Ether, Result } from '@mikuroxina/mini-fn';
import { expect, it } from 'vitest';
import { accountRepository } from '../accounts/adaptor/repository/shared.ts';
import { controller as accounts } from '../accounts/deps.ts';
import { AccountAlreadyFollowingError } from '../accounts/model/errors.ts';
import {
  dummyNormalAccount1,
  dummyNormalAccount2,
  dummyNormalAccount3,
  generateDummyAccount,
} from '../accounts/testData/testData.ts';
import {
  noteController,
  noteFetchServiceInstance,
  noteRepoEther,
} from './deps.ts';
import { noteHandlers } from './handler/notes.ts';
import { generateDummyNote } from './testData/testData.ts';

it('exposes internal note writes through the real GET dependencies', async () => {
  const note = generateDummyNote({ authorID: dummyNormalAccount1.getID() });
  const repository = Ether.runEther(noteRepoEther);
  Result.unwrap(await repository.create(note));
  const fetched = await noteFetchServiceInstance.fetchNoteByID(note.getID());
  expect(fetched[1]).toBe(note);
  const response = await noteHandlers.request(`/v0/notes/${note.getID()}`);
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    id: note.getID(),
    content: note.getContent(),
    author: { id: dummyNormalAccount1.getID() },
    attachment_files: [],
    reactions: [],
  });
  Result.unwrap(await repository.deleteByID(note.getID()));
});

it('observes account follow and unfollow mutations through the real GET dependencies', async () => {
  const author = dummyNormalAccount2;
  const viewer = dummyNormalAccount3;
  const note = generateDummyNote({
    authorID: author.getID(),
    visibility: 'FOLLOWERS',
  });
  const repository = Ether.runEther(noteRepoEther);
  Result.unwrap(await repository.create(note));
  const principal = { kind: 'account', accountId: viewer.getID() } as const;
  expect(
    Result.isErr(await noteController.getNoteByID(note.getID(), principal)),
  ).toBe(true);
  Result.unwrap(
    await accounts.followAccount(viewer.getName(), author.getName()),
  );
  expect(
    Result.unwrapErr(
      await accounts.followAccount(viewer.getName(), author.getName()),
    ),
  ).toBeInstanceOf(AccountAlreadyFollowingError);
  expect(
    Result.isOk(await noteController.getNoteByID(note.getID(), principal)),
  ).toBe(true);
  Result.unwrap(
    await accounts.unFollowAccount(viewer.getName(), author.getName()),
  );
  expect(
    Result.isErr(await noteController.getNoteByID(note.getID(), principal)),
  ).toBe(true);
  Result.unwrap(await repository.deleteByID(note.getID()));
});

it('observes newly created authors and their freeze state through the real GET dependencies', async () => {
  const author = generateDummyAccount();
  Result.unwrap(await Ether.runEther(accountRepository).create(author));
  const note = generateDummyNote({ authorID: author.getID() });
  const repository = Ether.runEther(noteRepoEther);
  Result.unwrap(await repository.create(note));
  expect(
    Result.isOk(
      await noteController.getNoteByID(note.getID(), { kind: 'anonymous' }),
    ),
  ).toBe(true);
  Result.unwrap(author.setFreeze(author.getID()));
  expect(
    Result.isErr(
      await noteController.getNoteByID(note.getID(), { kind: 'anonymous' }),
    ),
  ).toBe(true);
  Result.unwrap(await repository.deleteByID(note.getID()));
});
