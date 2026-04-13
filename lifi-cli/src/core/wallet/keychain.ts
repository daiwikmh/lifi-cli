const SERVICE = 'lifi-cli'

export async function storeSecret(account: string, secret: string): Promise<void> {
  const keytar = await import('keytar')
  await keytar.setPassword(SERVICE, account, secret)
}

export async function getSecret(account: string): Promise<string | null> {
  const keytar = await import('keytar')
  return keytar.getPassword(SERVICE, account)
}

export async function deleteSecret(account: string): Promise<void> {
  const keytar = await import('keytar')
  await keytar.deletePassword(SERVICE, account)
}
