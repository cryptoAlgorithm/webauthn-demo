import { ProfileProps } from '../pages/me';
import { Card, CardOverflow, Divider, Tooltip, Typography } from '@mui/joy';
import Image from 'next/image';

/**
 * Renders a profile card inspired by Discord's profile popover
 * @param id ID of user
 * @param name Name of user
 * @param email Email of user
 * @param avatarURL Avatar URL to display
 * @param credentialID Credential ID of the user's registered WebAuthn credential
 */
const ProfileCard = (
  { id, name, email, avatarURL, credentialID }: ProfileProps
) => {
  return <Card sx={{ width: 360, bgcolor: 'background.level1', position: 'relative' }} variant={'outlined'}>
    <CardOverflow sx={{ bgcolor: 'primary.600', height: 60, mb: '54px' }}>
      <Image src={avatarURL} alt={''} width={92} height={92}
             style={{
               borderRadius: '50%',
               position: 'absolute',
               top: 14,
               left: 14,
               border: '6px solid var(--joy-palette-background-level1)'
             }}
      />
    </CardOverflow>

    <Card sx={{ bgcolor: 'background.body', gap: '12px', '--Card-padding': '12px', '--Card-radius': '7px' }}>
      <Tooltip title={id} placement={'top'} variant={'soft'}>
        <Typography level={'h2'} fontSize={20} lineHeight={'20px'}>{name}</Typography>
      </Tooltip>

      <Divider inset={'none'} />

      <div>
        <Typography level={'body2'}>Email</Typography>
        <Typography>{email}</Typography>
      </div>

      <div>
        <Typography level={'body2'}>Credential ID</Typography>
        <Typography><code>{credentialID}</code></Typography>
      </div>
    </Card>
  </Card>
}

export default ProfileCard