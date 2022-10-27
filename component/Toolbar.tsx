import { Box, Button } from '@mui/joy';

/**
 * Toolbar component
 * Unfortunately doesn't exist as a prebuilt component yet
 * @constructor
 */
const Toolbar = () => {
  return <Box display={'flex'} top={0} left={0} right={0} position={'absolute'}>
    <Button>Back</Button>
  </Box>
}

export default Toolbar;