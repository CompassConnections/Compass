export const tryCatch = async <T, E = Error>(promise: Promise<T>) => {
  try {
    return {data: await promise, error: null}
  } catch (e) {
    return {data: null, error: e as E}
  }
}
