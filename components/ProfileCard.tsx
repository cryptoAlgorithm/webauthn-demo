import { ProfileProps } from '../pages/me';
import { Card, CardOverflow, Divider, Tooltip, Typography, Box } from '@mui/joy';
import Image from 'next/image';
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
  { id, name, email, avatarURL, credentialID, children }: ProfileProps & { children?: ReactElement }
) => {
  return <Card
    sx={{ width: 360, bgcolor: 'background.level1', position: 'relative', boxShadow: 'lg' }}
    variant={'outlined'}
  >
    <CardOverflow sx={{
      backgroundImage: 'linear-gradient(to right, var(--joy-palette-primary-500), var(--joy-palette-primary-600))',
      height: 60,
      mb: '54px'
    }}>
      <Image
        src={avatarURL} alt={''} width={92} height={92}
        style={{
          borderRadius: '50%',
          position: 'absolute',
          top: 14,
          left: 14,
          border: '6px solid var(--joy-palette-background-level1)'
        }}
      />
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
            <Typography><code>{id}</code></Typography>
          </Box>
        } placement={'top'} variant={'outlined'} arrow>
          <Typography level={'h2'} fontSize={20} lineHeight={'20px'}>{name}</Typography>
        </Tooltip>

        <Divider inset={'none'} />

        <div>
          <Typography level={'body2'}>Email</Typography>
          <Typography>{email}</Typography>
        </div>

        <div>
          <Typography level={'body2'}>Credential ID</Typography>
          <Typography sx={{ lineBreak: 'anywhere' }}><code>{credentialID}</code></Typography>
        </div>

        { children }
      </>
    </Card>
  </Card>
}

export default ProfileCard