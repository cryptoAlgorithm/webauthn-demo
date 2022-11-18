// index file for updateMDS
import {updateAuthMetadata} from "./updateAuthMetadata";

const updateMDS = async (): Promise<number> => {
  return await updateAuthMetadata()
}

export default updateMDS
