import {describe, expect, test} from '@jest/globals'
import {updateMDS} from './downloadBlob'

describe('Validate MDS', () => {
    test('Update MDS to JWT', async () => {
        await expect(updateMDS('https://mds3.fidoalliance.org/',
                                 'https://secure.globalsign.net/cacert/Root-R3.crt'))
            .resolves.toBe(undefined)
    })
})

