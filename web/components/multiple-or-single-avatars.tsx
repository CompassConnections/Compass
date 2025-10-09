import { Avatar, AvatarSizeType } from 'web/components/widgets/avatar'
import { Col } from 'web/components/layout/col'
import { Row } from './layout/row'
import clsx from 'clsx'

export const MultipleOrSingleAvatars = (props: {
  avatars: Array<{ avatarUrl: string; id: string; name: string }>
  onClick?: () => void
  size: AvatarSizeType
  // TODO: standardize these numbers so they are calculated from the size
  spacing?: number
  startLeft?: number
  className?: string
}) => {
  const { avatars, className, onClick, size } = props

  if (avatars.length === 0) return null

  if (avatars.length === 1) {
    return <Avatar size={size} avatarUrl={avatars[0].avatarUrl} username={avatars[0].name} />
  }

  const totalAvatars = avatars.length
  const maxToShow = Math.min(totalAvatars, 3)
  const avatarsToCombine = avatars.slice(totalAvatars - maxToShow, totalAvatars)
  const max = avatarsToCombine.length
  const startLeft = (props.startLeft ?? 0.1) * (max - 1)
  const spacing = props.spacing ?? 0.3

  return (
    <Col
      onClick={onClick}
      className={clsx(`relative cursor-pointer items-center`, className)}
    >
      <Row>
        {avatarsToCombine.map((n, index) => (
          <div
            key={index}
            style={
              index > 0
                ? {
                    marginLeft: `${-startLeft + index * spacing}rem`,
                  }
                : {}
            }
          >
            <Avatar size={size} avatarUrl={n.avatarUrl} />
          </div>
        ))}
      </Row>
    </Col>
  )
}
