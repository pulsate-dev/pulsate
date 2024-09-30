import { Result } from '@mikuroxina/mini-fn';
import type { Note } from '../../notes/model/note.js';
import type { ListID } from '../model/list.js';
import type {
  TimelineNotesCacheRepository,
  TimelineRepository,
} from '../model/repository.js';

export class ListTimelineService {
  constructor(
    private readonly timelineCacheRepository: TimelineNotesCacheRepository,
    private readonly timelineRepository: TimelineRepository,
  ) {}

  /**
   * @description Fetch list timeline notes\
   * TODO: add filter, pagination
   * @param listID ID of the list
   * @returns Note[] list of notes, sorted by CreatedAt descending
   */
  async handle(listID: ListID): Promise<Result.Result<Error, Note[]>> {
    const cachedNotesRes =
      await this.timelineCacheRepository.getListTimeline(listID);
    if (Result.isErr(cachedNotesRes)) {
      return cachedNotesRes;
    }
    const cachedNotes = Result.unwrap(cachedNotesRes);

    return await this.timelineRepository.fetchListTimeline(cachedNotes);
  }
}
