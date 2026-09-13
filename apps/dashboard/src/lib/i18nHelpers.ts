import i18n from './i18n'

export function getScanStatusLabel(status: string): string {
  return i18n.t(`scanStatus.${status}`, { defaultValue: status })
}
