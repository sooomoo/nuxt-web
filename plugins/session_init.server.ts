import { equalBytes } from "@noble/ciphers/utils"

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:created', () => {
        const platform = useCookie('p')
        platform.value = '8'

        const sessionId = useCookie('sk')
        const clientKey = useCookie('ck')
        console.log('sk is :', sessionId.value)
        console.log('ck is :', clientKey.value)
        const pubKeys = decodeSecureString(sessionId.value || '')
        const priKeys = decodeSecureString(clientKey.value || '')
        if (!pubKeys.box || !pubKeys.sign || !priKeys.box || !priKeys.sign) {
            // 需要重新生成
            const boxKeyPair = newBoxKeyPair()
            const signKeyPair = newSignKeyPair()
            sessionId.value = encodeSecureString(signKeyPair.publicKey, boxKeyPair.publicKey)
            clientKey.value = encodeSecureString(signKeyPair.privateKey, boxKeyPair.privateKey)
            console.log(`【decodeSecrets】new sign keypair `, signKeyPair)
            console.log(`【decodeSecrets】new box keypair `, boxKeyPair)

            const pubKeys1 = decodeSecureString(sessionId.value)
            const priKeys1 = decodeSecureString(clientKey.value)
            console.log('xxxxxx sign', pubKeys1.sign, priKeys1.sign)
            console.log('xxxxxx box', pubKeys1.box, priKeys1.box)
            console.log('sign pub key eq', equalBytes(pubKeys1.sign!, signKeyPair.publicKey))
            console.log('box pub key eq', equalBytes(pubKeys1.box!, boxKeyPair.publicKey))
            console.log('sign pri key eq', equalBytes(priKeys1.sign!, signKeyPair.privateKey))
            console.log('box pri key eq', equalBytes(priKeys1.box!, boxKeyPair.privateKey))
        }
    })
})