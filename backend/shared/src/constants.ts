export const getLocalEnv = () => {
  return (process.env.ENVIRONMENT?.toUpperCase() ?? 'DEV') as 'PROD' | 'DEV'
}