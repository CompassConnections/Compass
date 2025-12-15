import {WithPrivateUser} from "web/components/user/with-user";
import {PrivateUser} from "common/user";
import {Col} from "web/components/layout/col";
import {IS_VERCEL} from "common/hosting/constants";
import Link from "next/link";

export const AboutSettings = () => (
  <WithPrivateUser>
    {user => <LoadedAboutSettings privateUser={user}/>}
  </WithPrivateUser>
)

const LoadedAboutSettings = (props: {
  privateUser: PrivateUser,
}) => {
  const {privateUser} = props

  return <Col>
    <WebBuildInfo/>
  </Col>
}

const WebBuildInfo = () => {
  if (!IS_VERCEL) return
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV
  const msg = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_MESSAGE
  const owner = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_OWNER
  const repo = process.env.NEXT_PUBLIC_VERCEL_GIT_REPO_SLUG
  const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  const deploymentId = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID
  const url = `https://github.com/${owner}/${repo}/commit/${sha}`
  return <Col>
    <h3>Web build (Vercel)</h3>
    <p>Commit SHA: <Link href={url}>{sha}</Link></p>
    <p>Commit message: {msg}</p>
    <p>Vercel deployment ID: {deploymentId}</p>
    <p>Environment: {env}</p>
  </Col>
}
