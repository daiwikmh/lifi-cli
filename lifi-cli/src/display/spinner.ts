import ora, { type Ora } from 'ora'

export async function withSpinner<T>(
  text: string,
  fn: (spinner: Ora) => Promise<T>
): Promise<T> {
  const spinner = ora(text).start()
  try {
    const result = await fn(spinner)
    spinner.succeed()
    return result
  } catch (err) {
    spinner.fail()
    throw err
  }
}
