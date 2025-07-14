import {base, en, Faker, ja} from "@faker-js/faker"

const INTEGRATION_TEST_DUMMY_DATA_SEED = parseInt(process.env.INTEGRATION_TEST_DUMMY_DATA_SEED ?? "1000");

export const faker = new Faker({
  locale: [ja, en, base],
  seed: INTEGRATION_TEST_DUMMY_DATA_SEED
})

