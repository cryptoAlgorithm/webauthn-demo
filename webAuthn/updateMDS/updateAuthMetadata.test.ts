import {describe, expect, test} from '@jest/globals'
import {updateAuthMetadata} from './updateAuthMetadata'
import {AUTHN_WHITELIST} from "../mds/authWhiteList";

describe('Validate MDS', () => {
  test('Update MDS to JWT', async () => {
      await expect(updateAuthMetadata()).resolves.toBe(AUTHN_WHITELIST.length)
    },
    300_000)
})

