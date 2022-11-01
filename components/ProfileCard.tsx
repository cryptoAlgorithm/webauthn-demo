import { ProfileProps } from '../pages/me';
import { Card, CardOverflow, Divider, Tooltip, Typography, Box, Sheet, Avatar } from '@mui/joy';
import { ReactElement } from 'react';

/**
 * Renders a profile card inspired by Discord's profile popover
 * @param id ID of user
 * @param name Name of user
 * @param email Email of user
 * @param avatarURL Avatar URL to display
 * @param credentialID Credential ID of the user's registered WebAuthn credential
 * @param children Optionally, provide children to be placed within the profile's content slot
 */
const ProfileCard = (
  { id, name, email, avatarURL, credentialID, children }: Partial<ProfileProps> & { children?: ReactElement }
) => {
  return <Card
    sx={{ width: 360, height: 'fit-content', bgcolor: 'background.level1', position: 'relative', boxShadow: 'lg' }}
    variant={'outlined'}
  >
    <CardOverflow sx={{
      backgroundImage: 'linear-gradient(to right, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
      height: 60,
      mb: '54px'
    }}>
      <Box top={14} left={14} position={'absolute'} overflow={'hidden'} display={'flex'}
           border={'6px solid var(--joy-palette-background-level1)'} borderRadius={'50%'}>
        <Avatar src={avatarURL} variant={'soft'} color={'primary'} sx={{ '--Avatar-size': '80px' }}/>
      </Box>
    </CardOverflow>

    <Card sx={{
      bgcolor: 'background.body', gap: '12px',
      '--Card-padding': '12px', '--Card-radius': '6px', boxShadow: 'none'
    }}>
      { /* Wrap children in a fragment since Card only accepts one child */ }
      <>
        <Tooltip title={
          <Box px={0.5}>
            <Typography level={'body2'}>User ID</Typography>
            { !id && <Sheet sx={{
              width: 200, height: 12, my: 1, borderRadius: 20,
              bgcolor: 'background.level2'
            }} /> }
            <Typography><code>{id}</code></Typography>
          </Box>
        } placement={'top'} variant={'outlined'} arrow>
          <Typography level={'h2'} fontSize={20} lineHeight={'20px'}>{name}</Typography>
        </Tooltip>

        <Divider inset={'none'} />

        <div>
          { email && <Typography level={'body2'}>Email</Typography> }
          { !email && <>
            <Sheet sx={{
              width: 20 + 10*Math.random() + '%', height: 14, mb: 1, borderRadius: 20,
              bgcolor: 'background.level3'
            }} />
            <Sheet sx={{
              width: 50 + 40*Math.random() + '%', height: 18, my: 0.5, borderRadius: 4,
              bgcolor: 'background.level2'
            }} />
          </> }
          <Typography>{email}</Typography>
        </div>

        <div>
          { credentialID && <Typography level={'body2'}>Credential ID</Typography> }
          { !credentialID && <>
            <Sheet sx={{
              width: 25 + 10*Math.random() + '%', height: 14, mb: 1, borderRadius: 20,
              bgcolor: 'background.level3'
            }} />
            <Sheet sx={{
              width: 60 + 40*Math.random() + '%', height: 18, my: 0.5, borderRadius: 4,
              bgcolor: 'background.level2'
            }} />
          </>}
          <Typography sx={{ lineBreak: 'anywhere' }}><code>{credentialID}</code></Typography>
        </div>

        { children }
      </>
    </Card>
  </Card>
}

export default ProfileCard